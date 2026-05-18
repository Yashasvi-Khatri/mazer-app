import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import MazerEmailField from './MazerEmailField';
import MazerPasswordField from './MazerPasswordField';
import MazerAuthSubmitButton from './MazerAuthSubmitButton';

type FormData = { email: string; password: string };
type ValidationErrors = { email: string; password: string };

const MazerLoginForm = () => {
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const errors: ValidationErrors = { email: '', password: '' };
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setValidationErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await login(formData.email, formData.password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <MazerEmailField value={formData.email} onChange={handleChange} error={validationErrors.email} />
      <MazerPasswordField value={formData.password} onChange={handleChange} error={validationErrors.password} />
      <MazerAuthSubmitButton isLoading={isLoading} label="Log In" />
    </form>
  );
};

export default MazerLoginForm;
