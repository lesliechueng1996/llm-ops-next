/**
 * 关键词提取模块，基于 nodejieba 分词库。
 *
 * 提供 extractKeywords 方法用于从文本中提取关键词。
 */
import nodejieba from 'nodejieba';

// 加载 nodejieba 词典，初始化分词器
nodejieba.load();

/**
 * 从给定文本中提取关键词。
 *
 * @param text - 需要提取关键词的文本内容
 * @param maxKeywords - 最大关键词数量，默认为 10
 * @returns 提取出的关键词数组
 */
export const extractKeywords = (text: string, maxKeywords = 10) => {
  // 使用 nodejieba 提取关键词，返回包含关键词和权重的对象数组
  const keywords = nodejieba.extract(text, maxKeywords);
  // 只返回关键词字符串数组
  return keywords.map((item) => item.word);
};
