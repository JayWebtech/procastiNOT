import { ReactNode } from 'react';

interface TextareaProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  className?: string;
  label?: string;
  description?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export default function Textarea({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  rows = 2,
  className = '',
  label,
  description,
  resize = 'none'
}: TextareaProps) {
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  };

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
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={`w-full px-4 py-3 bg-transparent border border-[#ffffff1a] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent transition-colors ${resizeClasses[resize]}`}
      />
      {description && (
        <p className="text-sm text-gray-400 mt-2">
          {description}
        </p>
      )}
    </div>
  );
}
