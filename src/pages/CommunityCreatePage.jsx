import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PostComposer from '../components/feed/PostComposer';
import CommunityShell from '../features/community/components/CommunityShell';
import notify from '../components/ui/notify';

/**
 * The create surface. Publishing is instant from the member's point of view:
 * the composer enqueues a background job and we return straight to the feed,
 * where the job renders its progress card. No waiting on uploads here.
 */
export default function CommunityCreatePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [params] = useSearchParams();
    const format = ['reel', 'carousel'].includes(params.get('format')) ? params.get('format') : 'post';
    const initialType = params.get('type') || undefined;

    return (
        <CommunityShell rightRail={false}>
            <div className="space-y-5">
                <header className="rounded-2xl bg-white px-6 py-5 shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">{t('composer_title', 'Create post')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('publish_uploading_hint', 'Uploading in the background — keep using the platform.')}</p>
                </header>
                <PostComposer
                    fullPage
                    initialFormat={format}
                    initialType={initialType}
                    onQueued={() => {
                        notify.success(
                            t('publish_uploading', 'Publishing your post…'),
                            t('publish_uploading_hint', 'Uploading in the background — keep using the platform.'),
                        );
                        navigate('/community');
                    }}
                />
            </div>
        </CommunityShell>
    );
}
