import React from 'react';
import { IconComponent } from '../../types/icons';

// Interface para las props de la tarjeta - Principio de Segregación de Interfaces
interface FeatureCardProps {
  icon: IconComponent;
  title: string;
  description: string;
  variant?: 'default' | 'highlighted';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Componente FeatureCard - Principio de Responsabilidad Única
export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  // Variantes de estilo con efecto 3D neumórfico - Principio Abierto/Cerrado
  const variants = {
    default: {
      card: [
        'bg-gray-100 dark:bg-gray-800',
        'hover:bg-gray-50 dark:hover:bg-gray-750',
        'transition-all duration-300',
        // Efecto 3D neumórfico más sutil en modo oscuro
        'shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]',
        'dark:shadow-[10px_10px_30px_#1a1a1a,-10px_-10px_30px_#2a2a2a]',
        'hover:shadow-[25px_25px_70px_#bebebe,-25px_-25px_70px_#ffffff]',
        'dark:hover:shadow-[15px_15px_40px_#1a1a1a,-15px_-15px_40px_#2a2a2a]'
      ].join(' '),
      
      iconContainer: [
        'bg-gray-200 dark:bg-gray-700',
        'text-emerald-600 dark:text-emerald-400',
        // Efecto 3D interno más sutil
        'shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]',
        'dark:shadow-[inset_3px_3px_6px_#1a1a1a,inset_-3px_-3px_6px_#2a2a2a]'
      ].join(' ')
    },
    
    highlighted: {
      card: [
        'bg-gradient-to-br from-emerald-50 to-teal-50',
        'dark:from-emerald-900/20 dark:to-teal-900/20',
        'hover:from-emerald-100 hover:to-teal-100',
        'dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30',
        'transition-all duration-300',
        // Efecto 3D neumórfico verde para las 4 primeras
        'shadow-[20px_20px_60px_#a7f3d0,-20px_-20px_60px_#ffffff]',
        'dark:shadow-[10px_10px_30px_#064e3b,-10px_-10px_30px_#10b981]',
        'hover:shadow-[25px_25px_70px_#a7f3d0,-25px_-25px_70px_#ffffff]',
        'dark:hover:shadow-[15px_15px_40px_#064e3b,-15px_-15px_40px_#10b981]'
      ].join(' '),
      
      iconContainer: [
        'bg-emerald-200 dark:bg-emerald-800',
        'text-emerald-700 dark:text-emerald-300',
        // Efecto 3D interno verde
        'shadow-[inset_5px_5px_10px_#a7f3d0,inset_-5px_-5px_10px_#ffffff]',
        'dark:shadow-[inset_3px_3px_6px_#064e3b,inset_-3px_-3px_6px_#10b981]'
      ].join(' ')
    }
  };

  // Tamaños - Principio Abierto/Cerrado
  const sizes = {
    sm: {
      card: 'p-4 min-h-[200px]',
      iconContainer: 'w-10 h-10 mb-3',
      icon: 'h-5 w-5',
      title: 'text-lg',
      description: 'text-sm'
    },
    md: {
      card: 'p-6 min-h-[254px]',
      iconContainer: 'w-12 h-12 mb-4',
      icon: 'h-6 w-6',
      title: 'text-xl',
      description: 'text-base'
    },
    lg: {
      card: 'p-8 min-h-[300px]',
      iconContainer: 'w-16 h-16 mb-6',
      icon: 'h-8 w-8',
      title: 'text-2xl',
      description: 'text-lg'
    }
  };

  const variantClasses = variants[variant];
  const sizeClasses = sizes[size];

  // Clases base para la tarjeta con efecto 3D
  const cardClasses = [
    'rounded-[50px]', // Border radius como en el ejemplo
    'group cursor-pointer',
    'transform hover:scale-[1.02]', // Ligero efecto de escala al hover
    variantClasses.card,
    sizeClasses.card,
    className
  ].join(' ');

  // Clases para el contenedor del icono con efecto 3D interno
  const iconContainerClasses = [
    'rounded-2xl flex items-center justify-center',
    'group-hover:scale-110 transition-transform duration-300',
    variantClasses.iconContainer,
    sizeClasses.iconContainer
  ].join(' ');

  return (
    <div className={cardClasses}>
      {/* Contenedor del icono con efecto 3D interno */}
      <div className={iconContainerClasses}>
        <Icon className={sizeClasses.icon} />
      </div>

      {/* Título */}
      <h3 className={`${sizeClasses.title} font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors`}>
        {title}
      </h3>

      {/* Descripción */}
      <p className={`${sizeClasses.description} text-gray-600 dark:text-gray-300 leading-relaxed`}>
        {description}
      </p>
    </div>
  );
};