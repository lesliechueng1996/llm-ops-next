/**
 * 应用草稿配置 API 路由处理模块
 *
 * 该模块提供了两个主要功能：
 * 1. 获取应用的草稿配置信息 (GET)
 * 2. 更新应用的草稿配置信息 (PATCH)
 *
 * 草稿配置是应用的临时配置，用于在正式发布前进行配置的测试和调整。
 * 当应用发布或更新时，草稿配置会同步到正式配置中。
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updateDraftAppConfigReqSchema } from '@/schemas/app-schema';
import { getDraftAppConfig, updateDraftAppConfig } from '@/services/app-config';

// 定义路由参数类型
type Params = { params: Promise<{ appId: string }> };

/**
 * @swagger
 * /api/apps/{appId}/draft-app-config:
 *   get:
 *     tags:
 *       - Apps
 *     summary: 获取特定应用的草稿配置信息
 *     description: 该接口用于获取指定应用的配置信息，并且永远只获取草稿配置，在创建应用的时候会同步创建草稿信息，并且在应用发布亦或者更新的时候，均会同步配置信息到草稿配置中，并且每次获取草稿配置的时候，都会检测关联的 `知识库`、`工具`、`工作流` 是否存在，如果不存在，则会清除对应数据后返回。
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 应用 id，类型为 uuid
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: 应用配置 id，类型为 uuid
 *                     modelConfig:
 *                       type: object
 *                       description: 大语言模型配置，存储了 LLM 相关的配置信息
 *                       properties:
 *                         provider:
 *                           type: string
 *                           description: 模型提供者名字，例如 openai、moonshot，后端会根据不同的提供商名字获取不同的服务
 *                         model:
 *                           type: string
 *                           description: 模型名字，例如 gpt-4o-mini 等
 *                         parameters:
 *                           type: object
 *                           description: 大模型运行参数信息，每个 LLM 均有差异，一般都携带 temperature、top_p、presence_penalty、frequency_penalty、max_tokens 等内容
 *                     dialogRound:
 *                       type: integer
 *                       description: 携带上下上下文轮数，最小为 0，最大为 100，设置该数值后，后端会同时计算不同 LLM 的上下文长度进行取舍
 *                     presetPrompt:
 *                       type: string
 *                       description: 人设与回复逻辑预设 prompt
 *                     tools:
 *                       type: array
 *                       description: 应用绑定的工具列表
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             description: 关联工具的类型，值可能为 builtin_tool(内置工具) 或者 api_tool(API工具)
 *                           provider:
 *                             type: object
 *                             description: 工具提供者信息
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 description: 提供者标识，当类型为内置工具时，id 为名字，当为 API 工具时，id 为 uuid 标识
 *                               name:
 *                                 type: string
 *                                 description: 提供者名字
 *                               label:
 *                                 type: string
 *                                 description: 提供者标签，如果为 API 工具，则 label 为 name
 *                               icon:
 *                                 type: string
 *                                 description: 提供者对应的图标 URL 地址
 *                               description:
 *                                 type: string
 *                                 description: 提供者描述信息
 *                           tool:
 *                             type: object
 *                             description: 工具信息
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 description: 工具 uuid，当类型为内置工具时，id 为工具名字，当为 API 工具时，id 为 uuid 标识
 *                               name:
 *                                 type: string
 *                                 description: 工具名字
 *                               label:
 *                                 type: string
 *                                 description: 工具的标签，如果为 API 工具，则 label 为 name
 *                               description:
 *                                 type: string
 *                                 description: 工具描述
 *                               params:
 *                                 type: object
 *                                 description: 可选参数，内置工具的 自定义设置 参数，用于初始化对应的工具，如果没有参数时输入为空字典即可
 *                     workflows:
 *                       type: array
 *                       description: 应用绑定的工作流列表
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: 关联的工作流 id
 *                           name:
 *                             type: string
 *                             description: 关联的工作流名字
 *                           icon:
 *                             type: string
 *                             description: 关联的工作流图标 URL
 *                           description:
 *                             type: string
 *                             description: 关联的工作流描述
 *                     datasets:
 *                       type: array
 *                       description: 应用关联的知识库列表，一个应用最多不能关联超过 5 个知识库
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: 关联的知识库 id
 *                           name:
 *                             type: string
 *                             description: 关联知识库的名称
 *                           icon:
 *                             type: string
 *                             description: 关联知识库的图标 URL 地址
 *                           description:
 *                             type: string
 *                             description: 关联的知识库描述信息
 *                     retrievalConfig:
 *                       type: object
 *                       description: 检索配置，记录检索策略、最大召回数量、得分阈值
 *                       properties:
 *                         retrievalStrategy:
 *                           type: string
 *                           description: 检索策略，支持的值为 full_text(全文/关键词检索)、semantic(向量/相似性检索)、hybrid(混合检索)
 *                         k:
 *                           type: integer
 *                           description: 最大召回数量，数据范围为 0-10，必填参数
 *                         score:
 *                           type: number
 *                           format: float
 *                           description: 最小匹配度，范围从 0-1，保留 2 位小数，数字越大表示相似度越高
 *                     longTermMemory:
 *                       type: object
 *                       description: 长期记忆配置
 *                       properties:
 *                         enable:
 *                           type: boolean
 *                           description: 是否启用，true 代表启用，false 代表未启用
 *                     openingStatement:
 *                       type: string
 *                       description: 对话开场白，在初次对话时 Agent 会发送的消息，最大长度不超过 2000
 *                     openingQuestions:
 *                       type: array
 *                       description: 对话建议问题列表，在初次对话时 Agent 会推送的建议问题，问题数量不超过 3 个
 *                       items:
 *                         type: string
 *                     speechToText:
 *                       type: object
 *                       description: 语音输入配置
 *                       properties:
 *                         enable:
 *                           type: boolean
 *                           description: 是否启用语音输入，true 代表启用，false 代表未启用
 *                     textToSpeech:
 *                       type: object
 *                       description: 语音输出配置
 *                       properties:
 *                         enable:
 *                           type: boolean
 *                           description: 是否启用语音输出，true 代表启用，false 代表未启用
 *                         voice:
 *                           type: string
 *                           description: 语音输出音色，数据值参考 OpenAI 提供的 TTS 接口提供的音色配置，例如：echo 等
 *                         autoPlay:
 *                           type: boolean
 *                           description: 是否自动播放，true 代表自动播放，当值为 true 时，WebApp 会在生成完毕时自动调用并获取音频信息随后自动播放（流式播放）
 *                     reviewConfig:
 *                       type: object
 *                       description: 审核配置信息
 *                       properties:
 *                         enable:
 *                           type: boolean
 *                           description: 是否启用审核，true 代表启用，false 代表未启用，只有当 enable 为 True 时，inputsConfig 和 outputsConfig 开启才有意义
 *                         keywords:
 *                           type: array
 *                           description: 审核关键词列表，最多不超过 100 个关键词
 *                           items:
 *                             type: string
 *                         inputsConfig:
 *                           type: object
 *                           description: 输入审核配置信息
 *                           properties:
 *                             enable:
 *                               type: boolean
 *                               description: 是否启用输入审核，true 代表启用，false 代表未启用
 *                             presetResponse:
 *                               type: string
 *                               description: 触发输入敏感词时的预设回复，对于输入审核的逻辑，如果存在敏感词，则直接使用预设回复进行相应
 *                         outputsConfig:
 *                           type: object
 *                           description: 输出审核配置信息
 *                           properties:
 *                             enable:
 *                               type: boolean
 *                               description: 是否启用输出审核，true 代表启用，false 代表未启用，当值为 true 时，触发敏感词时，会使用 ** 代替特定的敏感词进行输出
 *                     updatedAt:
 *                       type: integer
 *                       description: 草稿配置的更新时间，类型为时间戳
 *                     createdAt:
 *                       type: integer
 *                       description: 草稿配置的创建时间，类型为时间戳
 *                 message:
 *                   type: string
 *                   example: 获取草稿应用配置成功
 */
