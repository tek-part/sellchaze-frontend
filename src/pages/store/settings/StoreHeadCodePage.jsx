import { useRef } from 'react';
import { Navigate } from 'react-router-dom';
import CodeEditor from '@uiw/react-textarea-code-editor/nohighlight';
import rehypePrismGenerator from 'rehype-prism-plus/generator';
import { refractor } from 'refractor/lib/core.js';
import markup from 'refractor/lang/markup.js';
import css from 'refractor/lang/css.js';
import clike from 'refractor/lang/clike.js';
import javascript from 'refractor/lang/javascript.js';
import '@uiw/react-textarea-code-editor/dist.css';
import useStoreContext from '../../../hooks/useStoreContext';
import useStoreSettings from '../../../hooks/useStoreSettings';
import useWorkspaceAppearance from '../../../components/workspace/useWorkspaceAppearance';
import MerchantSettingsFeedback from '../../../components/store/MerchantSettingsFeedback';
import MerchantSettingsSave from '../../../components/store/MerchantSettingsSave';
import { HiOutlineExclamationTriangle, HiOutlineInformationCircle, HiOutlinePlay, HiOutlineXMark } from '../../../components/workspace/WorkspaceIcons';
import './merchant-head-code.css';

for (const language of [markup, css, clike, javascript]) refractor.register(language);
const headSyntax = [[rehypePrismGenerator(refractor), { ignoreMissing: true }]];

export default function StoreHeadCodePage() {
    const context = useStoreContext();
    return <HeadEditor key={context.apiBase} context={context} />;
}
function HeadEditor({ context }) {
    const state = useStoreSettings({ endpoint: 'head-code', enabled: context.access.canStoreHeadCode });
    const { ar, text, initial, draft, change, loading, busy, save } = state;
    const dialog = useRef(null);
    const appearance = useWorkspaceAppearance();
    if (!context.access.canStoreHeadCode) return <Navigate to={`${context.uiBase}/overview`} replace />;
    const title = text('اضافة كود للهيد', 'Add head code');
    const dirty = Boolean(draft && initial && draft.html !== initial.html);
    return <div dir={ar ? 'rtl' : 'ltr'}><MerchantSettingsFeedback state={state} /><section className="ws-settings-card ws-head-code">
        <header className="ws-settings-card-heading"><div><h2>{title}</h2><p>{text('يمكنك استخدام كود الهيد في توثيق موقعك علي جوجل او فيسبوك او يمكنك اضافة اكواد برمجية مثل برامج التعقب او بعض السكربتات', 'Use head code to verify your site on Google or Facebook, or add tracking and other scripts.')}</p></div><button className="ws-settings-help" onClick={() => dialog.current?.showModal()}><HiOutlinePlay aria-hidden /><span>{title}</span></button></header>
        <div className="ws-head-note ws-head-note--warning"><HiOutlineExclamationTriangle aria-hidden /><span>{text('ملحوظة لا تقم باضافة كود جوجل اناليتكس هنا او جوجل تاج مانجر بل قم باضافتهم في الاداة المخصصة لهم في جزء ربط بمنصات اخري', 'Add Google Analytics and Google Tag Manager through their dedicated tracking tools instead of this field.')}</span></div>
        {!loading && draft ? <form onSubmit={(event) => { event.preventDefault(); if (dirty && !busy) save(draft); }}><fieldset disabled={busy}>
            <h3>{text('كود الهيد', 'Head code')}</h3><div className="ws-head-editor" dir="ltr"><CodeEditor data-color-mode={appearance.theme} aria-label={text('كود الهيد', 'Head code')} language="html" rehypePlugins={headSyntax} padding={15} value={draft.html} onChange={(event) => change({ ...draft, html: event.target.value })} readOnly={busy} maxLength={65535} spellCheck={false} style={{ height: 400, fontSize: 14, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }} /></div>
            <p className="ws-head-caption">{text('سيتم وضع هذا الكود في الهيد', 'This code will be placed in the document head.')}</p>
            <div className="ws-head-note ws-head-note--info"><HiOutlineInformationCircle aria-hidden /><span>{text('الكود بالاعلي بلغة html اذا اردت وضع كود جافاسكربت يمكنك وضعه عن طريق اضافته داخل تاج <script> </script> واذا اردت اضافة كود css يمكنك اضافته عن طريق وضعه داخل <style> </style>', 'The code above is HTML. Put JavaScript inside <script> </script> and CSS inside <style> </style>.')}</span></div>
            <MerchantSettingsSave ar={ar} busy={busy} disabled={!dirty || busy} />
        </fieldset></form> : null}
    </section><dialog className="ws-settings-help-dialog" ref={dialog} aria-label={title}><header><h2>{title}</h2><button onClick={() => dialog.current?.close()} aria-label={text('إغلاق', 'Close')}><HiOutlineXMark aria-hidden /></button></header>
        <p>{text('الصق وسم توثيق الموقع كما هو، أو أضف سكربتًا داخل <script> ونمطًا داخل <style>. اضغط حفظ ثم أعد فتح المتجر العام للتحقق من النتيجة.', 'Paste a site verification tag, or add JavaScript inside <script> and styles inside <style>. Save and reopen the live storefront to check the result.')}</p>
        <p>{text('اترك الحقل فارغًا واحفظ لإزالة الكود. استخدم إعدادات أدوات التتبع المخصصة لجوجل أناليتكس وتاج مانجر.', 'Clear the field and save to remove the code. Use the dedicated tracking tools for Google Analytics and Tag Manager.')}</p>
    </dialog></div>;
}
