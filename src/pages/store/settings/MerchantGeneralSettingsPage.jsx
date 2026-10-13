import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import useStoreContext from '../../../hooks/useStoreContext';
import { clearStoreLocalesCache } from '../../../hooks/useStoreLocales';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import { HiOutlinePhoto, HiOutlineXMark } from '../../../components/workspace/WorkspaceIcons';
import fontCatalog from '../../../shared/store-fonts.json';
import './merchant-general-settings.css';

const editable = ['revision','site_title','header_text','primary_color','font_family','default_locale','currency','timezone','shipping_flat_rate','phone_country','disable_auto_select_shipping','disable_auto_select_variants','disable_bot_protection','max_product_quantity','max_orders_per_phone_24h'];
const snapshot = (data) => Object.fromEntries(editable.map((key) => [key,
    ['shipping_flat_rate','max_product_quantity','max_orders_per_phone_24h'].includes(key)
        ? (data[key] === '' ? '' : Number(data[key])) : (data[key] ?? '')]));
const message = (failure) => Object.values(failure.response?.data?.errors || {}).flat().join(' ') || failure.response?.data?.message || failure.message;
function Field({ label, value, children }) {
    return <div className={`ws-general-field ${value !== '' && value !== null && value !== undefined ? 'is-filled' : ''}`}><span>{label}</span>{children}</div>;
}
function BrandImage({ title, current, file, setFile, removed, setRemoved, ar }) {
    const input=useRef(null);const preview=useMemo(()=>file?URL.createObjectURL(file):null,[file]);
    useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
    useEffect(()=>{if(!file&&input.current)input.current.value='';},[file]);
    const src=preview || (!removed&&current);
    return <section className="ws-general-brand"><h3>{title}</h3><div><div className="ws-general-image">{src?<img src={src} alt={title}/>:<HiOutlinePhoto aria-hidden/>}</div><div><input ref={input} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event)=>{setFile(event.target.files?.[0]||null);setRemoved(false);}} aria-label={`${ar?'رفع صورة':'Upload image'} — ${title}`}/><button type="button" className="ws-general-outlined" onClick={()=>input.current?.click()}>{ar?'تغيير الصورة':'Change image'}</button>{file?<button type="button" className="ws-general-image-clear" onClick={()=>{setFile(null);if(input.current)input.current.value='';}} aria-label={ar?'إلغاء اختيار الصورة':'Clear selected image'}><HiOutlineXMark aria-hidden/></button>:current?<button type="button" className="ws-general-image-clear" onClick={()=>setRemoved(!removed)}>{removed?(ar?'استعادة الصورة':'Restore image'):(ar?'إزالة الصورة':'Remove image')}</button>:null}</div></div>{file?<p>{file.name}</p>:null}</section>;
}
export default function MerchantGeneralSettingsPage() {
    const context=useStoreContext();return <GeneralEditor key={context.apiBase} context={context}/>;
}
function GeneralEditor({ context:{apiBase,uiBase,access,setStore} }) {
    const {i18n}=useTranslation();const ar=i18n.language.startsWith('ar');const text=(a,e)=>ar?a:e;
    const [initial,setInitial]=useState(null);const [draft,setDraft]=useState(null);const [choices,setChoices]=useState(null);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [success,setSuccess]=useState('');const [attempt,setAttempt]=useState(0);
    const [logo,setLogo]=useState(null);const [favicon,setFavicon]=useState(null);const [removeLogo,setRemoveLogo]=useState(false);const [removeFavicon,setRemoveFavicon]=useState(false);const saving=useRef(false);
    useEffect(()=>{if(!access.canStoreSettings)return;let active=true;setLoading(true);setError('');
        api.get(`${apiBase}/general-settings`).then(({data})=>{if(active){setInitial(data.data);setDraft(data.data);setChoices(data.choices);setLogo(null);setFavicon(null);setRemoveLogo(false);setRemoveFavicon(false);}}).catch(failure=>{if(active)setError(message(failure));}).finally(()=>{if(active)setLoading(false);});
        return()=>{active=false;};
    },[apiBase,access.canStoreSettings,attempt]);
    const regionNames=useMemo(()=>{try{return new Intl.DisplayNames([ar?'ar':'en'],{type:'region'});}catch{return null;}},[ar]);
    const fontNames=Object.keys(fontCatalog);
    if(!access.canStoreSettings)return <Navigate to={`${uiBase}/overview`} replace/>;
    const change=(key,value)=>{setSuccess('');setDraft(previous=>({...previous,[key]:value}));};
    const dirty=Boolean(draft&&initial&&(JSON.stringify(snapshot(draft))!==JSON.stringify(snapshot(initial))||logo||favicon||removeLogo||removeFavicon));
    const submit=async event=>{event.preventDefault();if(saving.current||!dirty)return;saving.current=true;setBusy(true);setError('');setSuccess('');
        const body=new FormData();body.append('_method','PUT');editable.forEach(key=>{const value=draft[key];body.append(key,typeof value==='boolean'?(value?'1':'0'):String(value??''));});
        if(logo)body.append('logo',logo);if(favicon)body.append('favicon',favicon);body.append('remove_logo',removeLogo?'1':'0');body.append('remove_favicon',removeFavicon?'1':'0');
        try{const {data}=await api.post(`${apiBase}/general-settings`,body);setInitial(data.data);setDraft(data.data);setStore(data.store);clearStoreLocalesCache();setLogo(null);setFavicon(null);setRemoveLogo(false);setRemoveFavicon(false);setSuccess(text('تم حفظ إعدادات المتجر','Store settings saved'));}
        catch(failure){setError(message(failure));}finally{saving.current=false;setBusy(false);}
    };
    return <div className="ws-general-settings" dir={ar?'rtl':'ltr'}>
        {error?<div className="ws-general-feedback" role="alert">{error}<button type="button" disabled={busy} onClick={()=>setAttempt(value=>value+1)}>{text('إعادة تحميل آخر الإعدادات','Reload latest settings')}</button></div>:null}
        {success?<p className="ws-general-feedback" role="status">{success}</p>:null}
        {loading?<p role="status">{text('جارٍ تحميل إعدادات المتجر…','Loading store settings…')}</p>:draft&&choices?<form onSubmit={submit}><fieldset disabled={busy}>
            <header><h2>{text('إعدادات المتجر','Store settings')}</h2></header>
            <Field label={text('لغة موقعك *','Store language *')} value={draft.default_locale}><select aria-label={text('لغة موقعك','Store language')} value={draft.default_locale} onChange={event=>change('default_locale',event.target.value)}><option value="ar">العربية</option><option value="en">English</option></select></Field>
            <Field label={text('عنوان الموقع الرئيسي','Main site title')} value={draft.site_title}><input aria-label={text('عنوان الموقع الرئيسي','Main site title')} value={draft.site_title||''} maxLength={255} onChange={event=>change('site_title',event.target.value)}/></Field>
            <section><h3>{text('الجزء الأعلى من الهيدر','Top header')}</h3><Field label={text('محتوى الجزء العلوي من الهيدر','Top header content')} value={draft.header_text}><input aria-label={text('محتوى الجزء العلوي من الهيدر','Top header content')} value={draft.header_text||''} maxLength={500} onChange={event=>change('header_text',event.target.value)}/></Field></section>
            <section><h3>{text('لون الموقع','Site color')}</h3><div className="ws-general-color"><input type="color" aria-label={text('اختيار اللون الرئيسي','Choose primary color')} value={/^#[a-f0-9]{6}$/i.test(draft.primary_color)?draft.primary_color:'#0abb45'} onChange={event=>change('primary_color',event.target.value)}/><Field label={text('اللون الرئيسي','Primary color')} value={draft.primary_color}><input aria-label={text('اللون الرئيسي','Primary color')} dir="ltr" pattern="#[a-fA-F0-9]{6}" maxLength={7} value={draft.primary_color||''} onChange={event=>change('primary_color',event.target.value)}/></Field></div></section>
            <BrandImage title={text('لوجو الموقع','Site logo')} current={initial.logo_url} file={logo} setFile={setLogo} removed={removeLogo} setRemoved={setRemoveLogo} ar={ar}/>
            <BrandImage title={text('الأيقونة المصغرة 16×16','Favicon 16×16')} current={initial.favicon_url} file={favicon} setFile={setFavicon} removed={removeFavicon} setRemoved={setRemoveFavicon} ar={ar}/>
            <Field label={text('سعر الشحن الافتراضي','Default shipping price')} value={draft.shipping_flat_rate}><input type="number" required min="0" max="9999999999.99" step="0.01" aria-label={text('سعر الشحن الافتراضي','Default shipping price')} value={draft.shipping_flat_rate} onChange={event=>change('shipping_flat_rate',event.target.value)}/></Field>
            <div className="ws-general-field is-filled"><span>Font</span><SearchableSelect aria-label={text('خط المتجر','Store font')} value={draft.font_family||''} onChange={event=>change('font_family',event.target.value)}><option value="">{text('استخدام خط الثيم','Use theme font')}</option><option value="system">{text('خط الجهاز','System font')}</option>{fontNames.map(font=><option key={font} value={font}>{font}</option>)}</SearchableSelect></div>
            <div className="ws-general-field is-filled"><span>{text('العملة','Currency')}</span><SearchableSelect aria-label={text('العملة','Currency')} value={draft.currency} onChange={event=>change('currency',event.target.value)}>{[...new Set([draft.currency,...choices.currencies])].map(code=><option key={code} value={code}>{code}</option>)}</SearchableSelect></div>
            <p className="ws-general-note">{text('تغيير العملة لا يحوّل الأسعار المدخلة إلى قيم جديدة.','Changing the currency does not convert the entered prices.')} <Link to={`${uiBase}/settings/localization`}>{text('إدارة اللغات والعملات المتاحة','Manage available languages and currencies')}</Link></p>
            <div className="ws-general-field is-filled"><span>{text('الدولة','Country')}</span><SearchableSelect aria-label={text('الدولة','Country')} value={draft.phone_country} onChange={event=>change('phone_country',event.target.value)}>{choices.countries.map(code=><option key={code} value={code}>{regionNames?.of(code)||code}</option>)}</SearchableSelect></div>
            <p className="ws-general-note">{text('تُستخدم الدولة للتحقق من أرقام الهواتف.','The country is used to validate phone numbers.')}</p>
            <div className="ws-general-field is-filled"><span>{text('المنطقة الزمنية','Time zone')}</span><SearchableSelect aria-label={text('المنطقة الزمنية','Time zone')} value={draft.timezone} onChange={event=>change('timezone',event.target.value)}>{[...new Set([draft.timezone,...choices.timezones])].map(zone=><option key={zone} value={zone}>{zone}</option>)}</SearchableSelect></div>
            <div className="ws-general-checks">{[['disable_auto_select_shipping',text('إيقاف الاختيار التلقائي لمناطق الشحن','Disable automatic shipping region selection')],['disable_auto_select_variants',text('إيقاف الاختيار التلقائي للمتغيرات','Disable automatic variant selection')],['disable_bot_protection',text('قفل الحماية من البوتات','Disable bot protection')]].map(([key,label])=><label key={key}><input type="checkbox" checked={draft[key]} onChange={event=>change(key,event.target.checked)}/><span>{label}</span></label>)}</div>
            {!draft.bot_credentials_configured?<p className="ws-general-note">{text('يتطلب تفعيل فحص الحماية إضافة مفاتيح Turnstile أولًا.','Enabling the protection challenge requires Turnstile credentials first.')} <Link to={`${uiBase}/settings/bot-protection`}>{text('إعداد الحماية','Configure protection')}</Link></p>:null}
            <Field label={text('الحد الأقصى لعناصر الطلب','Maximum order item quantity')} value={draft.max_product_quantity}><input type="number" min="0" max="100000" step="1" required aria-label={text('الحد الأقصى لعناصر الطلب','Maximum order item quantity')} value={draft.max_product_quantity} onChange={event=>change('max_product_quantity',event.target.value)}/></Field>
            <p className="ws-general-note">{text('يطبق الحد على كمية كل منتج. الصفر يعني عدم وجود حد.','The limit applies to the quantity of each product. Zero means no limit.')}</p>
            <Field label={text('الحد الأقصى لعدد الطلبات لكل رقم هاتف','Maximum orders per phone number')} value={draft.max_orders_per_phone_24h}><input type="number" min="0" max="100000" step="1" required aria-label={text('الحد الأقصى لعدد الطلبات لكل رقم هاتف','Maximum orders per phone number')} value={draft.max_orders_per_phone_24h} onChange={event=>change('max_orders_per_phone_24h',event.target.value)}/></Field>
            <p className="ws-general-note">{text('يحسب خلال آخر 24 ساعة. الصفر يعني عدم وجود حد.','Counted over the last 24 hours. Zero means no limit.')}</p>
            <button className="ws-general-save" type="submit" disabled={!dirty||busy}>{busy?text('جارٍ الحفظ…','Saving…'):text('حفظ','Save')}</button>
        </fieldset></form>:null}
    </div>;
}
