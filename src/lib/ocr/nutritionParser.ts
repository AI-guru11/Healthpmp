/**
 * Nutrition label parser
 * Extracts nutrition data from OCR text using regex patterns
 */

export type ParsedData = {
  caloriesPerServing: number | null;
  servingsPerContainer: number | null;
  servingSizeValue: number | null;
  servingSizeUnit: 'ml' | 'g' | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
};

/**
 * Parse nutrition label text and extract key nutrition facts
 * Supports both English and Arabic patterns
 * @param text - OCR text from nutrition label
 * @returns Parsed nutrition data
 */
export function parseNutritionLabel(text: string): ParsedData {
  const result: ParsedData = {
    caloriesPerServing: null,
    servingsPerContainer: null,
    servingSizeValue: null,
    servingSizeUnit: null,
    protein: null,
    carbs: null,
    fats: null,
  };

  // Calories - enhanced with "Calor" fallback and Arabic
  let match = text.match(/Calories\s*([0-9]{1,4})/i);
  if (!match) match = text.match(/Calor[a-z]*\s*([0-9]{1,4})/i);
  if (!match) match = text.match(/السعرات(?:\s*الحرارية)?\s*([0-9]{1,4})/i);
  if (match) result.caloriesPerServing = Number(match[1]);

  // Servings per container
  match = text.match(/servings?\s*per\s*container\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) match = text.match(/عدد\s*الحصص\s*(?:في\s*العبوة)?\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (match) result.servingsPerContainer = Number(match[1]);

  // Serving size - enhanced patterns
  match = text.match(/Serving\s*Size\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(ml|mL|g|gm|grams)/i);
  if (!match) match = text.match(/حجم\s*الحصة\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(مل|ml|جم|g)/i);
  if (match) {
    result.servingSizeValue = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (unit.includes('ml') || unit.includes('مل')) {
      result.servingSizeUnit = 'ml';
    } else {
      result.servingSizeUnit = 'g';
    }
  }

  // Protein
  match = text.match(/Protein\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) match = text.match(/بروتين\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (match) result.protein = Number(match[1]);

  // Carbs
  match = text.match(/Carbohydrate[s]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) match = text.match(/الكربوهيدرات\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (match) result.carbs = Number(match[1]);

  // Fats
  match = text.match(/Total\s*Fat\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match) match = text.match(/الدهون\s*الكلية\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (match) result.fats = Number(match[1]);

  return result;
}

/**
 * Check if parsing was successful (minimum required fields extracted)
 * @param data - Parsed nutrition data
 * @returns True if calories and serving size were extracted
 */
export function isParseSuccessful(data: ParsedData): boolean {
  return data.caloriesPerServing !== null && data.servingSizeValue !== null;
}
