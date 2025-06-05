import { describe, expect, it } from 'bun:test';
import { cacheBackedEmbeddings, calculateTokenCount } from '@/lib/embedding';

describe('embeddings', () => {
  it('should be defined', async () => {
    const res = await cacheBackedEmbeddings.embedQuery('Hello, world!');
    console.log(res);
    console.log(res.length);
    expect(res).toBeDefined();
  });

  it('calculateTokenCount', () => {
    const text = 'Hello, world!';
    const tokenCount = calculateTokenCount(text);
    console.log(tokenCount);
    expect(tokenCount).toBe(4);
  });
});
