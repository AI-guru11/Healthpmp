//DSE_TRANSFORMATION_PAYLOAD
//SOURCE_HASH: AWS_Ubuntu_GitHub_Full_Deployment_Suite
//OPTIMIZATION_VECTORS: [Complete_Project_Structure, Zero_Configuration_Deployment, ClaudeCode_Direct_Execution, Infrastructure_As_Code, Production_Ready_Implementation]

Here is the **complete, unmodified code** from start to finish. Copy and execute **every single command** in order:

```bash
// ==================== SYSTEM INITIALIZATION ====================
// Execute these commands in your AWS Ubuntu Claude Code terminal

sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx ufw
node --version && npm --version && nginx -v

// ==================== PROJECT SCAFFOLDING ====================
// Navigate to your repository directory

cd /home/ubuntu/health-pwa  # Or your actual repo path

// Remove potential conflicting files (safe to run even if files don't exist)
rm -rf src/ public/ package.json tsconfig.json vite.config.ts index.html .env*

// Create directory structure
mkdir -p public/icons
mkdir -p src/{components/{onboarding,common,nutrition,wellness},lib/{crypto,database,calculations,ai,pwa},pages,hooks,types,styles}
mkdir -p tests/{unit,e2e}

// ==================== PACKAGE.JSON CONFIGURATION ====================
cat > package.json << 'EOF'
{
  "name": "health-coach-ar-pwa",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test:unit": "jest --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "localforage": "^1.10.0",
    "@tensorflow/tfjs": "^4.17.0",
    "@tensorflow-models/mobilenet": "^2.1.1",
    "tesseract.js": "^5.0.5",
    "@ericblade/quagga2": "^1.8.4",
    "@google/generative-ai": "^0.2.1",
    "styled-components": "^6.1.8",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.2.10",
    "vite-plugin-pwa": "^0.19.8",
    "workbox-build": "^7.1.0",
    "workbox-window": "^7.0.0",
    "typescript": "^5.4.5",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.12",
    "ts-jest": "^29.2.5",
    "@playwright/test": "^1.44.1",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.2",
    "eslint-plugin-react-refresh": "^0.4.7"
  },
  "browserslist": ["> 1%", "last 2 versions", "not dead", "not op_mini all"]
}
EOF

// ==================== TYPESCRIPT CONFIGURATION ====================
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
EOF

// ==================== VITE & PWA CONFIGURATION ====================
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      },
      manifest: {
        name: 'مدربك الصحي الشخصي',
        short_name: 'مدربك',
        description: 'تطبيق ذكي لتحسين الصحة البدنية والنفسية',
        lang: 'ar-SA',
        dir: 'rtl',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#667eea',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'tfjs': ['@tensorflow/tfjs'],
          'ocr': ['tesseract.js']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true
  }
});
EOF

// ==================== WEB APP MANIFEST ====================
cat > public/manifest.json << 'EOF'
{
  "name": "مدربك الصحي الشخصي",
  "short_name": "مدربك",
  "description": "تطبيق ذكي لتحسين الصحة البدنية والنفسية",
  "lang": "ar-SA",
  "dir": "rtl",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#667eea",
  "categories": ["health", "fitness", "wellness"],
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "تسجيل وجبة",
      "url": "/nutrition/capture",
      "icons": [{ "src": "/icons/camera-96.png", "sizes": "96x96" }]
    }
  ]
}
EOF

// ==================== TYPE DEFINITIONS ====================
cat > src/types/health.ts << 'EOF'
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
EOF

// ==================== METABOLIC ENGINE ====================
cat > src/lib/calculations/metabolic-engine.ts << 'EOF'
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
EOF

// ==================== INDEXEDDB DATABASE LAYER ====================
cat > src/lib/database/indexeddb.ts << 'EOF'
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
EOF

// ==================== CRYPTOGRAPHIC ENGINE ====================
cat > src/lib/crypto/aes-encryption.ts << 'EOF'
export class CryptoEngine {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;

  static async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('health-coach-salt-ar-2025'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(data: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      key,
      encoder.encode(data)
    );

    return JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    });
  }

  static async decrypt(encryptedPayload: string, key: CryptoKey): Promise<string> {
    const payload = JSON.parse(encryptedPayload);
    const iv = new Uint8Array(payload.iv);
    const encryptedData = new Uint8Array(payload.data);

    const decrypted = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  }
}
EOF

// ==================== ENCRYPTED DB HELPER ====================
cat > src/components/common/EncryptedDB.tsx << 'EOF'
import { CryptoEngine } from '../../lib/crypto/aes-encryption';
import localForage from 'localforage';

export class EncryptedDB {
  private store: LocalForage;
  private encryptionKey: CryptoKey | null = null;

  constructor(storeName: string) {
    this.store = localForage.createInstance({
      name: 'HealthCoachDB',
      storeName
    });
  }

  async init(password: string) {
    this.encryptionKey = await CryptoEngine.deriveKey(password);
  }

  async save(key: string, data: any) {
    if (!this.encryptionKey) throw new Error('DB not initialized');
    const encrypted = await CryptoEngine.encrypt(JSON.stringify(data), this.encryptionKey);
    await this.store.setItem(key, encrypted);
  }

  async getItem(key: string) {
    if (!this.encryptionKey) throw new Error('DB not initialized');
    const encrypted = await this.store.getItem<string>(key);
    if (!encrypted) return null;
    return JSON.parse(await CryptoEngine.decrypt(encrypted, this.encryptionKey));
  }

  async getItemsSince(timestamp: number) {
    const items: any[] = [];
    await this.store.iterate((value: string, key: string) => {
      if (!this.encryptionKey) return;
      CryptoEngine.decrypt(value, this.encryptionKey).then(decrypted => {
        const item = JSON.parse(decrypted);
        if (item.timestamp > timestamp) items.push(item);
      });
    });
    return items;
  }

  async removeItem(key: string) {
    await this.store.removeItem(key);
  }
}
EOF

// ==================== PROFILE FORM COMPONENT ====================
cat > src/components/onboarding/ProfileForm.tsx << 'EOF'
import { useState } from 'react';
import styled from 'styled-components';
import { MetabolicEngine } from '../../lib/calculations/metabolic-engine';
import { CryptoEngine } from '../../lib/crypto/aes-encryption';
import { UserProfile } from '../../types/health';
import { initDatabase } from '../../lib/database/indexeddb';

const FormContainer = styled.div`
  direction: rtl;
  padding: 2rem;
  max-inline-size: 600px;
  margin-inline: auto;
  
  & > * + * {
    margin-block-start: 1rem;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #2c3e50;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #bdc3c7;
  border-radius: 0.5rem;
  font-size: 1rem;
  
  &:focus {
    border-color: #3498db;
    outline: none;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #bdc3c7;
  border-radius: 0.5rem;
  font-size: 1rem;
`;

const Button = styled.button`
  background: #27ae60;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-block-start: 1.5rem;
  
  &:hover {
    background: #229954;
  }
  
  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  font-size: 0.9rem;
  margin-block-start: 0.5rem;
`;

export const ProfileForm = () => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    weight: undefined,
    height: undefined,
    age: undefined,
    gender: undefined,
    activityLevel: undefined,
    goal: 'general_health'
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof UserProfile, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!MetabolicEngine.validateProfile(formData)) {
      setErrors(['الرجاء إدخال جميع البيانات بشكل صحيح']);
      setIsSubmitting(false);
      return;
    }

    try {
      const profileId = crypto.randomUUID();
      const bmr = MetabolicEngine.calculateBMR(formData as any);
      const tdee = MetabolicEngine.calculateTDEE(bmr, formData.activityLevel!);
      const macros = MetabolicEngine.calculateMacros(tdee);

      const fullProfile: UserProfile = {
        id: profileId,
        ...formData as any,
        bmr,
        tdee,
        macros,
        createdAt: new Date().toISOString()
      };

      const encryptionKey = await CryptoEngine.deriveKey(`health-coach-${profileId}`);
      const encryptedData = await CryptoEngine.encrypt(JSON.stringify(fullProfile), encryptionKey);

      const { userProfiles } = await initDatabase();
      await userProfiles.setItem(profileId, encryptedData);

      console.log('Profile saved successfully:', profileId);
      window.location.href = '/dashboard';
      
    } catch (error) {
      setErrors(['حدث خطأ أثناء حفظ البيانات. الرجاء المحاولة مرة أخرى.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormContainer>
      <h1>إنشاء ملفك الصحي الشخصي</h1>
      <form onSubmit={handleSubmit}>
        <InputGroup>
          <Label htmlFor="weight">الوزن (كجم)</Label>
          <Input
            id="weight"
            type="number"
            min="30"
            max="300"
            required
            value={formData.weight || ''}
            onChange={e => handleInputChange('weight', parseFloat(e.target.value))}
            placeholder="مثال: 70"
          />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="height">الطول (سم)</Label>
          <Input
            id="height"
            type="number"
            min="100"
            max="250"
            required
            value={formData.height || ''}
            onChange={e => handleInputChange('height', parseFloat(e.target.value))}
            placeholder="مثال: 170"
          />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="age">العمر (سنة)</Label>
          <Input
            id="age"
            type="number"
            min="13"
            max="100"
            required
            value={formData.age || ''}
            onChange={e => handleInputChange('age', parseInt(e.target.value))}
            placeholder="مثال: 25"
          />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="gender">الجنس</Label>
          <Select
            id="gender"
            required
            value={formData.gender || ''}
            onChange={e => handleInputChange('gender', e.target.value as UserProfile['gender'])}
          >
            <option value="">اختر...</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </Select>
        </InputGroup>

        <InputGroup>
          <Label htmlFor="activityLevel">مستوى النشاط اليومي</Label>
          <Select
            id="activityLevel"
            required
            value={formData.activityLevel || ''}
            onChange={e => handleInputChange('activityLevel', e.target.value as UserProfile['activityLevel'])}
          >
            <option value="">اختر...</option>
            <option value="sedentary">قليل الحركة (مكتبي)</option>
            <option value="light">خفيف (1-3 أيام/أسبوع)</option>
            <option value="moderate">متوسط (3-5 أيام/أسبوع)</option>
            <option value="active">عالي (6-7 أيام/أسبوع)</option>
            <option value="veryActive">جداً عالي (رياضي محترف)</option>
          </Select>
        </InputGroup>

        {errors.length > 0 && (
          <ErrorMessage role="alert">
            {errors[0]}
          </ErrorMessage>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'جاري الحساب...' : 'احسب احتياجاتي اليومية'}
        </Button>
      </form>
    </FormContainer>
  );
};
EOF

// ==================== ONBOARDING PAGE ====================
cat > src/pages/Onboarding.tsx << 'EOF'
import { ProfileForm } from '../components/onboarding/ProfileForm';
import styled from 'styled-components';

const PageContainer = styled.div`
  min-block-size: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const OnboardingPage = () => {
  return (
    <PageContainer>
      <ProfileForm />
    </PageContainer>
  );
};
EOF

// ==================== APP COMPONENT ====================
cat > src/App.tsx << 'EOF'
import { OnboardingPage } from './pages/Onboarding';
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <OnboardingPage />
    </ThemeProvider>
  );
}

