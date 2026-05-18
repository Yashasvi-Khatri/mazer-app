import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

type SubmitButtonProps = {
  isLoading: boolean;
  label: string;
  onClick?: () => Promise<void>;
};

const MazerAuthSubmitButton: React.FC<SubmitButtonProps> = ({ isLoading, label, onClick }) => {
  return (
    <Button 
      type="submit" 
      className="w-full bg-white hover:bg-gray-200 text-black"
      disabled={isLoading}
      onClick={onClick}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <>
          {label}
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
};

export default MazerAuthSubmitButton;
