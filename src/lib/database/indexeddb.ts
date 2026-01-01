import localForage from 'localforage';

export const initDatabase = async () => {
  const userProfiles = localForage.createInstance({
    name: 'HealthCoachDB',
    storeName: 'user_profiles',
    description: 'Encrypted user health profiles'
  });

  const foodLog = localForage.createInstance({
    name: 'HealthCoachDB',
    storeName: 'food_log',
    description: 'Nutrition tracking data'
  });

  const workoutLog = localForage.createInstance({
    name: 'HealthCoachDB',
    storeName: 'workout_log',
    description: 'Exercise session data'
  });

  const wellnessLog = localForage.createInstance({
    name: 'HealthCoachDB',
    storeName: 'wellness_log',
    description: 'Mental wellness data'
  });

  return { userProfiles, foodLog, workoutLog, wellnessLog };
};
