import { hashText } from '@/lib/file-util';
import { describe, it, expect } from 'bun:test';

describe('fileUtil', () => {
  it('should hash text', () => {
    const text = 'Hello, world!';
    const hash1 = hashText(text);
    const hash2 = hashText(text);
    expect(hash1).toBe(hash2);
  });
});
