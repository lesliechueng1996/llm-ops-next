/**
 * 文件提取器模块
 *
 * 该模块提供了从各种文件格式中提取文本内容的功能。
 * 支持的文件格式包括：CSV、DOCX、DOC、JSON、PDF、PPTX 和纯文本文件。
 * 对于不支持的文件格式，默认使用 UnstructuredLoader 进行处理。
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { withTempFile } from '@/lib/file-util';
import { log } from '@/lib/logger';
import { downloadFile } from '@/services/upload-file/cos-service';
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { PPTXLoader } from '@langchain/community/document_loaders/fs/pptx';
import { UnstructuredLoader } from '@langchain/community/document_loaders/fs/unstructured';
import type { DocumentLoader } from '@langchain/core/document_loaders/base';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { TextLoader } from 'langchain/document_loaders/fs/text';

/**
 * 从本地文件加载内容
 * @param filePath - 文件路径
 * @param returnText - 是否只返回文本内容，默认为 false
 * @param isUnstructured - 是否使用 UnstructuredLoader 处理未知格式，默认为 true
 * @returns 文档数组或文本内容
 */
export const loadFromFile = async (
  filePath: string,
  returnText = false,
  isUnstructured = true,
) => {
  const fileExtension = path.extname(filePath).toLowerCase();
  let loader: DocumentLoader;
  if (fileExtension === '.csv') {
    loader = new CSVLoader(filePath);
  } else if (fileExtension === '.docx') {
    loader = new DocxLoader(filePath);
  } else if (fileExtension === '.doc') {
    loader = new DocxLoader(filePath, {
      type: 'doc',
    });
  } else if (fileExtension === '.json') {
    loader = new JSONLoader(filePath);
  } else if (fileExtension === '.pptx') {
    loader = new PPTXLoader(filePath);
  } else if (!isUnstructured) {
    loader = new TextLoader(filePath);
  } else {
    loader = new UnstructuredLoader(filePath, {
      apiUrl: process.env.UNSTRUCTURED_API_URL,
    });
  }

  const docs = await loader.load();
  if (returnText) {
    return docs.map((doc) => doc.pageContent).join('\n\n');
  }

  return docs;
};

/**
 * 从文件键加载内容
 * @param fileKey - 文件键（用于从存储服务下载）
 * @param returnText - 是否只返回文本内容，默认为 false
 * @param isUnstructured - 是否使用 UnstructuredLoader 处理未知格式，默认为 true
 * @returns 文档数组或文本内容
 */
export const load = async (
  fileKey: string,
  returnText = false,
  isUnstructured = true,
) => {
  return withTempFile(fileKey, async (tempFilePath) => {
    await downloadFile(fileKey, tempFilePath);
    return loadFromFile(tempFilePath, returnText, isUnstructured);
  });
};

/**
 * 从 URL 加载文件内容
 * @param url - 文件的 URL 地址
 * @param returnText - 是否只返回文本内容，默认为 false
 * @returns 文档数组或文本内容
 * @throws 当文件下载失败时抛出错误
 */
export const loadFromUrl = async (url: string, returnText = false) => {
  const response = await fetch(url);
  if (!response.ok) {
    log.error(
      'Failed to fetch file from URL: %s, status: %s',
      url,
      response.status,
    );
    throw new Error(`Failed to fetch file from URL: ${url}`);
  }

  const fileKey = path.basename(url);
  return withTempFile(fileKey, async (tempFilePath) => {
    const fileData = await response.arrayBuffer();
    await fs.writeFile(tempFilePath, Buffer.from(fileData));
    return loadFromFile(tempFilePath, returnText);
  });
};
