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
