import { useSyncExternalStore } from 'react';
import api from '../../../api/client';
import { uploadCommunityFile } from '../api/uploads';

/**
 * The background publishing pipeline.
 *
 * Lives at module level — not in a component — so uploads and the final
 * POST /posts survive navigation. A member picks files, hits Publish and keeps
 * using the platform; the feed shows a progress card driven by this store and
 * swaps it for the real post when the server confirms.
 *
 * Shape of one job:
 *   { id, status: 'uploading' | 'publishing' | 'done' | 'failed',
 *     payload, files: [{ key, name, kind, previewUrl, progress, asset, error }],
 *     progress,           // 0..100 across every file
 *     post,               // the created post card once status === 'done'
 *     error }             // human-readable failure, when status === 'failed'
 *
 * Jobs are session-scoped. The chunked uploader already persists its sessions
 * in localStorage, so an interrupted upload resumes on the next attempt even
 * after a reload.
 */

let jobs = [];
const listeners = new Set();

const emit = () => {
    jobs = [...jobs];
    listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const getSnapshot = () => jobs;

/** React hook: the current job list, newest first. */
export function usePublishJobs() {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const findJob = (id) => jobs.find((job) => job.id === id);

const patchJob = (id, patch) => {
    const job = findJob(id);
    if (!job) return;
    Object.assign(job, typeof patch === 'function' ? patch(job) : patch);
    emit();
};

const patchFile = (id, key, patch) => {
    patchJob(id, (job) => ({
        files: job.files.map((file) => (file.key === key ? { ...file, ...patch } : file)),
    }));
};

const overallProgress = (job) => {
    if (!job.files.length) return 100;
    const total = job.files.reduce((sum, file) => sum + (file.progress ?? 0), 0);
    return Math.round(total / job.files.length);
};

async function run(id) {
    const job = findJob(id);
    if (!job) return;
    patchJob(id, { status: 'uploading', error: '' });
    try {
        // Upload whatever hasn't finished yet, sequentially — chunked uploads
        // already parallelise inside, and one-at-a-time keeps progress honest.
        for (const file of job.files) {
            if (file.asset) continue;
            const asset = await uploadCommunityFile(file.blob, {
                organizationId: job.payload.acting_organization_id,
                onProgress: (progress) => {
                    patchFile(id, file.key, { progress });
                    patchJob(id, (current) => ({ progress: overallProgress(current) }));
                },
            });
            patchFile(id, file.key, { asset, progress: 100 });
        }

        const fresh = findJob(id);
        patchJob(id, { status: 'publishing', progress: 100 });
        const payload = {
            ...fresh.payload,
            media_asset_ids: fresh.files.map((file) => file.asset.id),
        };
        const { data } = await api.post('/posts', payload);
        patchJob(id, { status: 'done', post: data.data });
    } catch (error) {
        // 402 = monthly quota; surface it as the failure reason so the card
        // can send the member to the plans page instead of a blind retry.
        const quotaHit = error?.response?.status === 402;
        patchJob(id, {
            status: 'failed',
            quotaHit,
            error: error?.response?.data?.message || error.message,
        });
    }
}

/**
 * Queue a post for background publishing. `files` are the composer's local
 * picks: { key, blob, name, kind, previewUrl, asset? } — items whose upload
 * already finished carry their asset and are skipped.
 * Returns the job id.
 */
export function enqueuePublish(payload, files) {
    const job = {
        id: crypto.randomUUID(),
        status: 'uploading',
        payload,
        files: files.map((file) => ({ ...file, progress: file.asset ? 100 : (file.progress ?? 0) })),
        progress: 0,
        post: null,
        error: '',
    };
    jobs.unshift(job);
    emit();
    run(job.id);
    return job.id;
}

/** Retry a failed job from where it stopped (finished uploads are kept). */
export function retryPublish(id) {
    const job = findJob(id);
    if (job && job.status === 'failed') run(id);
}

/** Drop a job from the list (done cards after adoption, or abandoned failures). */
export function dismissPublish(id) {
    const job = findJob(id);
    if (job?.files) {
        job.files.forEach((file) => {
            if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
        });
    }
    jobs = jobs.filter((entry) => entry.id !== id);
    emit();
}

/** True while anything is still uploading or publishing. */
export function hasActivePublish() {
    return jobs.some((job) => job.status === 'uploading' || job.status === 'publishing');
}
