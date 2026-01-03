/**
 * Tesseract OCR runner with fallback cascade
 * Implements 4-attempt strategy: eng PSM6 → eng PSM11 → eng+ara PSM6 → eng+ara PSM11
 */

import { createWorker, PSM } from 'tesseract.js';
import { parseNutritionLabel, isParseSuccessful } from './nutritionParser';

export type OcrResult = {
  text: string;
  usedLang: 'eng' | 'eng+ara';
  usedPsm: 6 | 11;
};

export type OcrOptions = {
  onProgress?: (progress: number) => void;
  onMessage?: (message: string) => void;
};

/**
 * Run OCR with 4-attempt fallback cascade for nutrition labels
 * Attempt #1: English only with PSM 6 (uniform block)
 * Attempt #2: English only with PSM 11 (sparse text)
 * Attempt #3: English + Arabic with PSM 6
 * Attempt #4: English + Arabic with PSM 11
 *
 * @param canvas - Canvas containing preprocessed image
 * @param options - Progress and message callbacks
 * @returns OCR result with text, language, and PSM used
 */
export async function runOcrWithFallbacks(
  canvas: HTMLCanvasElement,
  options: OcrOptions = {}
): Promise<OcrResult> {
  const { onProgress, onMessage } = options;

  // Attempt #1: English only with PSM 6 (uniform block of text)
  onMessage?.('OCR Attempt #1: English only (PSM 6)...');
  const worker1 = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.(Math.round(m.progress * 100));
      }
    }
  });

  await worker1.setParameters({
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    user_defined_dpi: '300',
  });

  const { data: { text: text1 } } = await worker1.recognize(canvas);
  await worker1.terminate();

  const parsed1 = parseNutritionLabel(text1);

  if (isParseSuccessful(parsed1)) {
    // Success with English PSM 6
    return { text: text1, usedLang: 'eng', usedPsm: 6 };
  }

  // Attempt #2: English only with PSM 11 (sparse text)
  onMessage?.('OCR Attempt #2: English only (PSM 11 fallback)...');
  onProgress?.(0);

  const worker1b = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.(Math.round(m.progress * 100));
      }
    }
  });

  await worker1b.setParameters({
    tessedit_pageseg_mode: PSM.SPARSE_TEXT,
    user_defined_dpi: '300',
  });

  const { data: { text: text1b } } = await worker1b.recognize(canvas);
  await worker1b.terminate();

  const parsed1b = parseNutritionLabel(text1b);

  if (isParseSuccessful(parsed1b)) {
    return { text: text1b, usedLang: 'eng', usedPsm: 11 };
  }

  // Attempt #3: English + Arabic with PSM 6
  onMessage?.('OCR Attempt #3: English + Arabic (PSM 6)...');
  onProgress?.(0);

  const worker2 = await createWorker(['eng', 'ara'], 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.(Math.round(m.progress * 100));
      }
    }
  });

  await worker2.setParameters({
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    user_defined_dpi: '300',
  });

  const { data: { text: text2 } } = await worker2.recognize(canvas);
  await worker2.terminate();

  const parsed2 = parseNutritionLabel(text2);

  if (isParseSuccessful(parsed2)) {
    return { text: text2, usedLang: 'eng+ara', usedPsm: 6 };
  }

  // Attempt #4: English + Arabic with PSM 11 fallback
  onMessage?.('OCR Attempt #4: English + Arabic (PSM 11 fallback)...');
  onProgress?.(0);

  const worker2b = await createWorker(['eng', 'ara'], 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.(Math.round(m.progress * 100));
      }
    }
  });

  await worker2b.setParameters({
    tessedit_pageseg_mode: PSM.SPARSE_TEXT,
    user_defined_dpi: '300',
  });

  const { data: { text: text2b } } = await worker2b.recognize(canvas);
  await worker2b.terminate();

  // Return final attempt result regardless of success
  return { text: text2b, usedLang: 'eng+ara', usedPsm: 11 };
}
