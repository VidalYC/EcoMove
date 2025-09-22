import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// Interface para las props del componente - Principio de Segregación de Interfaces
interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

// Componente ThemeToggle - Principio de Responsabilidad Única
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'md',
  className = '',
  showLabel = false
}) => {
  const { theme, toggleTheme } = useTheme();

  // Tamaños para el botón - Principio Abierto/Cerrado
  const sizes = {
    sm: {
      button: 'p-1.5',
      icon: 'h-4 w-4',
      text: 'text-xs'
    },
    md: {
      button: 'p-2',
      icon: 'h-5 w-5',
      text: 'text-sm'
    },
    lg: {
      button: 'p-3',
      icon: 'h-6 w-6',
      text: 'text-base'
    }
  };

  const sizeClasses = sizes[size];

  // Clases del botón
  const buttonClasses = [
    'inline-flex items-center justify-center',
    'rounded-lg',
    'bg-gray-200 hover:bg-gray-300 active:bg-gray-400',
    'dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
    'select-none',
    sizeClasses.button,
    className
  ].join(' ');

  // Determinar qué icono mostrar
  const IconComponent = theme === 'light' ? Moon : Sun;
  const label = theme === 'light' ? 'Modo oscuro' : 'Modo claro';

  if (showLabel) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleTheme}
          className={buttonClasses}
          aria-label={label}
          title={label}
        >
          <IconComponent className={`${sizeClasses.icon} text-gray-600 dark:text-gray-300`} />
        </button>
        <span className={`${sizeClasses.text} text-gray-700 dark:text-gray-300`}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={buttonClasses}
      aria-label={label}
      title={label}
    >
      <IconComponent className={`${sizeClasses.icon} text-gray-600 dark:text-gray-300`} />
    </button>
  );
};