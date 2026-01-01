import { MetabolicEngine } from '../../src/lib/calculations/metabolic-engine';
import { UserProfile } from '../../src/types/health';

describe('MetabolicEngine', () => {
  const mockProfile = {
    weight: 70,
    height: 170,
    age: 25,
    gender: 'male' as const,
    activityLevel: 'moderate' as const
  };

  describe('calculateBMR', () => {
    it('should calculate male BMR correctly using Mifflin-St Jeor', () => {
      const bmr = MetabolicEngine.calculateBMR(mockProfile);
      const expected = Math.round((10 * 70) + (6.25 * 170) - (5 * 25) + 5);
      expect(bmr).toBe(expected);
    });

    it('should calculate female BMR correctly', () => {
      const femaleProfile = { ...mockProfile, gender: 'female' as const };
      const bmr = MetabolicEngine.calculateBMR(femaleProfile);
      const expected = Math.round((10 * 70) + (6.25 * 170) - (5 * 25) - 161);
      expect(bmr).toBe(expected);
    });
  });

  describe('calculateTDEE', () => {
    it('should multiply BMR by correct activity multiplier', () => {
      const bmr = 1668;
      const tdee = MetabolicEngine.calculateTDEE(bmr, 'moderate');
      expect(tdee).toBe(Math.round(bmr * 1.55));
    });
  });

  describe('calculateMacros', () => {
    it('should generate correct macro split for 2500 TDEE', () => {
      const tdee = 2500;
      const macros = MetabolicEngine.calculateMacros(tdee);

      expect(macros.protein).toBe(Math.round((2500 * 0.30) / 4));
      expect(macros.carbs).toBe(Math.round((2500 * 0.40) / 4));
      expect(macros.fats).toBe(Math.round((2500 * 0.30) / 9));
    });
  });

  describe('validateProfile', () => {
    it('should return true for valid profile', () => {
      expect(MetabolicEngine.validateProfile(mockProfile)).toBe(true);
    });

    it('should reject age < 13', () => {
      const invalid = { ...mockProfile, age: 12 };
      expect(MetabolicEngine.validateProfile(invalid)).toBe(false);
    });
  });
});
