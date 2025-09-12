import { ReactNode } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  required?: boolean;
  className?: string;
  label?: string;
  description?: string;
  placeholder?: string;
}

export default function Select({
  id,
  name,
  value,
  onChange,
  onBlur,
  options,
  required = false,
  className = '',
  label,
  description,
  placeholder
}: SelectProps) {
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
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        className="w-full px-4 py-3 bg-transparent border border-[#ffffff1a] rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description && (
        <p className="text-sm text-gray-400 mt-2">
          {description}
        </p>
      )}
    </div>
  );
}
