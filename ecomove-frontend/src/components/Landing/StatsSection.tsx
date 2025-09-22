import React, { useState, useEffect, useRef } from 'react';
import { Users, Zap, MapPin, Star, TrendingUp, Award, Clock, Leaf } from 'lucide-react';
import { IconComponent } from '../../types/icons';

// Interface para las estadísticas - Principio de Segregación de Interfaces
interface Stat {
  id: string;
  number: number;
  label: string;
  icon: IconComponent;
  suffix?: string;
  prefix?: string;
  description?: string;
}

interface StatsSectionProps {
  className?: string;
}

// Hook para animación de números - Principio de Responsabilidad Única
const useCountAnimation = (target: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min(currentStep / steps, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(target * easeOutQuart));

      if (currentStep >= steps) {
        clearInterval(timer);
        setCount(target);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible, target, duration]);

  return { count, ref };
};

// Componente para una estadística individual - Principio de Responsabilidad Única
const StatCard: React.FC<{ stat: Stat; index: number }> = ({ stat, index }) => {
  const { count, ref } = useCountAnimation(stat.number, 2000 + index * 200);

  return (
    <div
      ref={ref}
      className="group text-center transform hover:scale-105 transition-all duration-300"
    >
      {/* Contenedor del icono */}
      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-opacity-30 transition-all duration-300">
        <stat.icon className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
      </div>

      {/* Número animado */}
      <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
        {stat.prefix}
        {count.toLocaleString()}
        {stat.suffix}
      </div>

      {/* Label */}
      <div className="text-lg font-medium text-emerald-100 mb-2">
        {stat.label}
      </div>

      {/* Descripción opcional */}
      {stat.description && (
        <div className="text-sm text-emerald-200 opacity-80">
          {stat.description}
        </div>
      )}
    </div>
  );
};

// Componente StatsSection - Principio de Responsabilidad Única
export const StatsSection: React.FC<StatsSectionProps> = ({
  className = ''
}) => {
  // Estadísticas principales - Principio Abierto/Cerrado
  const mainStats: Stat[] = [
    {
      id: 'users',
      number: 12500,
      label: 'Usuarios Activos',
      icon: Users,
      suffix: '+',
      description: 'Creciendo cada día'
    },
    {
      id: 'vehicles',
      number: 850,
      label: 'Vehículos Disponibles',
      icon: Zap,
      suffix: '+',
      description: 'Bicicletas y scooters'
    },
    {
      id: 'stations',
      number: 75,
      label: 'Estaciones Activas',
      icon: MapPin,
      suffix: '+',
      description: 'En toda la ciudad'
    },
    {
      id: 'satisfaction',
      number: 98,
      label: 'Satisfacción',
      icon: Star,
      suffix: '%',
      description: 'De nuestros usuarios'
    }
  ];

  // Estadísticas adicionales - Principio Abierto/Cerrado
  const additionalStats: Stat[] = [
    {
      id: 'trips',
      number: 156000,
      label: 'Viajes Completados',
      icon: TrendingUp,
      suffix: '+',
      description: 'Y contando...'
    },
    {
      id: 'awards',
      number: 5,
      label: 'Premios Recibidos',
      icon: Award,
      description: 'Por innovación sostenible'
    },
    {
      id: 'uptime',
      number: 99,
      label: 'Tiempo Activo',
      icon: Clock,
      suffix: '.9%',
      description: 'Disponibilidad del servicio'
    },
    {
      id: 'co2_saved',
      number: 2300,
      label: 'Toneladas CO₂ Ahorradas',
      icon: Leaf,
      description: 'Impacto ambiental positivo'
    }
  ];

  // Clases del contenedor principal
  const sectionClasses = [
    'py-20 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800',
    'dark:from-emerald-800 dark:via-emerald-900 dark:to-teal-900',
    'relative overflow-hidden',
    className
  ].join(' ');

  return (
    <section id="stats" className={sectionClasses}>
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-400/10 to-transparent"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado de la sección */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Nuestro Impacto
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Números que nos{' '}
            <span className="text-emerald-200">
              respaldan
            </span>
          </h2>
          
          <p className="text-xl text-emerald-100 max-w-4xl mx-auto leading-relaxed">
            Nuestro crecimiento constante refleja la confianza que miles de usuarios 
            depositan en nosotros cada día para sus necesidades de movilidad sostenible.
          </p>
        </div>

        {/* Grid de estadísticas principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-16">
          {mainStats.map((stat, index) => (
            <StatCard key={stat.id} stat={stat} index={index} />
          ))}
        </div>

        
      </div>
    </section>
  );
};