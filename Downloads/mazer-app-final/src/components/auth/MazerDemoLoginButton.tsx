
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const MazerDemoLoginButton = ({ isLoading }) => {
  const { login } = useAuth();

  const handleDemoLogin = async () => {
    await login('demo@example.com', 'password123');
  };

  return (
    <Button 
      variant="outline" 
      type="button" 
      className="w-full border-white/10 hover:bg-white/5 text-white"
      onClick={handleDemoLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        "Use Demo Account"
      )}
    </Button>
  );
};

export default MazerDemoLoginButton;
