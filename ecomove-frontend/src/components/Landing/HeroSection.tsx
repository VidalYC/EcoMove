import React, { useEffect, useState } from 'react';
import { ArrowRight, Play, MapPin, Zap } from 'lucide-react';
import { Button } from '../UI/Button';
import { ImageContainer } from '../UI/ImageContainer';

// Interface para las props del componente - Principio de Segregación de Interfaces
interface HeroSectionProps {
  onGetStartedClick?: () => void;
  onViewStationsClick?: () => void;
  onWatchVideoClick?: () => void;
}

// Componente HeroSection - Principio de Responsabilidad Única
export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStartedClick,
  onViewStationsClick,
  onWatchVideoClick
}) => {
  const [animatedNumbers, setAnimatedNumbers] = useState({
    users: 0,
    trips: 0,
    co2Saved: 0
  });

  // Animación de números al cargar - Principio de Responsabilidad Única
  useEffect(() => {
    const targetNumbers = {
      users: 10000,
      trips: 75000,
      co2Saved: 450
    };

    const duration = 2000; // 2 segundos
    const steps = 60; // 60 pasos para animación suave
    const stepDuration = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedNumbers({
        users: Math.floor(targetNumbers.users * progress),
        trips: Math.floor(targetNumbers.trips * progress),
        co2Saved: Math.floor(targetNumbers.co2Saved * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, []);

  // Manejar clicks de botones
  const handleGetStartedClick = () => {
    if (onGetStartedClick) {
      onGetStartedClick();
    } else {
      window.location.href = '/register';
    }
  };

  const handleViewStationsClick = () => {
    if (onViewStationsClick) {
      onViewStationsClick();
    } else {
      const element = document.querySelector('#stations');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleWatchVideoClick = () => {
    if (onWatchVideoClick) {
      onWatchVideoClick();
    } else {
      // Abrir modal de video o redirigir a video explicativo
      console.log('Reproducir video explicativo');
    }
  };

  return (
    <section 
      id="home" 
      className="relative min-h-screen flex items-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-hidden pt-16"
    >
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 dark:bg-emerald-900 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-200 dark:bg-teal-900 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-200 dark:bg-cyan-900 rounded-full opacity-10 animate-ping"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenido de texto */}
          <div className="text-center lg:text-left relative z-30">
            {/* Badge de novedad */}
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4 mr-2" />
              Nuevo: ¡Scooters eléctricos disponibles!
            </div>

            {/* Título principal */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Movilidad{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                Sostenible
              </span>
              <br />
              para tu Ciudad
            </h1>

            {/* Subtítulo */}
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-2xl">
              Descubre la libertad de moverte de forma ecológica. Alquila bicicletas y scooters eléctricos 
              disponibles en estaciones estratégicas de la ciudad.
            </p>

            {/* Estadísticas rápidas */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {animatedNumbers.users.toLocaleString()}+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Usuarios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {animatedNumbers.trips.toLocaleString()}+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Viajes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {animatedNumbers.co2Saved}kg
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">CO₂ Ahorrado</div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                onClick={handleGetStartedClick}
                className="group"
              >
                Comenzar Ahora
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                icon={MapPin}
                onClick={handleViewStationsClick}
              >
                Ver Estaciones
              </Button>
              
            </div>

            {/* Información adicional */}
            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Disponible 24/7
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Sin compromisos
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                100% Ecológico
              </div>
            </div>
          </div>

          {/* Contenido visual */}
          <div className="relative lg:flex hidden">
            {/* Contenedor principal de la imagen */}
            <div className="relative z-20 w-[200%] mx-auto -mt-32">
               <ImageContainer
                    src="/vicii.png"
                    alt="EcoMove - Movilidad Sostenible"
                    className="drop-shadow-character-lg"
                  />

              {/* Tarjetas flotantes con información mejoradas */}
              <div className="absolute top-1/4 -left-12 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 transform -rotate-6 hover:rotate-0 transition-all duration-300 z-30 border border-emerald-200 dark:border-emerald-700">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    50+ Estaciones
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Activas 24/7</p>
              </div>

              <div className="absolute bottom-1/3 -right-12 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 transform rotate-6 hover:rotate-0 transition-all duration-300 z-30 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Tiempo Real
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Disponibilidad</p>
              </div>

              {/* Indicador de batería flotante */}
              <div className="absolute top-2/3 -left-6 bg-green-500 text-white rounded-lg px-3 py-2 shadow-lg z-30 transform -rotate-12 hover:rotate-0 transition-transform">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-3 border border-white rounded-sm">
                    <div className="w-4/5 h-full bg-white rounded-sm"></div>
                  </div>
                  <span className="text-xs font-bold">85%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};