export async function GET(_: Request, { params }: Params) {
  try {
    const [{ userId }, { appId }] = await Promise.all([verifyApiKey(), params]);
    const draftAppConfig = await getDraftAppConfig(appId, userId);
    return successResult(draftAppConfig, 200, '获取草稿应用配置成功');
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * @swagger
 * /api/apps/{appId}/draft-app-config:
 *   patch:
 *     tags:
 *       - Apps
 *     summary: 更新应用的草稿配置信息
 *     description: 更新应用的草稿配置信息，在前端 UI 页面中，当数据发生更新的时候，会调用该 API 接口将草稿信息同步到对应 Agent 应用的草稿配置中，同时该接口是增量更新，可以只传递需要更新的字段信息。
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 应用 id，类型为 uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modelConfig:
 *                 type: object
 *                 description: Agent 应用使用的 LLM 参数信息
 *                 properties:
 *                   provider:
 *                     type: string
 *                     description: 模型提供者名字，例如：openai、moonshot 等
 *                   model:
 *                     type: string
 *                     description: 对应模型提供者下的模型名字，例如：gpt-4o-mini、moonshot-8k 等
 *                   parameters:
 *                     type: object
 *                     description: 大模型运行参数信息，每个 LLM 均有差异
 *               dialogRound:
 *                 type: integer
 *                 description: 携带上下上下文轮数，最小为 0，最大为 100
 *               presetPrompt:
 *                 type: string
 *                 description: 人设与回复逻辑预设 prompt，最大长度不超过 2000 个字符
 *               tools:
 *                 type: array
 *                 description: 应用绑定的工具列表信息
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: 工具类型，支持两种值：builtin_tool(内置工具)、api_tool(API工具)
 *                     providerId:
 *                       type: string
 *                       description: 提供者 id，当为内置工具时，提供者 id 为 provider_name，否则为 id
 *                     toolId:
 *                       type: string
 *                       description: 工具 id，当为内置工具时，工具 id 为 tool_name，否则为 id
 *                     params:
 *                       type: object
 *                       description: 内置工具自定义参数，如果为 API工具或者无需设置自定义参数，则值设置为空字典
 *               workflows:
 *                 type: array
 *                 description: 应用绑定的工作流 ID 列表
 *                 items:
 *                   type: string
 *                   format: uuid
 *               datasets:
 *                 type: array
 *                 description: 应用绑定的知识库 ID 列表
 *                 items:
 *                   type: string
 *                   format: uuid
 *               retrievalConfig:
 *                 type: object
 *                 description: 检索设置
 *                 properties:
 *                   retrievalStrategy:
 *                     type: string
 *                     description: 检索策略，支持的值为 full_text(全文/关键词检索)、semantic(向量/相似性检索)、hybrid(混合检索)
 *                   k:
 *                     type: integer
 *                     description: 最大召回数量，数据范围为 0-10
 *                   score:
 *                     type: number
 *                     format: float
 *                     description: 最小匹配度，范围从 0-1，保留 2 位小数
 *               longTermMemory:
 *                 type: object
 *                 description: 长期记忆配置
 *                 properties:
 *                   enable:
 *                     type: boolean
 *                     description: 是否启用，true 代表启用，false 代表未启用
 *               openingStatement:
 *                 type: string
 *                 description: 对话开场白，在初次对话时 Agent 会发送的消息，最大长度不超过 2000
 *               openingQuestions:
 *                 type: array
 *                 description: 对话建议问题列表，在初次对话时 Agent 会推送的建议问题，问题数量不超过 3 个
 *                 items:
 *                   type: string
 *               speechToText:
 *                 type: object
 *                 description: 语音输入配置
 *                 properties:
 *                   enable:
 *                     type: boolean
 *                     description: 是否启用语音输入，true 代表启用，false 代表未启用
 *               textToSpeech:
 *                 type: object
 *                 description: 语音输出配置
 *                 properties:
 *                   enable:
 *                     type: boolean
 *                     description: 是否启用语音输出，true 代表启用，false 代表未启用
 *                   voice:
 *                     type: string
 *                     description: 语音输出音色，数据值参考 OpenAI 提供的 TTS 接口提供的音色配置
 *                   autoPlay:
 *                     type: boolean
 *                     description: 是否自动播放，true 代表自动播放
 *               reviewConfig:
 *                 type: object
 *                 description: 审核配置信息
 *                 properties:
 *                   enable:
 *                     type: boolean
 *                     description: 是否启用审核，true 代表启用，false 代表未启用
 *                   keywords:
 *                     type: array
 *                     description: 审核关键词列表，最多不超过 100 个关键词
 *                     items:
 *                       type: string
 *                   inputsConfig:
 *                     type: object
 *                     description: 输入审核配置信息
 *                     properties:
 *                       enable:
 *                         type: boolean
 *                         description: 是否启用输入审核
 *                       presetResponse:
 *                         type: string
 *                         description: 触发输入敏感词时的预设回复
 *                   outputsConfig:
 *                     type: object
 *                     description: 输出审核配置信息
 *                     properties:
 *                       enable:
 *                         type: boolean
 *                         description: 是否启用输出审核
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: 更新草稿应用配置成功
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const [{ userId }, { appId }, body] = await Promise.all([
      verifyApiKey(),
      params,
      request.json(),
    ]);
    const data = updateDraftAppConfigReqSchema.parse(body);
    await updateDraftAppConfig(appId, userId, data);
    return successResult({}, 200, '更新草稿应用配置成功');
  } catch (error) {
    return handleRouteError(error);
  }
}
