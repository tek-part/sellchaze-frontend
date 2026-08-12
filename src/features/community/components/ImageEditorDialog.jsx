import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Cropper from 'react-easy-crop';
import { HiOutlineArrowPath, HiOutlineArrowUturnLeft, HiOutlineXMark } from 'react-icons/hi2';
import { exportEditedImage } from '../media/exportImage';

/**
 * The pre-upload image studio: zoom/pan crop (fixed aspect for avatars and
 * covers, free for post photos), 90° rotation and brightness/contrast/
 * saturation sliders with a live preview. Exports a JPEG blob via canvas and
 * hands it to onApply(blob) — the caller uploads it or swaps it into the
 * composer tray.
 *
 * `file` is a File/Blob; `aspect` is width/height or undefined for free crop.
 */
export default function ImageEditorDialog({ file, aspect, open, onClose, onApply }) {
    const { t } = useTranslation();
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [cropPixels, setCropPixels] = useState(null);
    const [busy, setBusy] = useState(false);

    const srcUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => () => { if (srcUrl) URL.revokeObjectURL(srcUrl); }, [srcUrl]);

    // Fresh session per image.
    useEffect(() => {
        if (open) {
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setRotation(0);
            setBrightness(100);
            setContrast(100);
            setSaturation(100);
        }
    }, [open, file]);

    const onCropComplete = useCallback((area, areaPixels) => setCropPixels(areaPixels), []);

    const reset = () => {
        setZoom(1);
        setRotation(0);
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setCrop({ x: 0, y: 0 });
    };

    const apply = async () => {
        if (!srcUrl || !cropPixels || busy) return;
        setBusy(true);
        try {
            const blob = await exportEditedImage(srcUrl, cropPixels, { rotation, brightness, contrast, saturation });
            onApply?.(blob);
            onClose?.();
        } finally {
            setBusy(false);
        }
    };

    if (!open || !file) return null;

    const slider = (label, value, setValue, min, max, step = 1) => (
        <label className="block">
            <span className="flex items-center justify-between text-xs font-bold text-white/80">
                {label}
                <span className="tabular-nums text-white/50">{value}</span>
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
                className="mt-1 w-full accent-white"
            />
        </label>
    );

    return createPortal(
        <div className="fixed inset-0 z-[95] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label={t('image_editor_title', 'Edit image')}>
            <div className="flex items-center justify-between p-3 sm:p-4">
                <h2 className="text-sm font-bold text-white">{t('image_editor_title', 'Edit image')}</h2>
                <button
                    type="button"
                    onClick={() => onClose?.()}
                    aria-label={t('action_cancel', 'Cancel')}
                    className="sc-press flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25"
                >
                    <HiOutlineXMark className="h-6 w-6" aria-hidden />
                </button>
            </div>

            {/* Crop stage — react-easy-crop owns gestures; the filter previews live. */}
            <div className="relative min-h-0 flex-1">
                <Cropper
                    image={srcUrl}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    style={{ mediaStyle: { filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` } }}
                />
            </div>

            {/* Controls */}
            <div className="space-y-3 p-4 sm:mx-auto sm:w-full sm:max-w-xl">
                {slider(t('image_zoom', 'Zoom'), Math.round(zoom * 100), (v) => setZoom(v / 100), 100, 300)}
                <div className="grid grid-cols-3 gap-3">
                    {slider(t('image_brightness', 'Brightness'), brightness, setBrightness, 50, 150)}
                    {slider(t('image_contrast', 'Contrast'), contrast, setContrast, 50, 150)}
                    {slider(t('image_saturation', 'Saturation'), saturation, setSaturation, 0, 200)}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setRotation((r) => (r + 90) % 360)}
                            className="sc-press inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
                        >
                            <HiOutlineArrowPath className="h-4 w-4" aria-hidden />
                            {t('image_rotate', 'Rotate')}
                        </button>
                        <button
                            type="button"
                            onClick={reset}
                            className="sc-press inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
                        >
                            <HiOutlineArrowUturnLeft className="h-4 w-4" aria-hidden />
                            {t('image_reset', 'Reset')}
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={apply}
                        disabled={busy}
                        className="sc-press rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-white/90 disabled:opacity-50"
                    >
                        {busy ? t('profile_saving', 'Saving…') : t('image_apply', 'Apply')}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
