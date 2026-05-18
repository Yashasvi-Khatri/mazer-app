
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MazerEmailField = ({ value, onChange, error }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="text-gray-300">Email</Label>
      <Input
        id="email"
        name="email"
        type="email"
        placeholder="name@example.com"
        value={value}
        onChange={onChange}
        className={`bg-secondary/50 border-white/10 text-white ${error ? 'border-red-500' : ''}`}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default MazerEmailField;
