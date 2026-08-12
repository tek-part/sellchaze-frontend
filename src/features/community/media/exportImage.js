/**
 * Canvas export for the image editor: crop rectangle (from react-easy-crop's
 * pixel output), 90°-step rotation and CSS-filter enhancement, flattened to a
 * JPEG blob ready for upload.
 */

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
    });
}

/**
 * @param {string} srcUrl object URL of the original file
 * @param {{x:number,y:number,width:number,height:number}} cropPixels crop rect in source pixels (after rotation)
 * @param {{rotation?:number,brightness?:number,contrast?:number,saturation?:number,mime?:string,quality?:number}} options
 *   rotation in degrees (multiples of 90); enhancement values where 100 = unchanged
 * @returns {Promise<Blob>}
 */
export async function exportEditedImage(srcUrl, cropPixels, options = {}) {
    const { rotation = 0, brightness = 100, contrast = 100, saturation = 100, mime = 'image/jpeg', quality = 0.9 } = options;
    const image = await loadImage(srcUrl);

    // Stage 1: rotate the full image onto an intermediate canvas.
    const radians = ((rotation % 360) + 360) % 360 * (Math.PI / 180);
    const quarterTurns = Math.round(((rotation % 360) + 360) % 360 / 90) % 4;
    const swapped = quarterTurns % 2 === 1;
    const stage = document.createElement('canvas');
    stage.width = swapped ? image.naturalHeight : image.naturalWidth;
    stage.height = swapped ? image.naturalWidth : image.naturalHeight;
    const stageCtx = stage.getContext('2d');
    stageCtx.translate(stage.width / 2, stage.height / 2);
    stageCtx.rotate(radians);
    stageCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    // Stage 2: cut the crop rect out of the rotated stage, applying filters.
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(cropPixels.width));
    out.height = Math.max(1, Math.round(cropPixels.height));
    const ctx = out.getContext('2d');
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(
        stage,
        cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
        0, 0, out.width, out.height,
    );

    return new Promise((resolve, reject) => {
        out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))), mime, quality);
    });
}
