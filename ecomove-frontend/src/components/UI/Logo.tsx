import React from 'react';
import { Leaf } from 'lucide-react';

// Interface para las props del logo - Principio de Segregación de Interfaces
interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textColor?: string;
  imageUrl?: string;
  fallbackToIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

// Componente Logo - Principio de Responsabilidad Única
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  textColor = 'text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400',
  imageUrl,
  fallbackToIcon = true,
  className = '',
  onClick
}) => {
  // Tamaños para diferentes variantes - Principio Abierto/Cerrado
  const sizes = {
    sm: {
      container: 'h-6',
      image: 'h-6 w-6',
      icon: 'h-6 w-6',
      text: 'text-lg',
      pulse: 'w-2 h-2 -top-0.5 -right-0.5'
    },
    md: {
      container: 'h-8',
      image: 'h-8 w-8',
      icon: 'h-8 w-8',
      text: 'text-xl',
      pulse: 'w-3 h-3 -top-1 -right-1'
    },
    lg: {
      container: 'h-12',
      image: 'h-12 w-12',
      icon: 'h-12 w-12',
      text: 'text-2xl',
      pulse: 'w-4 h-4 -top-1 -right-1'
    }
  };

  const sizeClasses = sizes[size];

  // Clases del contenedor principal
  const containerClasses = [
    'flex-shrink-0 flex items-center cursor-pointer transition-all duration-200',
    className
  ].join(' ');

  // Renderizar el logo (imagen o icono)
  const renderLogo = () => {
    if (imageUrl) {
      return (
        <div className="relative">
          <img
            src={imageUrl}
            alt="EcoMove Logo"
            className={`${sizeClasses.image} object-contain transition-transform duration-200 hover:scale-105`}
            onError={(e) => {
              // Si la imagen falla y tenemos fallback habilitado, mostrar el icono
              if (fallbackToIcon) {
                e.currentTarget.style.display = 'none';
                const iconElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (iconElement) {
                  iconElement.style.display = 'block';
                }
              }
            }}
          />
          {/* Icono de respaldo (oculto por defecto) */}
          {fallbackToIcon && (
            <div className="relative" style={{ display: 'none' }}>
              <Leaf className={`${sizeClasses.icon} text-emerald-600 dark:text-emerald-400`} />
              <div className={`absolute ${sizeClasses.pulse} bg-emerald-400 rounded-full animate-pulse`}></div>
            </div>
          )}
        </div>
      );
    }

    // Fallback al icono original
    return (
      <div className="relative">
        <Leaf className={`${sizeClasses.icon} text-emerald-600 dark:text-emerald-400`} />
        <div className={`absolute ${sizeClasses.pulse} bg-emerald-400 rounded-full animate-pulse`}></div>
      </div>
    );
  };

  return (
    <div className={containerClasses} onClick={onClick}>
      {renderLogo()}
      
      {/* Texto del logo */}
      {showText && (
        <span className={`ml-2 ${sizeClasses.text} font-bold ${textColor} transition-colors`}>
          EcoMove
        </span>
      )}
    </div>
  );
};