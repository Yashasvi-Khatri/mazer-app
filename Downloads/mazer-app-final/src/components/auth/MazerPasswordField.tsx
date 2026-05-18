
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MazerPasswordField = ({ value, onChange, error }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="password" className="text-gray-300">Password</Label>
      <Input
        id="password"
        name="password"
        type="password"
        placeholder="••••••••"
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

export default MazerPasswordField;
