import React from 'react';
import { Zap, MapPin, Clock, Shield, Leaf, Smartphone, CreditCard, Users } from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { IconComponent } from '../../types/icons';

// Interface para las características - Principio de Segregación de Interfaces
interface Feature {
  icon: IconComponent;
  title: string;
  description: string;
  highlighted?: boolean;
}

interface FeaturesSectionProps {
  className?: string;
}

// Componente FeaturesSection - Principio de Responsabilidad Única
export const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  className = ''
}) => {
  // Características principales - Principio Abierto/Cerrado
  const mainFeatures: Feature[] = [
    {
      icon: Zap,
      title: 'Energía Limpia',
      description: 'Todos nuestros vehículos funcionan con energía 100% renovable, reduciendo significativamente tu huella de carbono y contribuyendo a un planeta más verde.',
      highlighted: true
    },
    {
      icon: MapPin,
      title: 'Estaciones Estratégicas',
      description: 'Red inteligente de estaciones ubicadas en puntos clave de la ciudad. Encuentra siempre una estación cerca de tu ubicación actual.',
      highlighted: true
    },
    {
      icon: Clock,
      title: 'Disponible 24/7',
      description: 'Accede a nuestros servicios en cualquier momento del día o la noche. La movilidad sostenible nunca duerme.',
      highlighted: true
    },
    {
      icon: Shield,
      title: 'Seguro y Confiable',
      description: 'Mantenimiento preventivo regular, seguros incluidos y sistema de monitoreo en tiempo real para tu total tranquilidad.'
    }
  ];

  // Características adicionales - Principio Abierto/Cerrado
  const additionalFeatures: Feature[] = [
    {
      icon: Smartphone,
      title: 'App Intuitiva',
      description: 'Interfaz simple y elegante para encontrar, reservar y desbloquear vehículos en segundos.'
    },
    {
      icon: CreditCard,
      title: 'Pagos Flexibles',
      description: 'Múltiples opciones de pago: tarjeta, efectivo digital, suscripciones y paquetes personalizados.'
    },
    {
      icon: Users,
      title: 'Comunidad Activa',
      description: 'Únete a miles de usuarios comprometidos con la movilidad sostenible y el cuidado del medio ambiente.'
    },
    {
      icon: Leaf,
      title: 'Impacto Positivo',
      description: 'Cada viaje contribuye a reducir la contaminación y mejorar la calidad del aire en nuestra ciudad.'
    }
  ];

  // Clases del contenedor principal
  const sectionClasses = [
    'py-20 bg-white dark:bg-gray-900 transition-colors',
    className
  ].join(' ');

  return (
    <section id="features" className={sectionClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado de la sección */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium mb-6">
            <Leaf className="h-4 w-4 mr-2" />
            Características Principales
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            ¿Por qué elegir{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              EcoMove
            </span>
            ?
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Ofrecemos la mejor experiencia de movilidad sostenible con tecnología de punta, 
            infraestructura confiable y un compromiso real con el medio ambiente y tu comodidad.
          </p>
        </div>

        {/* Grid de características principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {mainFeatures.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              variant={feature.highlighted ? 'highlighted' : 'default'}
              size="md"
            />
          ))}
        </div>

        {/* Sección de características adicionales */}
        <div className="relative">
          {/* Separador visual */}
          <div className="flex items-center justify-center mb-16">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
            <div className="px-6">
              <div className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium">
                Más Beneficios
              </div>
            </div>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          {/* Grid de características adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                variant="default"
                size="md"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};