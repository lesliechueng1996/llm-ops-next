import { vectorStoreCollection } from '@/lib/vector-store';
import { describe, it, expect } from 'bun:test';

describe('vectorStore', () => {
  it('should get collection', async () => {
    const collection = await vectorStoreCollection();
    console.log(collection);
    expect(collection).toBeDefined();
  });
});
