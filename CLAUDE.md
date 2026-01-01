# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Progressive Web Application (PWA) for health coaching with Arabic RTL support. The app features end-to-end encryption for user health data, offline-first functionality, and AI-powered nutrition/fitness tracking.

**Tech Stack:**
- React 18 + TypeScript
- Vite 5 (build tool)
- Styled Components (styling with theme system)
- LocalForage (IndexedDB wrapper)
- Web Crypto API (AES-GCM encryption)
- TensorFlow.js + Tesseract.js (ML/OCR for future features)
- Workbox (service worker/PWA)

## Development Commands

### Build & Development
```bash
npm run dev           # Start dev server (Vite) on port 4173
npm run build         # TypeScript compile + production build
npm run preview       # Preview production build locally
```

### Testing
```bash
npm run test:unit     # Run Jest unit tests with coverage
npm run test:e2e      # Run Playwright E2E tests (chromium + mobile)
npm run lint          # ESLint with TypeScript rules
```

### Run Single Test
```bash
# Unit test (Jest)
npx jest tests/unit/metabolic-engine.test.ts

# E2E test (Playwright)
npx playwright test tests/e2e/offline-mode.spec.ts
```

## Architecture Overview

### Data Flow & Security Model

**Encryption Layer**: All user data is encrypted at rest using AES-GCM 256-bit encryption before being stored in IndexedDB. The encryption key is derived from a user password using PBKDF2 with 100,000 iterations.

**Storage Architecture**:
- `src/lib/crypto/aes-encryption.ts` - CryptoEngine handles encryption/decryption
- `src/lib/database/indexeddb.ts` - Four LocalForage stores: `user_profiles`, `food_log`, `workout_log`, `wellness_log`
- Data is encrypted in components (e.g., `EncryptedDB.tsx`) before persistence

**Metabolic Engine**: Core health calculations in `src/lib/calculations/metabolic-engine.ts`:
- BMR calculation using Mifflin-St Jeor equation
- TDEE calculation with activity multipliers
- Macro distribution (30% protein, 40% carbs, 30% fats)
- Input validation for health metrics

### Component Structure

**Pages**: Single page currently (`src/pages/Onboarding.tsx`) - handles user profile creation
**Components**:
- `src/components/onboarding/ProfileForm.tsx` - Form with Arabic labels
- `src/components/common/EncryptedDB.tsx` - Encrypted storage wrapper component

**Theming**: `src/styles/theme.ts` defines color palette, spacing scale, and border radius. Entire app wrapped in ThemeProvider.

**Types**: `src/types/health.ts` contains all TypeScript interfaces:
- `UserProfile` - User health data + calculated BMR/TDEE/macros
- `FoodLogEntry` - Nutrition tracking entries
- `Exercise` & `WorkoutSession` - Fitness tracking (not yet implemented)

### PWA Configuration

**Vite PWA Plugin** (`vite.config.ts`):
- Auto-updates service worker
- Precaches all static assets (JS, CSS, HTML, images)
- Runtime caching for Google Fonts
- Arabic manifest (`name`, `short_name`, `description` in Arabic)
- Base path: `/health-pwa/` (configured for GitHub Pages)

**Important**: The app is configured with RTL support (`dir: 'rtl'` in manifest) and Arabic as primary language (`lang: 'ar-SA'`).

### Test Configuration

**Jest** (`jest.config.js`):
- Uses ts-jest preset for TypeScript
- jsdom environment for React components
- Coverage threshold: 90% for all metrics
- Path alias: `@/` maps to `src/`
- Test setup in `tests/setup.ts`

**Playwright** (`playwright.config.ts`):
- Tests in `tests/e2e/`
- Runs against production build (`npm run preview`)
- Tests on Desktop Chrome + Mobile (Pixel 5)
- Base URL: `http://localhost:4173`

## Key Implementation Patterns

### Encryption Workflow
When storing user data:
1. Component receives user input
2. Data serialized to JSON
3. CryptoEngine.deriveKey() creates key from user password
4. CryptoEngine.encrypt() encrypts data with random IV
5. Encrypted payload stored in IndexedDB via LocalForage

When retrieving:
1. Fetch encrypted payload from IndexedDB
2. CryptoEngine.decrypt() with same password-derived key
3. Parse decrypted JSON
4. Use in React components

### Arabic RTL Support
- All UI text should be in Arabic
- CSS uses `direction: rtl` from theme
- Styled Components handle bidirectional layouts
- Test on mobile viewports for proper RTL rendering

### Offline-First Strategy
- Service worker precaches all app shell resources
- IndexedDB stores all user data locally
- No server dependencies for core functionality
- Google Fonts cached with 1-year expiration

## Environment Variables

Create `.env.local` based on `.env.example`:
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_FIREBASE_CONFIG=your_firebase_config_json
```

Note: Gemini API and Firebase are placeholders for future AI features (food recognition, personalized recommendations). Not currently implemented.

## Build Output

Production build creates chunked bundles:
- `react-vendor` chunk - React + ReactDOM
- `tfjs` chunk - TensorFlow.js (for future image recognition)
- `ocr` chunk - Tesseract.js (for future barcode/label scanning)

Vite target: `esnext` (modern browsers only)

## Deployment Context

This app is deployed on AWS Ubuntu server with Nginx on port 8888. The `dist/` folder is served statically. See `DEPLOYMENT_SUMMARY.md` for full server configuration details.

**GitHub Pages**: Configured with base path `/health-pwa/` in vite.config.ts. GitHub Actions workflow exists in `.github/workflows/deploy.yml`.

## Important Constraints

- All user data stays client-side (no backend/API currently)
- Encryption password is NOT stored - if user forgets password, data is unrecoverable
- IndexedDB has browser quota limits (~50% of available disk space)
- Service worker requires HTTPS in production (except localhost)
- Arabic text requires proper font support (Google Fonts: Cairo, Tajawal recommended)
