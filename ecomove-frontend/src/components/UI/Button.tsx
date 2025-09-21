import React from 'react';
import { IconComponent } from '../../types/icons';

// Interface para las props del botón - Principio de Segregación de Interfaces
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  icon?: IconComponent;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

// Componente Button - Principio de Responsabilidad Única y Abierto/Cerrado
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  ...props
}) => {
  // Clases base para todos los botones
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-semibold rounded-lg',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'select-none'
  ].join(' ');

  // Variantes de estilo - Principio Abierto/Cerrado
  const variants = {
    primary: [
      'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
      'text-white',
      'focus:ring-emerald-500',
      'shadow-sm hover:shadow-md'
    ].join(' '),
    
    secondary: [
      'bg-gray-200 hover:bg-gray-300 active:bg-gray-400',
      'text-gray-900',
      'dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500',
      'dark:text-white',
      'focus:ring-gray-500',
      'shadow-sm hover:shadow-md'
    ].join(' '),
    
    outline: [
      'border-2 border-emerald-600 hover:bg-emerald-600 active:bg-emerald-700',
      'text-emerald-600 hover:text-white',
      'dark:border-emerald-400 dark:text-emerald-400',
      'dark:hover:bg-emerald-600 dark:hover:text-white',
      'focus:ring-emerald-500',
      'bg-transparent'
    ].join(' '),
    
    ghost: [
      'hover:bg-gray-100 active:bg-gray-200',
      'text-gray-700',
      'dark:hover:bg-gray-800 dark:active:bg-gray-700',
      'dark:text-gray-300',
      'focus:ring-gray-500',
      'bg-transparent'
    ].join(' '),
    
    danger: [
      'bg-red-600 hover:bg-red-700 active:bg-red-800',
      'text-white',
      'focus:ring-red-500',
      'shadow-sm hover:shadow-md'
    ].join(' ')
  };

  // Tamaños - Principio Abierto/Cerrado
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs gap-1',
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
    xl: 'px-8 py-4 text-xl gap-3'
  };

  // Clases de ancho
  const widthClasses = fullWidth ? 'w-full' : '';

  // Construir clases finales
  const buttonClasses = [
    baseClasses,
    variants[variant],
    sizes[size],
    widthClasses,
    className
  ].filter(Boolean).join(' ');

  // Renderizar icono si existe
  const renderIcon = () => {
    if (loading) {
      return (
        <svg 
          className="animate-spin h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }

    if (Icon) {
      return <Icon className="h-4 w-4" />;
    }

    return null;
  };

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      {children}
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
};