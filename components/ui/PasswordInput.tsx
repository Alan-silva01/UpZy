import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  className?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  placeholder,
  value,
  onChange,
  required = false,
  minLength,
  autoComplete = 'current-password',
  className = ''
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Determinar se deve usar borda emerald ou branca no focus
  const focusBorderClass = className.includes('emerald')
    ? 'focus:border-emerald-500/50'
    : 'focus:border-white/20';

  return (
    <div className={`relative group ${className}`}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors">
        <Lock size={20} />
      </div>
      <input
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        className={`w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-zinc-600 focus:outline-none ${focusBorderClass} focus:bg-zinc-900/80 transition-all`}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors focus:outline-none"
        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
};
