import { describe, expect, it } from 'bun:test';
import path from 'node:path';
/**
 * @jest-environment node
 */
import * as fileExtractor from '@/lib/file-extractor';

describe('fileExtractor', () => {
  const fixturesPath = path.join(__dirname, '__fixtures__');

  describe('loadFromFile', () => {
    it('should load text from md file', async () => {
      const filePath = path.join(fixturesPath, 'sample.md');
      // const result = await fileExtractor.loadFromUrl(
      //   'https://cdn.openai.com/API/docs/deep_research_blog.pdf',
      //   false,
      // );
      const result = await fileExtractor.loadFromFile(filePath);
      console.log(result.length);
      expect(result).toBeDefined();
    });
  });
});
