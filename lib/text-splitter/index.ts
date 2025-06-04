/**
 * 文本分割和清理工具模块
 * 提供文本分割和预处理功能，用于处理文档文本
 */

import type { processRule } from '@/lib/db/schema';
import { PreProcessRuleId } from '@/schemas/document-schema';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * 处理规则类型定义
 */
type Rule = {
  preProcessRules: {
    id: PreProcessRuleId;
    enabled: boolean;
  }[];
  segment: {
    separators: string[]; // 文本分割的分隔符
    chunkSize: number; // 每个文本块的大小
    chunkOverlap: number; // 文本块之间的重叠大小
  };
};

/**
 * 创建文本分割器
 * @param processRuleRecord - 处理规则记录
 * @param lengthFunction - 计算文本长度的函数
 * @returns 配置好的文本分割器实例
 */
export const createTextSplitter = (
  processRuleRecord: typeof processRule.$inferSelect,
  lengthFunction: (text: string) => number,
) => {
  const rule = processRuleRecord.rule as Rule;
  return new RecursiveCharacterTextSplitter({
    chunkSize: rule.segment.chunkSize,
    chunkOverlap: rule.segment.chunkOverlap,
    separators: rule.segment.separators,
    lengthFunction,
  });
};

/**
 * 清理文本内容
 * 根据预定义规则对文本进行清理和预处理
 * @param processRuleRecord - 处理规则记录
 * @param text - 需要清理的文本
 * @returns 清理后的文本
 */
export const cleanText = (
  processRuleRecord: typeof processRule.$inferSelect,
  text: string,
) => {
  const rule = processRuleRecord.rule as Rule;
  let cleanedText = text;
  for (const preProcessRule of rule.preProcessRules) {
    if (
      preProcessRule.id === PreProcessRuleId.RemoveExtraSpace &&
      preProcessRule.enabled
    ) {
      // 将3个或更多连续换行符替换为2个换行符
      cleanedText = cleanedText.replace(/\n{3}/g, '\n\n');
      // 将2个或更多连续空白字符（包括制表符、换页符、回车符、空格等Unicode空白字符）替换为单个空格
      cleanedText = cleanedText.replace(
        /[\t\f\r\x20\u00a0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000]{2,}/g,
        ' ',
      );
    }

    if (
      preProcessRule.id === PreProcessRuleId.RemoveUrlAndEmail &&
      preProcessRule.enabled
    ) {
      // 移除电子邮件地址
      // 匹配格式：username@domain.tld
      cleanedText = cleanedText.replace(
        /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g,
        '',
      );
      // 移除URL和mailto链接
      // 匹配以http://或https://开头的URL，以及mailto:开头的邮件链接
      cleanedText = cleanedText.replace(/https?:\/\/[^\s]+|mailto:[^\s]+/g, '');
    }
  }
  return cleanedText;
};
