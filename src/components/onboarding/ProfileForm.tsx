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
