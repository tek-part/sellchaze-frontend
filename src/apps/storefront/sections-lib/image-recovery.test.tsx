// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
vi.mock('./i18n', () => ({ useLocaleCode: () => 'en', useLibT: () => (key: string) => key }));
import { LibImage } from './primitives';
it('keeps an image failure scoped to that URL when a merchant replaces the image', async () => {
 (globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true;
 const node=document.createElement('div');document.body.appendChild(node);const root=createRoot(node);
 try {
  await act(async()=>root.render(createElement(LibImage,{src:'https://merchant.example/missing.png',alt:'Merchant photo'})));
  await act(async()=>{node.querySelector('img')!.dispatchEvent(new Event('error'));});
  expect(node.querySelector('img')).toBeNull();expect(node.querySelector('[role=img]')?.getAttribute('aria-label')).toBe('Merchant photo');
  await act(async()=>root.render(createElement(LibImage,{src:'https://merchant.example/replacement.png',alt:'New photo'})));
  expect(node.querySelector('img')?.getAttribute('src')).toBe('https://merchant.example/replacement.png');expect(node.querySelector('img')?.alt).toBe('New photo');
 } finally {await act(async()=>root.unmount());node.remove();}
});
