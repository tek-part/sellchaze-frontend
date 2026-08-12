import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HiOutlineArrowPath, HiOutlineCheckCircle, HiOutlineCloudArrowUp, HiOutlineXMark } from 'react-icons/hi2';
import { dismissPublish, retryPublish } from '../publish/publishQueue';

/**
 * One background-publish job, rendered at the top of the feed — the
 * "جارٍ نشر المنشور" strip. Uploading shows live progress; failure offers a
 * retry (or the plans page when the monthly quota was the reason); the done
 * state is handled by the feed itself, which swaps this card for the real
 * post.
 */
export default function PublishProgressCard({ job }) {
    const { t } = useTranslation();

    if (job.status === 'failed') {
        return (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-red-500 ring-1 ring-red-100">
                    <HiOutlineXMark className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-red-700">{t('publish_failed', 'The post could not be published')}</p>
                    {job.error ? <p className="truncate text-xs text-red-500">{job.error}</p> : null}
                </div>
                {job.quotaHit ? (
                    <Link to="/pricing" className="sc-press rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200 transition hover:bg-red-100/70">
                        {t('publish_view_plans', 'View plans')}
                    </Link>
                ) : (
                    <button type="button" onClick={() => retryPublish(job.id)} className="sc-press inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200 transition hover:bg-red-100/70">
                        <HiOutlineArrowPath className="h-4 w-4" aria-hidden />
                        {t('publish_retry', 'Retry')}
                    </button>
                )}
                <button type="button" onClick={() => dismissPublish(job.id)} aria-label={t('publish_discard', 'Discard')} className="sc-press rounded-lg p-1.5 text-red-400 transition hover:bg-red-100/70">
                    <HiOutlineXMark className="h-4 w-4" aria-hidden />
                </button>
            </div>
        );
    }

    const publishing = job.status === 'publishing';

    return (
        <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
            <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                    {publishing ? <HiOutlineCheckCircle className="h-5 w-5" aria-hidden /> : <HiOutlineCloudArrowUp className="h-5 w-5" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">
                        {publishing ? t('publish_processing', 'Finalizing…') : t('publish_uploading', 'Publishing your post…')}
                    </p>
                    <p className="text-xs text-slate-500">{t('publish_uploading_hint', 'Uploading in the background — keep using the platform.')}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-brand">{publishing ? '' : `${job.progress}%`}</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                    className={`h-full rounded-full bg-brand transition-all duration-300 ${publishing ? 'sc-skeleton w-full' : ''}`}
                    style={publishing ? undefined : { width: `${Math.max(4, job.progress)}%` }}
                />
            </div>
        </div>
    );
}
