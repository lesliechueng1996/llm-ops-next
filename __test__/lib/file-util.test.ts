import { describe, expect, it } from 'bun:test';
import { hashText } from '@/lib/file-util';

describe('fileUtil', () => {
  it('should hash text', () => {
    const text = 'Hello, world!';
    const hash1 = hashText(text);
    const hash2 = hashText(text);
    expect(hash1).toBe(hash2);
  });
});
