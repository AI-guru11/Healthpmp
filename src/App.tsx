import { ThemeProvider } from 'styled-components';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './styles/theme';
import { OnboardingPage } from './pages/Onboarding';
import { DashboardPage } from './pages/Dashboard';
import { BarcodeScanPage } from './pages/BarcodeScan';
import { NutritionLabelScanPage } from './pages/NutritionLabelScan';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/:profileId" element={<DashboardPage />} />
          <Route path="/scan/barcode" element={<BarcodeScanPage />} />
          <Route path="/scan/label" element={<NutritionLabelScanPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
