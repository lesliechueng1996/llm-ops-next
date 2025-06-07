import { describe, expect, it } from 'bun:test';
import { extractKeywords } from '@/lib/keyword';

describe('extractKeywords', () => {
  it('should extract keywords from text', () => {
    const text = 'Hello, world!';
    const keywords = extractKeywords(text);
    expect(keywords).toEqual(['Hello', 'world']);
  });
});
