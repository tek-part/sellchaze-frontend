import { describe, expect, it } from 'vitest';
import {
  arrangeColumns, describeFilter, moveKey, rangeBetween, readState, toApiParams, toCsv, viewChanged, viewStateOf, writeState,
  type FilterDef,
} from './state';

const defs: FilterDef[] = [
  { key: 'status', label: 'Status', type: 'multi', options: [{ value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }] },
  { key: 'stock', label: 'Stock', type: 'select', options: [{ value: 'in', label: 'In stock' }, { value: 'out', label: 'Out of stock' }] },
  { key: 'price', label: 'Price', type: 'range' },
  { key: 'created', label: 'Created', type: 'date-range', param: 'created' },
  { key: 'vendor', label: 'Vendor', type: 'text' },
];
const defaults = { sort: { by: 'created_at', direction: 'desc' as const }, perPage: 25 };

describe('URL state', () => {
  it('round-trips through the query string and omits defaults', () => {
    const state = readState(new URLSearchParams('view=low&q=shirt&sort=price:asc&page=3&per=50&f.status=active,draft&f.stock=out&f.price=10..&f.created=2026-01-01..2026-02-01&f.vendor=Nile'), defs, defaults);
    expect(state).toEqual({ view: 'low', search: 'shirt', sort: { by: 'price', direction: 'asc' }, page: 3, perPage: 50,
      filters: { status: ['active', 'draft'], stock: 'out', price: { min: '10', max: '' }, created: { min: '2026-01-01', max: '2026-02-01' }, vendor: 'Nile' } });
    expect(new URLSearchParams(writeState(state, defs, defaults)).toString())
      .toBe('view=low&q=shirt&sort=price%3Aasc&page=3&per=50&f.status=active%2Cdraft&f.stock=out&f.price=10..&f.created=2026-01-01..2026-02-01&f.vendor=Nile');
    expect(writeState(readState(new URLSearchParams(''), defs, defaults), defs, defaults)).toEqual([]);
  });

  it('drops values the filter does not offer and invalid paging', () => {
    const state = readState(new URLSearchParams('f.status=active,hacked&f.stock=nope&page=-2&per=7&sort=price:sideways'), defs, defaults);
    expect(state.filters).toEqual({ status: ['active'] });
    expect(state.page).toBe(1);
    expect(state.perPage).toBe(25);
    expect(state.sort).toEqual(defaults.sort);
  });
});

describe('API params', () => {
  it('maps to the dashboard list conventions', () => {
    const state = readState(new URLSearchParams('q=%20shirt%20&f.status=active,draft&f.price=10..50&f.created=2026-01-01..'), defs, defaults);
    expect(toApiParams(state, defs)).toEqual({ page: 1, per_page: 25, search: 'shirt', sort_by: 'created_at', sort_direction: 'desc',
      status: 'active,draft', price_min: '10', price_max: '50', created_from: '2026-01-01' });
  });
});

describe('chips and views', () => {
  it('lets custom filters describe their own value', () => {
    expect(describeFilter({ key: 'product', label: 'Product', type: 'custom', describe: (id) => `#${id}` }, '12')).toBe('Product: #12');
  });

  it('describes filters with option labels and open ranges', () => {
    expect(describeFilter(defs[0], ['active', 'draft'])).toBe('Status: Active, Draft');
    expect(describeFilter(defs[2], { min: '10', max: '50' })).toBe('Price: 10 – 50');
    expect(describeFilter(defs[2], { min: '', max: '50' }, { to: 'up to' })).toBe('Price: up to 50');
  });

  it('detects when the list differs from the saved view, ignoring order and empty values', () => {
    const state = readState(new URLSearchParams('f.status=active&f.stock=out&page=4'), defs, defaults);
    const view = { search: '', sort: null, filters: { stock: 'out', status: ['active'], vendor: '' } };
    expect(viewChanged(state, view, defaults)).toBe(false);
    expect(viewChanged({ ...state, search: 'x' }, view, defaults)).toBe(true);
    expect(viewStateOf(state, ['name'])).toEqual({ search: '', sort: defaults.sort, filters: { status: ['active'], stock: 'out' }, columns: ['name'] });
  });
});

describe('columns and selection', () => {
  const columns = [{ key: 'name', hideable: false }, { key: 'status' }, { key: 'price' }, { key: 'sku', defaultHidden: true }];

  it('applies saved order and visibility, appending new columns', () => {
    expect(arrangeColumns(columns).map((c) => c.key)).toEqual(['name', 'status', 'price']);
    expect(arrangeColumns(columns, { order: ['price', 'gone', 'name'], hidden: ['status', 'name'] }).map((c) => c.key)).toEqual(['price', 'name', 'sku']);
    expect(moveKey(['a', 'b', 'c'], 'c', -1)).toEqual(['a', 'c', 'b']);
    expect(moveKey(['a', 'b', 'c'], 'a', -1)).toEqual(['a', 'b', 'c']);
  });

  it('selects an inclusive range in either direction', () => {
    expect(rangeBetween([1, 2, 3, 4, 5], 4, 2)).toEqual([2, 3, 4]);
    expect(rangeBetween([1, 2, 3], 9, 2)).toEqual([2]);
  });
});

describe('CSV', () => {
  it('quotes, neutralises formulas and keeps Arabic with a BOM', () => {
    expect(toCsv(['الاسم', 'Note'], [['قميص', '=SUM(A1)'], ['a,b', 'say "hi"']]))
      .toBe('﻿الاسم,Note\r\nقميص,\'=SUM(A1)\r\n"a,b","say ""hi"""\r\n');
  });
});
