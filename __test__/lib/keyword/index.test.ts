import { extractKeywords } from '@/lib/keyword';
import { describe, it, expect } from 'bun:test';

describe('extractKeywords', () => {
  it('should extract keywords from text', () => {
    const text = 'Hello, world!';
    const keywords = extractKeywords(text);
    expect(keywords).toEqual(['Hello', 'world']);
  });
});
