import React, { useState } from 'react';
import { Zap } from 'lucide-react';

interface ImageContainerProps {
  src?: string;
  alt: string;
  fallback?: React.ReactNode;
  className?: string;
}

export const ImageContainer: React.FC<ImageContainerProps> = ({
  src,
  alt,
  fallback,
  className = "w-full h-auto object-contain" // Cambiado para mantener proporciones sin fondo
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Debug: mostrar en consola qué imagen se está intentando cargar
  React.useEffect(() => {
    console.log('Intentando cargar imagen:', src);
  }, [src]);

  // Fallback simple sin fondo
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <Zap className="h-32 w-32 text-emerald-600 dark:text-emerald-400 animate-pulse" />
    </div>
  );

  if (!src || imageError) {
    return <>{fallback || defaultFallback}</>;
  }

  return (
    <div className="relative w-full h-auto">      
      {/* Imagen real */}
      <img
        src={src}
        alt={alt}
        className={`${className} ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        onLoad={() => {
          console.log('Imagen cargada exitosamente:', src);
          setImageLoaded(true);
        }}
        onError={(e) => {
          console.error('Error cargando imagen:', src, e);
          setImageError(true);
        }}
      />
    </div>
  );
};