/**
 * AI服务模块
 *
 * 提供AI相关的功能服务，包括：
 * - 提示词优化：根据用户需求优化AI提示词
 * - 建议问题生成：基于对话历史生成可能的问题建议
 *
 * @module services/ai
 */

import { NotFoundException } from '@/exceptions';
import { db } from '@/lib/db';
import { message } from '@/lib/db/schema';
import { log } from '@/lib/logger';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { and, eq } from 'drizzle-orm';
import z from 'zod';

/**
 * 提示词优化模板
 * 定义了AI提示词工程师的角色、技能和约束条件
 */
const OPTIMIZE_PROMPT_TEMPLATE = `# 角色
你是一位AI提示词工程师，你商场根据用户的需求，优化和组成AI提示词。

## 技能
- 确定用户给出的原始提示词的语言和意图
- 根据用户的提示（如果有）优化提示词
- 返回给用户优化后的提示词
- 根据样本提示词示例参考并返回优化后的提示词。以下是一个优化后样式提示词示例:

<example>
# 角色
你是一个幽默的电影评论员，擅长用轻松的语言解释电影情节和介绍最新电影，你擅长把复杂的电影概念解释得各类观众都能理解。

## 技能
### 技能1: 推荐新电影
- 发现用户最喜欢的电影类型。
- 如果提到的电影是未知的，搜索(site:douban.com)以确定其类型。
- 使用googleWebSearch()在https://movie.douban.com/cinema/nowplaying/beijing/上查找最新上映的电影。
- 根据用户的喜好，推荐几部正在上映或即将上映的电影。格式示例:
====
 - 电影名称: <电影名称>
 - 上映日期: <中国上映日期>
 - 故事简介: <100字以内的剧情简介>
====

### 技能2: 介绍电影
- 使用search(site:douban.com)找到用户查询电影的详细信息。
- 如果需要，可以使用googleWebSearch()获取更多信息。
- 根据搜索结果创建电影介绍。

### 技能3: 解释电影概念
- 使用recallDataset获取相关信息，并向用户解释概念。
- 使用熟悉的电影来说明此概念。

## 限制
- 只讨论与电影相关的话题。
- 固定提供的输出格式。
- 保持摘要在100字内。
- 使用知识库内容，对于未知电影，使用搜索和浏览。
- 采用^^ Markdown格式来引用数据源。
</example>

## 约束
- 只回答和提示词创建或优化相关的内容，如果用户提出其他问题，不要回答。
- 只使用原始提示所使用的语言。
- 只使用用户使用的语言。
- 请按照示例结果返回数据，不要携带<example>标签。`;

/**
 * 建议问题生成模板
 * 用于指导AI根据对话历史预测用户可能的下一个问题
 */
const SUGGESTED_QUESTIONS_TEMPLATE =
  '请根据传递的历史信息预测人类最后可能会问的三个问题';

/**
 * 优化AI提示词
 *
 * 根据用户提供的原始提示词，使用AI提示词工程师的角色来优化和重构提示词，
 * 使其更加清晰、有效和结构化。
 *
 * @param prompt - 用户提供的原始提示词
 * @returns 返回一个异步生成器，用于流式输出优化后的提示词
 *
 * @example
 * ```typescript
 * const stream = await optimizePrompt("帮我写一个关于AI的文章");
 * for await (const chunk of stream) {
 *   console.log(chunk); // 输出优化后的提示词片段
 * }
 * ```
 */
export const optimizePrompt = async (prompt: string) => {
  // 创建提示词模板，包含系统角色定义和用户输入
  const promptTemplate = ChatPromptTemplate.fromMessages([
    ['system', OPTIMIZE_PROMPT_TEMPLATE],
    ['human', '{prompt}'],
  ]);

  // 初始化OpenAI聊天模型
  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_API_URL,
    },
    temperature: 0.5, // 设置适中的创造性，平衡一致性和创新性
  });

  // 构建处理链：模板 -> LLM -> 字符串解析器
  const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser());

  // 开始流式处理
  const stream = await chain.stream({
    prompt: prompt,
  });

  // 返回异步生成器，用于流式输出结果
  const iterator = async function* () {
    for await (const chunk of stream) {
      const data = {
        optimizePrompt: chunk,
      };
      // 使用Server-Sent Events格式输出数据
      yield `event: optimize_prompt\ndata: ${JSON.stringify(data)}\n\n`;
    }
  };
  return iterator();
};

/**
 * 建议问题输出的数据结构定义
 * 使用Zod进行运行时类型验证
 */
const suggestedQuestionsOutput = z
  .object({
    questions: z.array(z.string()).describe('建议问题列表，类型为字符串数组'),
  })
  .describe(
    '请帮我预测人类最可能会问的三个问题，并且每个问题都保持在50个字符以内。生成的内容必须是指定模式的JSON格式数组: ["问题1", "问题2", "问题3"]',
  );

/**
 * 生成建议问题
 *
 * 基于指定的消息历史，预测用户可能提出的后续问题。
 * 通过分析对话上下文，生成最多3个相关的建议问题。
 *
 * @param messageId - 消息ID，用于查询对话历史
 * @param userId - 用户ID，用于权限验证
 * @returns 返回建议问题数组，最多包含3个问题
 *
 * @throws {NotFoundException} 当消息不存在或无法生成建议问题时抛出
 *
 * @example
 * ```typescript
 * const questions = await generateSuggestedQuestions("msg_123", "user_456");
 * console.log(questions); // ["问题1", "问题2", "问题3"]
 * ```
 */
export const generateSuggestedQuestions = async (
  messageId: string,
  userId: string,
) => {
  // 查询指定消息记录，确保消息存在且属于当前用户
  const messageRecords = await db
    .select()
    .from(message)
    .where(and(eq(message.id, messageId), eq(message.createdBy, userId)));

  if (messageRecords.length === 0) {
    throw new NotFoundException('消息不存在');
  }

  const messageRecord = messageRecords[0];
  // 构建对话历史格式：Human: 用户问题\nAI: AI回答
  const history = `Human: ${messageRecord.query}\nAI: ${messageRecord.answer}`;

  // 创建提示词模板
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SUGGESTED_QUESTIONS_TEMPLATE],
    ['human', '{history}'],
  ]);

  // 初始化带结构化输出的LLM
  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_API_URL,
    },
    temperature: 0.5, // 适中的创造性，确保问题相关且多样化
  }).withStructuredOutput(suggestedQuestionsOutput); // 使用结构化输出确保返回格式正确

  // 构建处理链并执行
  const chain = prompt.pipe(llm);
  const suggestions = await chain.invoke({
    history,
  });

  // 验证输出结果
  if (!suggestions.questions) {
    log.error('无法生成建议问题: %o', suggestions);
    throw new NotFoundException('无法生成建议问题');
  }

  // 返回最多3个建议问题
  return suggestions.questions.slice(0, 3);
};
