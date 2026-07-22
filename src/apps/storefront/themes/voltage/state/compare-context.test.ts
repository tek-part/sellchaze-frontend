/** Voltage compare-set pure transition — add/remove/capacity semantics. */
import { describe, expect, it } from 'vitest';
import type { ProductCardModel } from '../../../types/catalog';
import { toggleCompare } from './compare-context';

const p = (id: string): ProductCardModel => ({ id, handle: id, title: id, url: `/p/${id}`, price: 1, currency: 'USD' });

describe('toggleCompare', () => {
  it('adds a product that is not present', () => {
    expect(toggleCompare([], p('a')).map((x) => x.id)).toEqual(['a']);
    expect(toggleCompare([p('a')], p('b')).map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('removes a product that is already present (by id)', () => {
    expect(toggleCompare([p('a'), p('b')], p('a')).map((x) => x.id)).toEqual(['b']);
  });

  it('does not exceed the max when adding', () => {
    const full = [p('a'), p('b'), p('c'), p('d')];
    expect(toggleCompare(full, p('e'), 4).map((x) => x.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('still removes from a full set (toggle off works at capacity)', () => {
    const full = [p('a'), p('b'), p('c'), p('d')];
    expect(toggleCompare(full, p('c'), 4).map((x) => x.id)).toEqual(['a', 'b', 'd']);
  });

  it('respects a custom max', () => {
    expect(toggleCompare([p('a'), p('b')], p('c'), 2).map((x) => x.id)).toEqual(['a', 'b']);
  });
});
