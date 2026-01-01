export interface UserProfile {
  id: string;
  weight: number; // kg
  height: number; // cm
  age: number; // years
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
  goal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'general_health';
  bmr: number;
  tdee: number;
  macros: {
    protein: number; // grams
    carbs: number; // grams
    fats: number; // grams
  };
  createdAt: string;
}

export interface MetabolicResult {
  bmr: number;
  tdee: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface FoodLogEntry {
  id: string;
  timestamp: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  detectedCalories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  servingSize?: number;
  productName?: string;
  barcode?: string;
  confidence: number;
}

export interface Exercise {
  id: string;
  name_ar: string;
  name_en: string;
  muscleGroups: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  equipment: string[];
  metValue: number;
  instructions_ar: string;
  videoURL?: string;
}

export interface WorkoutSession {
  id: string;
  exercises: Array<{
    exerciseId: string;
    sets: number;
    reps: number;
    restSeconds: number;
  }>;
  duration: number;
  estimatedCalories: number;
  timestamp: number;
}
