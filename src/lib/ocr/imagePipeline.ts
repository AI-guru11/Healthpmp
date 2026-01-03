/**
 * Image preprocessing pipeline for OCR
 * Pure canvas functions for cropping, downscaling, and preprocessing
 */

export type PreprocessMode = 'grayscale-threshold' | 'adaptive-threshold' | 'none';

/**
 * Apply center crop to canvas
 * @param sourceCanvas - Source canvas to crop
 * @param cropPercentage - Percentage of image to keep (50-100)
 * @returns New canvas with cropped image
 */
export const applyCrop = (sourceCanvas: HTMLCanvasElement, cropPercentage: number): HTMLCanvasElement => {
  const cropCanvas = document.createElement('canvas');
  const ctx = cropCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  const cropFraction = cropPercentage / 100;
  const cropWidth = Math.floor(sourceCanvas.width * cropFraction);
  const cropHeight = Math.floor(sourceCanvas.height * cropFraction);
  const startX = Math.floor((sourceCanvas.width - cropWidth) / 2);
  const startY = Math.floor((sourceCanvas.height - cropHeight) / 2);

  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;

  ctx.drawImage(
    sourceCanvas,
    startX, startY, cropWidth, cropHeight,
    0, 0, cropWidth, cropHeight
  );

  return cropCanvas;
};

/**
 * Downscale canvas to maximum dimension
 * @param sourceCanvas - Source canvas to downscale
 * @param maxDim - Maximum dimension (width or height)
 * @returns New canvas with downscaled image (or original if already small enough)
 */
export const applyDownscale = (sourceCanvas: HTMLCanvasElement, maxDim: number): HTMLCanvasElement => {
  const scale = Math.min(maxDim / sourceCanvas.width, maxDim / sourceCanvas.height, 1);

  if (scale >= 1) return sourceCanvas;

  const downscaleCanvas = document.createElement('canvas');
  const ctx = downscaleCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  const newWidth = Math.floor(sourceCanvas.width * scale);
  const newHeight = Math.floor(sourceCanvas.height * scale);

  downscaleCanvas.width = newWidth;
  downscaleCanvas.height = newHeight;
  ctx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);

  return downscaleCanvas;
};

/**
 * Apply preprocessing to canvas for better OCR accuracy
 * @param sourceCanvas - Source canvas to preprocess
 * @param mode - Preprocessing mode
 * @returns New canvas with preprocessed image
 */
export const applyPreprocessing = (sourceCanvas: HTMLCanvasElement, mode: PreprocessMode): HTMLCanvasElement => {
  if (mode === 'none') return sourceCanvas;

  const processCanvas = document.createElement('canvas');
  const ctx = processCanvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  processCanvas.width = sourceCanvas.width;
  processCanvas.height = sourceCanvas.height;
  ctx.drawImage(sourceCanvas, 0, 0);

  const imageData = ctx.getImageData(0, 0, processCanvas.width, processCanvas.height);
  const data = imageData.data;

  if (mode === 'grayscale-threshold') {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const contrast = 1.5;
      let adjusted = ((gray - 128) * contrast) + 128;
      adjusted = adjusted > 128 ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = adjusted;
    }
  } else if (mode === 'adaptive-threshold') {
    // Simple adaptive threshold (local mean)
    const blockSize = 15;
    const C = 10;
    const width = processCanvas.width;
    const height = processCanvas.height;

    // Convert to grayscale first
    const grayData = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      grayData[i / 4] = gray;
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;

        for (let by = -Math.floor(blockSize / 2); by <= Math.floor(blockSize / 2); by++) {
          for (let bx = -Math.floor(blockSize / 2); bx <= Math.floor(blockSize / 2); bx++) {
            const nx = x + bx;
            const ny = y + by;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += grayData[ny * width + nx];
              count++;
            }
          }
        }

        const mean = sum / count;
        const pixel = grayData[y * width + x];
        const threshold = pixel > (mean - C) ? 255 : 0;

        const idx = (y * width + x) * 4;
        data[idx] = data[idx + 1] = data[idx + 2] = threshold;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return processCanvas;
};
