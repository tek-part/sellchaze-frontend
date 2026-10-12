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

export function appendFooterPages(base: ReadonlyArray<FooterGroup>, pages: ReadonlyArray<NavItem>, title: string, replaceDefaultPolicies = false): FooterGroup[] {
  const replacements = new Map(pages.filter((page) => ['/policies/shipping', '/policies/returns'].includes(key(page.url))).map((page) => [key(page.url).replace('/policies/', '/pages/'), page]));
  const groups = replaceDefaultPolicies ? base.map((group) => ({ ...group, links: group.links.map((link) => {
    const policy = replacements.get(key(link.url)); return policy ? { label: policy.label, url: policy.url } : link;
  }) })) : [...base];
  const used = new Set(groups.flatMap((group) => group.links.map((link) => key(link.url))));
  const links: Array<{ label: string; url: string }> = [];
  for (const page of pages) if (!used.has(key(page.url))) { links.push({ label: page.label, url: page.url }); used.add(key(page.url)); }
  return links.length ? [...groups, { title, links }] : groups;
}
