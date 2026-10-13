export default function MerchantSettingsFeedback({ state }) {
    const { error, saved, busy, loading, reload, text } = state;
    return <>{error ? <div className="ws-settings-feedback" role="alert">{error}<button type="button" disabled={busy} onClick={reload}>{text('إعادة تحميل آخر الإعدادات', 'Reload latest settings')}</button></div> : null}
        {saved ? <p className="ws-settings-feedback" role="status">{text('تم حفظ الإعدادات', 'Settings saved')}</p> : null}
        {loading ? <p role="status">{text('جارٍ تحميل الإعدادات…', 'Loading settings…')}</p> : null}</>;
}