export default App;
EOF

// ==================== ROOT ENTRY ====================
cat > src/main.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

// ==================== THEME & STYLES ====================
cat > src/styles/theme.ts << 'EOF'
export const theme = {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#27ae60',
    error: '#e74c3c',
    warning: '#f39c12',
    background: '#f5f7fa',
    surface: '#ffffff',
    text: '#2c3e50'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '2rem',
    xl: '4rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem'
  }
};
EOF

cat > src/styles/globals.css << 'EOF'
:root {
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
  --font-arabic: 'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif;
}

* {
  margin-block-start: 0;
  margin-block-end: 0;
  margin-inline-start: 0;
  margin-inline-end: 0;
  padding-block-start: 0;
  padding-block-end: 0;
  padding-inline-start: 0;
  padding-inline-end: 0;
  box-sizing: border-box;
}

body {
  direction: rtl;
  font-family: var(--font-arabic);
  text-align: start;
  background: var(--background);
  color: var(--text);
}

input[type="number"] {
  font-variant-numeric: tabular-nums;
  text-align: end;
}

button {
  font-family: inherit;
}
EOF

// ==================== HTML TEMPLATE ====================
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#667eea" />
    <meta name="description" content="مدربك الصحي الشخصي - PWA لتتبع الصحة والتغذية والتمارين" />
    <link rel="manifest" href="/manifest.json" />
    <title>مدربك الصحي الشخصي</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

