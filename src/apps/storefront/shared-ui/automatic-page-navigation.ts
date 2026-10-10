import type { FooterGroup, NavItem } from '../types/navigation';

const key = (url: string): string => (url.split(/[?#]/)[0] ?? '').replace(/\/+$/, '');

function headerUrls(items: ReadonlyArray<NavItem>): Set<string> {
  const urls = new Set<string>();
  for (const item of items) {
    urls.add(key(item.url));
    for (const url of headerUrls(item.children ?? [])) urls.add(url);
    for (const column of item.columns ?? []) for (const url of headerUrls(column.items)) urls.add(url);
  }
  return urls;
}

export function appendHeaderPages(base: ReadonlyArray<NavItem>, pages: ReadonlyArray<NavItem>): NavItem[] {
  const used = headerUrls(base); const result = [...base];
  for (const page of pages) if (!used.has(key(page.url))) { result.push(page); used.add(key(page.url)); }
  return result;
}

export function appendFooterPages(base: ReadonlyArray<FooterGroup>, pages: ReadonlyArray<NavItem>, title: string): FooterGroup[] {
  const used = new Set(base.flatMap((group) => group.links.map((link) => key(link.url))));
  const links: Array<{ label: string; url: string }> = [];
  for (const page of pages) if (!used.has(key(page.url))) { links.push({ label: page.label, url: page.url }); used.add(key(page.url)); }
  return links.length ? [...base, { title, links }] : [...base];
}
