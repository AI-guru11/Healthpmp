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
