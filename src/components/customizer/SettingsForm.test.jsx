// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import SettingsForm from './SettingsForm';
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key, fallback) => fallback }) }));

it('edits nested specification lists with independent caps and deep copies when a panel is duplicated', async () => {
    const field = { id: 'panels', label: 'Image panels', type: 'list', max: 2, item: [
        { id: 'title', type: 'text', label: 'Panel name' },
        { id: 'labels', label: 'Specifications', type: 'list', max: 2, item: [{ id: 'label', type: 'text', label: 'Label' }, { id: 'value', type: 'text', label: 'Value' }] },
    ] };
    const original = { panels: [{ title: 'Front', labels: [{ label: 'Width', value: '30 cm' }] }] };
    let latest;
    function Review() {
        const [values, setValues] = useState(original);
        latest = values;
        return <SettingsForm fields={[field]} values={values} onChange={setValues} locales={['en']} defaultLocale="en" editLocale="en" />;
    }
    const element = document.createElement('div'); document.body.append(element); const root = createRoot(element);
    await act(async () => root.render(<Review />));
    const group = label => element.querySelector(`[role=group][aria-label="${label}"]`);
    const buttons = label => [...group(label).querySelectorAll('button')];
    expect(group('Specifications').querySelectorAll('input')).toHaveLength(2);
    expect(group('Specifications').querySelectorAll('input')[1].value).toBe('30 cm');
    await act(async () => buttons('Specifications').find(button => button.getAttribute('aria-label') === 'Duplicate').click());
    expect(latest.panels[0].labels).toHaveLength(2);
    expect(latest.panels[0].labels[1]).not.toBe(latest.panels[0].labels[0]);
    expect(buttons('Specifications').at(-1).disabled).toBe(true);
    const outerDuplicate = [...group('Image panels').children[0].querySelectorAll('button')].find(button => button.getAttribute('aria-label') === 'Duplicate');
    await act(async () => outerDuplicate.click());
    expect(latest.panels).toHaveLength(2);
    expect(latest.panels[1].labels).toHaveLength(2);
    expect(latest.panels[1].labels[0]).not.toBe(latest.panels[0].labels[0]);
    await act(async () => buttons('Specifications').find(button => button.getAttribute('aria-label') === 'Remove').click());
    expect(latest.panels[1].labels).toHaveLength(1);
    expect(latest.panels[0].labels).toHaveLength(2);
    expect(original.panels[0].labels).toHaveLength(1);
    await act(async () => root.unmount()); element.remove();
});
