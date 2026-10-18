// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import type { SectionRenderProps } from '../../theme-engine/rendering';
vi.mock('../../sections-lib/i18n', () => ({ useLocaleCode: () => 'en', useLibT: () => (key: string) => key }));
import { NatureFaq } from './sections';
it('links FAQ buttons to their answers, switches the open answer and escapes merchant copy', async () => {
 (globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true;
 const container = document.createElement('div'); document.body.appendChild(container); const root = createRoot(container);
 const props = { instance: { id: 'faq', type: 'nature-pets-faq' }, settings: { title: 'Questions', items: [{ question: 'First question', answer: '<script>bad</script>' }, { question: 'Second question', answer: 'Second answer' }] }, context: { store: { name: 'Test', currency: 'EGP' }, seo: {}, navigation: { header: [], footer: [] }, data: {} } } as SectionRenderProps;
 try {
  await act(async () => root.render(createElement(NatureFaq, props)));
  const buttons = [...container.querySelectorAll('button')];
  expect(buttons[0]?.getAttribute('aria-expanded')).toBe('true');
  const firstId = buttons[0]!.getAttribute('aria-controls')!; expect(document.getElementById(firstId)?.textContent).toBe('<script>bad</script>'); expect(container.querySelector('script')).toBeNull();
  await act(async () => buttons[1]!.click());
  expect(buttons[0]?.getAttribute('aria-expanded')).toBe('false'); expect(document.getElementById(firstId)?.hidden).toBe(true);
  const second = document.getElementById(buttons[1]!.getAttribute('aria-controls')!)!; expect(second.hidden).toBe(false); expect(second.textContent).toBe('Second answer');
  await act(async () => buttons[1]!.click()); expect(second.hidden).toBe(true);
 } finally { await act(async () => root.unmount()); container.remove(); }
});
