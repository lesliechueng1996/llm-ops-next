/**
 * @jest-environment node
 */
import * as fileExtractor from '@/lib/file-extractor';
import path from 'node:path';

describe('fileExtractor', () => {
  const fixturesPath = path.join(__dirname, '__fixtures__');

  describe('loadFromFile', () => {
    it('should load text from txt file', async () => {
      // const filePath = path.join(fixturesPath, 'sample.pdf');
      const result = await fileExtractor.loadFromUrl(
        'https://cdn.openai.com/API/docs/deep_research_blog.pdf',
        false,
      );
      console.log(result);
      expect(result).toBeDefined();
    });
  });
});
