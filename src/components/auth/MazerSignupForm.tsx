import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import MazerEmailField from './MazerEmailField.tsx';
import MazerUsernameField from './MazerUsernameField.js';
import MazerPasswordField from './MazerPasswordField.tsx';
import MazerAuthSubmitButton from './MazerAuthSubmitButton.tsx';

const MazerSignupForm = () => {
  const { signup, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    email: '',
    username: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = { email: '', username: '', password: '' };
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.username) errors.username = 'Username is required';
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
    await signup(formData.email, formData.username, formData.password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <MazerEmailField
        value={formData.email}
        onChange={handleChange}
        error={validationErrors.email}
      />
      <MazerUsernameField
        value={formData.username}
        onChange={handleChange}
        error={validationErrors.username}
      />
      <MazerPasswordField
        value={formData.password}
        onChange={handleChange}
        error={validationErrors.password}
      />
      <MazerAuthSubmitButton isLoading={isLoading} label="Create Account" />
    </form>
  );
};

export default MazerSignupForm;
