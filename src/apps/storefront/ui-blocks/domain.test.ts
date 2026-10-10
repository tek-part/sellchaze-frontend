import { describe, expect, it } from 'vitest';
import { currentUiBlocks, UI_BLOCK_SLOTS, type UiBlocksData } from './domain';

const content: UiBlocksData = { enabled: true, blocks: Object.fromEntries(UI_BLOCK_SLOTS.map((slot) => [slot, `<p>${slot}</p>`])) as UiBlocksData['blocks'] };
describe('Current UI-block presentation', () => {
  it('discards content during language/route/store changes and failed or pending refreshes', () => {
    const query = { data: { key: 'store1/ar/home', data: { data: content } }, loading: false, error: null };
    expect(currentUiBlocks(query, 'store1/ar/home')).toEqual(content);
    for (const key of ['store1/en/home', 'store1/ar/product', 'store2/ar/home']) expect(currentUiBlocks(query, key)).toBeNull();
    expect(currentUiBlocks({ ...query, loading: true }, query.data.key)).toBeNull();
    expect(currentUiBlocks({ ...query, error: new Error('Network unavailable') }, query.data.key)).toBeNull();
  });
  it('removes disabled blocks without turning deliberately empty slots into demo content', () => {
    expect(currentUiBlocks({ data: { key: 'x', data: { data: { ...content, enabled: false } } }, loading: false, error: null }, 'x')).toBeNull();
    const blank = { ...content, blocks: { ...content.blocks, after_header: '' } };
    expect(currentUiBlocks({ data: { key: 'x', data: { data: blank } }, loading: false, error: null }, 'x')?.blocks.after_header).toBe('');
    expect(currentUiBlocks({ data: null, loading: false, error: null }, 'x')).toBeNull();
  });
});
