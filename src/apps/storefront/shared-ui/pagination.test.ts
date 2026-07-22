/**
 * buildRange is the only non-obvious logic in the shared Pagination — it decides when a page list
 * collapses to ellipses. Getting it wrong strands users on unreachable pages, which is the defect
 * pagination was added to fix, so it is pinned here.
 */
import { describe, expect, it } from 'vitest';
import { buildRange } from './Pagination';

describe('buildRange', () => {
  it('lists every page when the range is short enough to fit', () => {
    expect(buildRange(1, 5, 1)).toEqual([1, 2, 3, 4, 5]);
    expect(buildRange(3, 7, 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('collapses the tail when the current page is near the start', () => {
    expect(buildRange(2, 20, 1)).toEqual([1, 2, 3, 'end-ellipsis', 20]);
  });

  it('collapses the head when the current page is near the end', () => {
    expect(buildRange(19, 20, 1)).toEqual([1, 'start-ellipsis', 18, 19, 20]);
  });

  it('collapses both sides in the middle', () => {
    expect(buildRange(10, 20, 1)).toEqual([1, 'start-ellipsis', 9, 10, 11, 'end-ellipsis', 20]);
  });

  it('always includes the first and last page', () => {
    for (const page of [1, 5, 12, 20]) {
      const tokens = buildRange(page, 20, 1);
      expect(tokens[0]).toBe(1);
      expect(tokens[tokens.length - 1]).toBe(20);
    }
  });

  it('never repeats a page number', () => {
    const tokens = buildRange(10, 20, 2).filter((t): t is number => typeof t === 'number');
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it('widens with a larger sibling count', () => {
    expect(buildRange(10, 20, 2)).toEqual([1, 'start-ellipsis', 8, 9, 10, 11, 12, 'end-ellipsis', 20]);
  });
});
