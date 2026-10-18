import { HiOutlineExclamationTriangle } from '../../workspace/WorkspaceIcons';

export function OrderBotWarning({ verified, ar }) {
    if (verified !== false) return null;
    return <small className="ws-order-bot-warning"><HiOutlineExclamationTriangle aria-hidden="true" /><span>{ar ? 'لم يُجرَ فحص الحماية' : 'Bot check not performed'}</span></small>;
}

export function orderBotLabel(verified, ar) {
    if (verified === true) return ar ? 'تم اجتياز فحص الحماية عند إنشاء الطلب' : 'Bot check passed at checkout';
    if (verified === false) return ar ? 'لم يُجرَ فحص الحماية عند إنشاء الطلب' : 'Bot check was not performed at checkout';
    return ar ? 'غير معروف — لا توجد نتيجة فحص مسجلة' : 'Unknown — no recorded check result';
}
