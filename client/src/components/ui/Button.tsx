import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'engraved';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  onClick,
  type = 'button',
  disabled = false
}: ButtonProps) {
  const baseClasses = 'font-medium transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'btn-gradient text-white',
    secondary: 'bg-white text-black hover:bg-gray-200 dark:bg-white dark:text-black dark:hover:bg-gray-200',
    outline: 'bg-transparent border-2 border-accent text-accent hover:bg-accent hover:text-white',
    engraved: 'btn-engraved'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}
