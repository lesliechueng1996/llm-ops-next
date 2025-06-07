import { describe, expect, it } from 'bun:test';
import { vectorStoreCollection } from '@/lib/vector-store';

describe('vectorStore', () => {
  it('should get collection', async () => {
    const collection = await vectorStoreCollection();
    console.log(collection);
    expect(collection).toBeDefined();
  });
});
