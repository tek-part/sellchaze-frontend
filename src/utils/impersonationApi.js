import toast from 'react-hot-toast';
import api from '../api/client';
import { beginImpersonation } from './impersonation';

/**
 * @param {number} userId
 * @param {(key: string, opts?: object) => string} t
 */
export async function impersonateUserId(userId, _t) {
    try {
        const { data } = await api.post('/admin/impersonate', { user_id: userId });
        beginImpersonation(data);
        // Full reload so the app re-bootstraps as the impersonated user and lands on
        // THEIR role-aware dashboard (their data only). Without navigating away we'd stay
        // on an admin-only page the impersonated user has no permission for (→ 403).
        window.location.assign('/dashboard');
    } catch (e) {
        const msg =
            e.response?.data?.message ||
            e.response?.data?.errors?.user_id?.[0] ||
            e.message;
        toast.error(msg);
    }
}
