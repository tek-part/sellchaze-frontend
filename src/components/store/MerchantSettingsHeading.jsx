import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineQuestionMarkCircle, HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './merchant-settings-frame.css';

export default function MerchantSettingsHeading({ title, description, help }) {
    const dialog = useRef(null);
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    return <header className="ws-settings-card-heading">
        <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
        {help ? <><button type="button" className="ws-settings-help" onClick={() => dialog.current?.showModal()}><HiOutlineQuestionMarkCircle aria-hidden /><span>{ar ? 'شرح الإعدادات العامة' : 'General settings guide'}</span></button>
            <dialog className="ws-settings-help-dialog" ref={dialog} aria-label={ar ? 'شرح الإعدادات العامة' : 'General settings guide'}><header><h2>{ar ? 'شرح الإعدادات العامة' : 'General settings guide'}</h2><button type="button" onClick={() => dialog.current?.close()} aria-label={ar ? 'إغلاق' : 'Close'}><HiOutlineXMark aria-hidden /></button></header>
                <p>{ar ? 'اختر اللغة والعملة، وحدّث عنوان المتجر ولونه وشعاره. اترك نص الهيدر فارغًا لإخفائه.' : 'Choose the language and currency, and update your store title, color and logo. Leave the header text empty to hide it.'}</p>
                <p>{ar ? 'سعر الشحن الافتراضي يُستخدم عند عدم وجود منطقة أو خيار شحن. حدود الكمية تطبق على كل منتج، وحد الهاتف يُحسب خلال 24 ساعة.' : 'The default shipping price applies when no delivery region or shipping option overrides it. Quantity limits apply per product; phone limits cover 24 hours.'}</p>
                <p>{ar ? 'اضغط حفظ لتطبيق التغييرات. عند ظهور تعارض، أعد تحميل آخر الإعدادات قبل التعديل مجددًا.' : 'Save to apply your changes. If there is a conflict, reload the latest settings before editing again.'}</p>
            </dialog></> : null}
    </header>;
}
