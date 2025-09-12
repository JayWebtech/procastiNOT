import { ReactNode } from 'react';

interface InputProps {
  id: string;
  name: string;
  type?: 'text' | 'email' | 'number' | 'password';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  step?: string;
  min?: string;
  max?: string;
  className?: string;
  label?: string;
  description?: string;
}

export default function Input({
  id,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  step,
  min,
  max,
  className = '',
  label,
  description
}: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-lg font-semibold text-white mb-3"
        >
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        step={step}
        min={min}
        max={max}
        className="w-full px-4 py-3 bg-transparent border border-[#ffffff1a] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent transition-colors"
      />
      {description && (
        <p className="text-sm text-gray-400 mt-2">
          {description}
        </p>
      )}
    </div>
  );
}
