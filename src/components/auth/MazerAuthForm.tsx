import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MazerLoginForm from './MazerLoginForm';
import MazerSignupForm from './MazerSignupForm';

type AuthFormProps = {
  type: 'login' | 'signup';
};

const MazerAuthForm: React.FC<AuthFormProps> = ({ type }) => {
  return (
    <Card className="w-full max-w-md mx-auto glass-morphism animate-fade-in shadow-2xl border-white/5">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          {type === 'login' ? 'Welcome back' : 'Create an account'}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {type === 'login' 
            ? 'Enter your credentials to access your account'
            : 'Fill in your details to get started'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {type === 'login' ? <MazerLoginForm /> : <MazerSignupForm />}
      </CardContent>
    </Card>
  );
};

export default MazerAuthForm;
