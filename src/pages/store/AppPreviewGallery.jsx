import { useRef, useState } from 'react';
import { useAppCopy } from './StoreAppsPage';

function ConceptPreview({ app, index, width, height }) {
    const { text, localized } = useAppCopy();
    if (app.key === 'downsell') {
        return <svg className="ws-app-concept" viewBox="0 0 752 501" width={width} height={height} role="img" aria-label={text(`معاينة توضيحية لعرض الخصم ${index + 1}`, `Illustrative discount preview ${index + 1}`)}>
            <rect width="752" height="501" rx="8" fill="#bfeecb" /><path d="M0 0H128L38 501H0Z" fill="#0abb45" />
            <text x="44" y="54" fill="#064c29" fontSize="24" fontWeight="600" direction="ltr">Sellchaze</text>
            <rect x="154" y="106" width="444" height="300" rx="24" fill="#f4fff7" stroke="#090c50" />
            <text x="376" y="155" textAnchor="middle" fill="#090c50" fontSize="26" fontWeight="500">{index === 0 ? text('عرض خاص لاستكمال الطلب', 'An offer to complete the order') : text('تخصيص ظهور العرض', 'Customize the offer display')}</text>
            {index === 0 ? <><rect x="188" y="224" width="376" height="48" rx="24" fill="#e0f9e8" stroke="#0abb45" /><text x="376" y="256" textAnchor="middle" fill="#064c29" fontSize="20">{text('كوبون المتجر', 'Store coupon')}</text><rect x="188" y="302" width="376" height="52" rx="26" fill="#090c50" /><text x="376" y="336" textAnchor="middle" fill="#fff" fontSize="20">{text('متابعة التسوق', 'Continue shopping')}</text></> : <>{[text('توقيت ظهور العرض', 'Offer timing'), text('الكوبون المرتبط', 'Linked coupon'), text('مظهر النافذة', 'Window appearance')].map((label, row) => <g key={label}><rect x="188" y={194 + row * 58} width="376" height="42" rx="8" fill="#e0f9e8" /><text x="376" y={222 + row * 58} textAnchor="middle" fill="#064c29" fontSize="18">{label}</text></g>)}</>}
            <text x="376" y="454" textAnchor="middle" fill="#064c29" fontSize="18">{text('تصور توضيحي', 'Illustrative concept')}</text>
        </svg>;
    }
    return <svg className="ws-app-concept" viewBox="0 0 752 501" width={width} height={height} role="img" aria-label={text(`معاينة توضيحية: ${localized(app.title)}`, `Illustrative preview: ${localized(app.title)}`)}>
        <rect width="752" height="501" rx="8" fill="#bfeecb" />
        <path d="M0 0H128L38 501H0Z" fill="#0abb45" />
        <path d="M752 501H606L692 0H752Z" fill="#14c857" opacity=".5" />
        <text x="54" y="54" fill="#064c29" fontSize="24" fontWeight="600" direction="ltr">Sellchaze</text>
        <rect x="162" y="100" width="428" height="302" rx="24" fill="#f4fff7" />
        {app.icon ? <image href={app.icon} x="330" y="124" width="92" height="92" /> : <path d="M351 147H401V173H379V199H351Z" fill="#0abb45" />}
        <text x="376" y="258" textAnchor="middle" fill="#10351f" fontSize="24" fontWeight="500">{localized(app.title)}</text>
        {index === 0 ? <><rect x="202" y="283" width="348" height="12" rx="6" fill="#d1ebd9" /><rect x="230" y="311" width="292" height="12" rx="6" fill="#d1ebd9" /></> : <>{[248, 352, 456].map((left, stage) => <g key={left}><circle cx={left} cy="302" r="24" fill="#0abb45" /><text x={left} y="310" textAnchor="middle" fill="#fff" fontSize="20">{stage + 1}</text></g>)}</>}
        <rect x="238" y="349" width="276" height="28" rx="14" fill="#0abb45" />
        <text x="376" y="454" textAnchor="middle" fill="#064c29" fontSize="18">{text(`تصور توضيحي ${index + 1}`, `Illustrative concept ${index + 1}`)}</text>
    </svg>;
}

export default function AppPreviewGallery({ app }) {
    const { ar, text } = useAppCopy();
    const [active, setActive] = useState(0);
    const [failed, setFailed] = useState([]);
    const buttons = useRef([]);
    const gallery = app.gallery?.length ? app.gallery : [{ kind: 'concept', width: 752, height: 501 }];
    const selected = gallery[active] || gallery[0];
    const illustration = (item, index, thumbnail = false) => item.kind === 'image' && !failed.includes(index)
        ? <img src={item.src} width={item.width} height={item.height} alt={thumbnail ? '' : text(`معاينة التطبيق ${index + 1}`, `App preview ${index + 1}`)} onError={() => setFailed((before) => [...before, index])} />
        : <ConceptPreview app={app} index={index} width={item.width} height={item.height} />;

    function navigate(event) {
        const steps = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: ar ? 1 : -1, ArrowRight: ar ? -1 : 1 };
        if (gallery.length < 2 || !(event.key in steps || ['Home', 'End'].includes(event.key))) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? gallery.length - 1 : (active + steps[event.key] + gallery.length) % gallery.length;
        setActive(next);buttons.current[next]?.focus();
    }

    return <div className="ws-app-preview-gallery" aria-label={text('معاينات التطبيق', 'App previews')}>
        <div className="ws-app-preview-main">{illustration(selected, active)}</div>
        <div className="ws-app-preview-thumbnails" role="group" aria-label={text('اختيار المعاينة', 'Choose a preview')} onKeyDown={navigate}>
            {gallery.map((item, index) => <button key={item.src || index} ref={(element) => { buttons.current[index] = element; }} type="button" aria-label={text(`الصورة ${index + 1}`, `Image ${index + 1}`)} aria-pressed={active === index} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)}>{illustration(item, index, true)}</button>)}
        </div>
        <span className="sr-only" role="status">{text(`المعاينة ${active + 1} من ${gallery.length}`, `Preview ${active + 1} of ${gallery.length}`)}</span>
    </div>;
}
