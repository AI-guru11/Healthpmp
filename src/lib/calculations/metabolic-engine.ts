export class MetabolicEngine {
  private static ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9
  } as const;

  static calculateBMR(profile: { weight: number; height: number; age: number; gender: 'male' | 'female' }): number {
    const baseBMR = profile.gender === 'male'
      ? (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5
      : (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) - 161;

    return Math.round(baseBMR);
  }

  static calculateTDEE(bmr: number, activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive'): number {
    const multiplier = this.ACTIVITY_MULTIPLIERS[activityLevel];
    return Math.round(bmr * multiplier);
  }

  static calculateMacros(tdee: number): { protein: number; carbs: number; fats: number } {
    const proteinCalories = tdee * 0.30;
    const carbsCalories = tdee * 0.40;
    const fatsCalories = tdee * 0.30;

    return {
      protein: Math.round(proteinCalories / 4),
      carbs: Math.round(carbsCalories / 4),
      fats: Math.round(fatsCalories / 9)
    };
  }

  static validateProfile(data: any): boolean {
    return Boolean(
      data.weight && data.weight >= 30 && data.weight <= 300 &&
      data.height && data.height >= 100 && data.height <= 250 &&
      data.age && data.age >= 13 && data.age <= 100 &&
      data.gender &&
      data.activityLevel
    );
  }
}
