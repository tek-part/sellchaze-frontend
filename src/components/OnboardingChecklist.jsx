import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineCheckCircle, HiXMark } from './workspace/WorkspaceIcons';
import useWorkspaceCopy from './workspace/workspaceCopy';
import api from '../api/client';

const DISMISS_KEY = 'sellchase_onboarding_dismissed';

/**
 * The 5-step onboarding checklist a merchant/supplier sees right after signing
 * up. Progress is computed server-side from real state (logo, products, theme,
 * invites), so it can never drift from reality. Hidden once complete, and
 * dismissible in the meantime.
 */
export default function OnboardingChecklist() {
    const { t } = useTranslation();
    const ws = useWorkspaceCopy();
    const [data, setData] = useState(null);
    const [dismissed, setDismissed] = useState(() => {
        try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
    });

    useEffect(() => {
        let active = true;
        api.get('/me/onboarding')
            .then((res) => { if (active) setData(res.data); })
            .catch(() => { if (active) setData(null); });
        return () => { active = false; };
    }, []);

    const dismiss = () => {
        setDismissed(true);
        try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    };

    // Nothing to show: not loaded, already finished, or dismissed by the user.
    if (!data || data.complete || dismissed) return null;

    const labels = {
        account: t('onb_account', 'Create your account'),
        logo: t('onb_logo', 'Add your company logo'),
        products: t('onb_products', 'Add your first 5 products'),
        template: t('onb_template', 'Choose your site template'),
        invite: t('onb_invite', 'Invite your first client'),
    };
    return <section className="ws-panel">
        <div className="ws-panel-title"><div><h2>{ws('setup')}</h2><p>{ws('setupHint')}</p></div><button type="button" className="ws-icon-button" aria-label={t('dismiss', 'Dismiss')} onClick={dismiss}><HiXMark aria-hidden="true" /></button></div>
        <div className="ws-onboarding-progress"><span>{data.done_count}/{data.total}</span><div className="ws-onboarding-track" role="progressbar" aria-label={ws('setup')} aria-valuenow={data.percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${data.percent}%` }} /></div><strong>{data.percent}%</strong></div>
        <div className="ws-setup-grid">{data.steps.map((step, index) => {
            const content = <><div>{step.done ? <HiOutlineCheckCircle aria-hidden="true" /> : <span className="ws-setup-number">{index + 1}</span>}<span>{step.done ? ws('complete') : ws('next')}</span></div><strong>{labels[step.key] || step.key}</strong></>;
            return step.href ? <Link to={step.href} className="ws-setup-step" key={step.key}>{content}</Link> : <div className="ws-setup-step" key={step.key}>{content}</div>;
        })}</div>
    </section>;
}