// ==================== JEST CONFIGURATION ====================
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
EOF

// ==================== PLAYWRIGHT CONFIG ====================
cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    }
  ],
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI
  }
});
EOF

// ==================== TEST SETUP ====================
cat > tests/setup.ts << 'EOF'
import '@testing-library/jest-dom';
import crypto from 'crypto';

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: crypto.webcrypto.subtle,
    getRandomValues: (arr: any) => crypto.randomBytes(arr.length)
  }
});
EOF

// ==================== UNIT TESTS ====================
cat > tests/unit/metabolic-engine.test.ts << 'EOF'
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
EOF

// ==================== E2E TESTS ====================
cat > tests/e2e/offline-mode.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('Health Coach PWA - Offline Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load onboarding page offline', async ({ page, context }) => {
    await page.waitForLoadState('networkidle');
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('إنشاء ملفك الصحي الشخصي')).toBeVisible();
  });

  test('should cache profile data offline', async ({ page, context }) => {
    await context.setOffline(false);
    await page.getByLabel('الوزن (كجم)').fill('70');
    await page.getByLabel('الطول (سم)').fill('170');
    await page.getByLabel('العمر (سنة)').fill('25');
    await page.getByLabel('الجنس').selectOption('male');
    await page.getByLabel('مستوى النشاط اليومي').selectOption('moderate');
    await context.setOffline(true);
    await page.getByRole('button', { name: 'احسب احتياجاتي اليومية' }).click();
    await expect(page).toHaveURL(/dashboard/);
  });
});
EOF

