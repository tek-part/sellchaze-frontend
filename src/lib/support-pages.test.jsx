// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SupportTicketsPage from '../features/support/SupportTicketsPage';
import SupportNewTicketPage from '../features/support/SupportNewTicketPage';
import SupportTicketPage from '../features/support/SupportTicketPage';
import { validateFiles } from '../features/support/supportShared';
import { mapServerNotification } from '../utils/mapServerNotification';
import { merchantWorkspaceRouteAllowed } from './merchantWorkspaceRoutes';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ i18n: { language: 'en' }, t: (key, fallback) => (typeof fallback === 'string' ? fallback : key) }) }));

let root, host;
beforeEach(() => {
    vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

const setValue = (el, value) => {
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
};

const ticket = { id: 7, reference: 'SC-ABC12345', subject: 'Domain not connecting', category: 'domain', priority: 'normal', status: 'awaiting_merchant', unread: true, last_reply_at: new Date().toISOString(), created_at: new Date().toISOString(), owner: null, store: null, assignee: null };

describe('merchant support', () => {
    it('lists the merchant tickets with unread state and links to each thread', async () => {
        api.get.mockResolvedValue({ data: { data: [ticket], meta: { last_page: 1 } } });
        await act(async () => root.render(<MemoryRouter><SupportTicketsPage /></MemoryRouter>));
        expect(api.get).toHaveBeenCalledWith('/support/tickets', { params: expect.objectContaining({ status: 'active', page: 1 }) });
        expect(host.textContent).toContain('Domain not connecting');
        expect(host.textContent).toContain('Waiting for your reply');
        expect(host.querySelector('a[href="/support/7"]')).not.toBeNull();
        expect(host.querySelector('a[href="/support/new"]')).not.toBeNull();
    });

    it('opens a ticket with the preset category and goes to the new thread', async () => {
        api.post.mockResolvedValue({ data: { data: { id: 12 } } });
        await act(async () => root.render(<MemoryRouter initialEntries={['/support/new?category=domain']}><Routes>
            <Route path="/support/new" element={<SupportNewTicketPage />} />
            <Route path="/support/:id" element={<p>thread-page</p>} />
        </Routes></MemoryRouter>));
        expect(host.querySelector('select').value).toBe('domain');
        await act(async () => {
            setValue(host.querySelector('input:not([type="file"])'), 'Domain not connecting');
            setValue(host.querySelector('textarea'), 'The custom domain still shows the old site.');
        });
        await act(async () => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
        const [url, form] = api.post.mock.calls[0];
        expect(url).toBe('/support/tickets');
        expect(form.get('category')).toBe('domain');
        expect(form.get('subject')).toBe('Domain not connecting');
        expect(host.textContent).toContain('thread-page');
    });

    it('shows the conversation and lets the merchant close it', async () => {
        api.get.mockResolvedValue({ data: { data: { ...ticket, messages: [
            { id: 1, body: 'Help please', is_staff: false, author: { name: 'Mona' }, attachments: [], created_at: ticket.created_at },
            { id: 2, body: 'Check the CNAME', is_staff: true, author: { name: 'Omar' }, attachments: [{ name: 'dns.png', size: 2048, url: '/support/tickets/7/messages/2/attachments/0' }], created_at: ticket.created_at },
        ] } } });
        api.post.mockResolvedValue({ data: { data: { ...ticket, status: 'closed', messages: [] } } });
        await act(async () => root.render(<MemoryRouter initialEntries={['/support/7']}><Routes><Route path="/support/:id" element={<SupportTicketPage />} /></Routes></MemoryRouter>));
        expect(host.textContent).toContain('Check the CNAME');
        expect(host.textContent).toContain('Sellchaze team');
        expect(host.textContent).toContain('dns.png');
        const close = [...host.querySelectorAll('button')].find((b) => b.textContent.includes('close the ticket'));
        await act(async () => close.click());
        expect(api.post).toHaveBeenCalledWith('/support/tickets/7/close');
        expect(host.textContent).toContain('This ticket is closed.');
    });

    it('rejects unsupported or oversized attachments before upload', () => {
        const text = (_ar, en) => en;
        expect(validateFiles([new File(['x'], 'run.exe', { type: 'application/x-msdownload' })], text)).toMatch(/not supported/);
        const big = new File(['x'], 'big.png', { type: 'image/png' });
        Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 });
        expect(validateFiles([big], text)).toMatch(/larger than 5 MB/);
        expect(validateFiles([new File(['x'], 'ok.pdf', { type: 'application/pdf' })], text)).toBe('');
    });

    it('routes support notifications only to support paths and allows /support for merchants', () => {
        const t = (key, fallback) => (typeof fallback === 'string' ? fallback : key);
        const row = (data) => ({ id: 1, read_at: null, created_at: ticket.created_at, data });
        expect(mapServerNotification(row({ type: 'support_ticket', event: 'replied', ticket_id: 7, reference: 'SC-1', subject: 'Help', url: '/support/7' }), t).link).toBe('/support/7');
        expect(mapServerNotification(row({ type: 'support_ticket', event: 'created', ticket_id: 7, url: 'https://evil.test' }), t).link).toBeUndefined();
        expect(merchantWorkspaceRouteAllowed('/support/new')).toBe(true);
    });
});
