import React from 'react';

// Tipo genérico para componentes de iconos SVG
export type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

// Props base para iconos
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

// Enum para tamaños de iconos comunes
export enum IconSize {
  XS = 12,
  SM = 16,
  MD = 20,
  LG = 24,
  XL = 32,
  XXL = 48
}

// Interface para iconos con etiqueta
export interface LabeledIcon {
  icon: IconComponent;
  label: string;
}

// Interface para iconos con estado
export interface StatefulIcon {
  icon: IconComponent;
  activeIcon?: IconComponent;
  isActive?: boolean;
}

// Utilidad para crear props de icono con tamaño
export const createIconProps = (size: IconSize | number = IconSize.MD): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  className: `w-${typeof size === 'number' ? Math.floor(size/4) : 5} h-${typeof size === 'number' ? Math.floor(size/4) : 5}`
});