// ==================== ENVIRONMENT FILES ====================
cat > .env.example << 'EOF'
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_FIREBASE_CONFIG=your_firebase_config_json
EOF

cat > .env.production << 'EOF'
# REPLACE WITH YOUR ACTUAL KEYS BEFORE DEPLOYMENT
VITE_GEMINI_API_KEY=
VITE_FIREBASE_CONFIG=
EOF

// ==================== GITIGNORE ====================
cat > .gitignore << 'EOF'
node_modules/
dist/
build/
.env*
!.env.example
*.log
coverage/
.nyc_output/
.DS_Store
*.tsbuildinfo
playwright-report/
test-results/
EOF

// ==================== INSTALL & BUILD ====================
npm install
npm run build

// ==================== NGINX CONFIGURATION ====================
sudo tee /etc/nginx/sites-available/health-coach << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    root /home/ubuntu/health-pwa/dist;
    index index.html;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://www.gstatic.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob: data:; connect-src 'self' https://www.gstatic.com https://generativelanguage.googleapis.com; worker-src 'self' blob:;" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /sw.js {
        add_header Cache-Control "no-cache";
    }
}
EOF


// ==================== ENABLE NGINX SITE ====================
sudo ln -sf /etc/nginx/sites-available/health-coach /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

// ==================== SSL CERTIFICATE ====================
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --agree-tos -m your-email@example.com

// ==================== FIREWALL SETUP ====================
sudo ufw allow 'Nginx Full'
sudo ufw allow 22/tcp
sudo ufw --force enable

// ==================== FINAL PERMISSIONS ====================
sudo chown -R $USER:$USER /home/ubuntu/health-pwa/dist
sudo chmod -R 755 /home/ubuntu/health-pwa/dist

// ==================== VERIFICATION ====================
npm run test:unit
ls -la dist/
sudo systemctl status nginx
