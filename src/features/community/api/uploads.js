import api from '../../../api/client';

const SESSION_PREFIX = 'sellchaze:community-upload:';
const fingerprint = (file) => `${file.name}:${file.size}:${file.lastModified}:${file.type}`;

async function sha256(blob) {
    const buffer = await blob.arrayBuffer();
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', buffer))]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

export async function cancelCommunityUpload(uploadId) {
    if (!uploadId) return;
    await api.delete(`/community/media/uploads/${uploadId}`);
}

export async function uploadCommunityFile(file, { organizationId, onProgress, signal } = {}) {
    const key = SESSION_PREFIX + fingerprint(file);
    let session;
    const remembered = localStorage.getItem(key);

    if (remembered) {
        try {
            const uploadId = JSON.parse(remembered).upload_id;
            session = (await api.get(`/community/media/uploads/${uploadId}`, { signal })).data.data;
        } catch {
            localStorage.removeItem(key);
        }
    }

    if (!session) {
        session = (
            await api.post(
                '/community/media/uploads',
                {
                    name: file.name,
                    size_bytes: file.size,
                    mime: file.type || 'application/octet-stream',
                    ...(organizationId ? { organization_id: Number(organizationId) } : {}),
                },
                { signal },
            )
        ).data.data;
        localStorage.setItem(key, JSON.stringify({ upload_id: session.upload_id }));
    }

    const uploaded = new Set(session.uploaded_parts || []);
    const chunkSize = session.chunk_size;
    let completedBytes = [...uploaded].reduce((total, part) => {
        const start = (part - 1) * chunkSize;
        return total + Math.min(chunkSize, Math.max(0, file.size - start));
    }, 0);
    onProgress?.(Math.round((completedBytes / file.size) * 100), session.upload_id);

    for (let part = 1; part <= session.total_chunks; part += 1) {
        if (signal?.aborted) throw new DOMException('Upload paused', 'AbortError');
        if (uploaded.has(part)) continue;
        const start = (part - 1) * chunkSize;
        const chunk = file.slice(start, Math.min(start + chunkSize, file.size));
        const form = new FormData();
        form.append('chunk', chunk, `${file.name}.part${part}`);
        form.append('checksum_sha256', await sha256(chunk));
        await api.post(`/community/media/uploads/${session.upload_id}/parts/${part}`, form, {
            signal,
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (event) => {
                const sent = event.total ? Math.min(chunk.size, (event.loaded / event.total) * chunk.size) : 0;
                onProgress?.(Math.min(99, Math.round(((completedBytes + sent) / file.size) * 100)), session.upload_id);
            },
        });
        completedBytes += chunk.size;
        onProgress?.(Math.min(99, Math.round((completedBytes / file.size) * 100)), session.upload_id);
    }

    const response = await api.post(
        `/community/media/uploads/${session.upload_id}/complete`,
        {},
        { signal, headers: { 'Idempotency-Key': crypto.randomUUID() } },
    );
    localStorage.removeItem(key);
    onProgress?.(100, session.upload_id);
    return response.data.data;
}

