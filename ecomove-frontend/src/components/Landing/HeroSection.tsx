import React, { useEffect, useState } from 'react';
import { ArrowRight, Play, MapPin, Zap } from 'lucide-react';
import { Button } from '../UI/Button'; // 👈 Tu componente Button existente (ahora con variante custom)
import { ImageContainer } from '../UI/ImageContainer';
import VideoModal from '../VideoModal';

// Interface para las props del componente - Principio de Segregación de Interfaces
interface HeroSectionProps {
  onGetStartedClick?: () => void;
  onViewStationsClick?: () => void;
  onWatchVideoClick?: () => void;
  videoUrl?: string;
}

// Componente HeroSection - Principio de Responsabilidad Única
export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStartedClick,
  onViewStationsClick,
  onWatchVideoClick,
  videoUrl = "/videos/intro.mp4"
}) => {
  const [animatedNumbers, setAnimatedNumbers] = useState({
    users: 0,
    trips: 0,
    co2Saved: 0
  });

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

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
      setIsVideoModalOpen(true);
    }
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
  };

  return (
    <>
      <section 
        id="home" 
        className="relative min-h-screen flex items-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-hidden pt-16"
      >
        {/* Elementos decorativos de fondo - círculos animados flotantes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Círculos flotantes con movimiento libre y blur */}
          <div className="floating-circles">
            <div className="floating-circle circle-1"></div>
            <div className="floating-circle circle-2"></div>
            <div className="floating-circle circle-3"></div>
            <div className="floating-circle circle-4"></div>
            <div className="floating-circle circle-5"></div>
            <div className="floating-circle circle-6"></div>
            <div className="floating-circle circle-7"></div>
            <div className="floating-circle circle-8"></div>
          </div>
          
          {/* Grid pattern sutil */}
          
        </div>

        {/* Contenido principal */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Contenido de texto */}
            <div className="text-center lg:text-left relative z-30">
              {/* Badge de novedad */}
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium mb-6">
                
                ♻️Nuevo: ¡Scooters eléctricos disponibles!
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
                {/* Botón principal - Verde (acción principal) */}
                <Button
                  variant="custom"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={handleGetStartedClick}
                >
                  Comenzar Ahora
                </Button>
                
                {/* Botón secundario - Azul (multimedia) */}
                <Button
                  variant="custom-secondary"
                  icon={Play}
                  iconPosition="left"
                  onClick={handleWatchVideoClick}
                >
                  Ver Video
                </Button>
                
                {/* Botón terciario - Gris (navegación) */}
                <Button
                  variant="custom-tertiary"
                  icon={MapPin}
                  iconPosition="left"
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
                {/* Sombra debajo de la imagen */}
                <div 
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4 z-10"
                  style={{
                    width: '60%',
                    height: '20px',
                    background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.05) 50%, transparent 100%)',
                    borderRadius: '50%',
                    filter: 'blur(8px)'
                  }}
                />
                
                 <ImageContainer
                      src="/vicii.png"
                      alt="EcoMove - Movilidad Sostenible"
                      className="drop-shadow-character-lg relative z-20"
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

      {/* Modal de Video */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideoModal}
        videoUrl={videoUrl}
        title="EcoMove - Video Introductorio"
      />

      {/* Estilos CSS para círculos flotantes */}
      <style>{`
        .floating-circles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .floating-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(20px);
          animation: float 20s infinite linear;
          opacity: 0.4;
        }

        /* Círculo 1 - Emerald grande */
        .circle-1 {
          width: 400px;
          height: 400px;
          background: linear-gradient(45deg, #10b981, #34d399);
          top: 10%;
          left: -200px;
          animation-duration: 25s;
          animation-delay: 0s;
        }

        /* Círculo 2 - Teal mediano */
        .circle-2 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #14b8a6, #5eead4);
          top: 60%;
          right: -150px;
          animation-duration: 30s;
          animation-delay: -5s;
        }

        /* Círculo 3 - Cyan pequeño */
        .circle-3 {
          width: 200px;
          height: 200px;
          background: linear-gradient(225deg, #06b6d4, #67e8f9);
          top: 80%;
          left: 20%;
          animation-duration: 20s;
          animation-delay: -10s;
        }

        /* Círculo 4 - Blue mediano */
        .circle-4 {
          width: 240px;
          height: 240px;
          background: linear-gradient(315deg, #3b82f6, #93c5fd);
          top: 25%;
          right: 15%;
          animation-duration: 35s;
          animation-delay: -15s;
        }

        /* Círculo 5 - Verde claro pequeño */
        .circle-5 {
          width: 160px;
          height: 160px;
          background: linear-gradient(45deg, #22c55e, #86efac);
          top: 40%;
          left: 80%;
          animation-duration: 18s;
          animation-delay: -8s;
        }

        /* Círculo 6 - Teal oscuro mediano */
        .circle-6 {
          width: 320px;
          height: 320px;
          background: linear-gradient(180deg, #0f766e, #2dd4bf);
          top: -160px;
          left: 40%;
          animation-duration: 28s;
          animation-delay: -20s;
        }

        /* Círculo 7 - Emerald pequeño */
        .circle-7 {
          width: 180px;
          height: 180px;
          background: linear-gradient(90deg, #059669, #6ee7b7);
          bottom: 10%;
          right: 30%;
          animation-duration: 22s;
          animation-delay: -12s;
        }

        /* Círculo 8 - Cyan grande */
        .circle-8 {
          width: 360px;
          height: 360px;
          background: linear-gradient(270deg, #0891b2, #a5f3fc);
          bottom: -180px;
          left: 60%;
          animation-duration: 32s;
          animation-delay: -25s;
        }

        /* Animación de movimiento libre */
        @keyframes float {
          0% {
            transform: translateX(0) translateY(0) rotate(0deg);
          }
          25% {
            transform: translateX(100px) translateY(-100px) rotate(90deg);
          }
          50% {
            transform: translateX(-50px) translateY(-200px) rotate(180deg);
          }
          75% {
            transform: translateX(-150px) translateY(-100px) rotate(270deg);
          }
          100% {
            transform: translateX(0) translateY(0) rotate(360deg);
          }
        }

        /* Variantes de animación para más naturalidad */
        .circle-2 {
          animation-name: float-reverse;
        }

        .circle-4 {
          animation-name: float-diagonal;
        }

        .circle-6 {
          animation-name: float-wave;
        }

        .circle-8 {
          animation-name: float-spiral;
        }

        @keyframes float-reverse {
          0% {
            transform: translateX(0) translateY(0) rotate(0deg);
          }
          25% {
            transform: translateX(-80px) translateY(120px) rotate(-90deg);
          }
          50% {
            transform: translateX(60px) translateY(180px) rotate(-180deg);
          }
          75% {
            transform: translateX(120px) translateY(80px) rotate(-270deg);
          }
          100% {
            transform: translateX(0) translateY(0) rotate(-360deg);
          }
        }

        @keyframes float-diagonal {
          0% {
            transform: translateX(0) translateY(0) rotate(0deg) scale(1);
          }
          50% {
            transform: translateX(-200px) translateY(-150px) rotate(180deg) scale(1.2);
          }
          100% {
            transform: translateX(0) translateY(0) rotate(360deg) scale(1);
          }
        }

        @keyframes float-wave {
          0% {
            transform: translateX(0) translateY(0) rotate(0deg);
          }
          25% {
            transform: translateX(150px) translateY(50px) rotate(90deg);
          }
          50% {
            transform: translateX(100px) translateY(-100px) rotate(180deg);
          }
          75% {
            transform: translateX(-100px) translateY(50px) rotate(270deg);
          }
          100% {
            transform: translateX(0) translateY(0) rotate(360deg);
          }
        }

        @keyframes float-spiral {
          0% {
            transform: translateX(0) translateY(0) rotate(0deg) scale(1);
          }
          25% {
            transform: translateX(100px) translateY(-80px) rotate(180deg) scale(0.8);
          }
          50% {
            transform: translateX(0) translateY(-160px) rotate(360deg) scale(1.1);
          }
          75% {
            transform: translateX(-100px) translateY(-80px) rotate(540deg) scale(0.9);
          }
          100% {
            transform: translateX(0) translateY(0) rotate(720deg) scale(1);
          }
        }

        /* Modo oscuro - ajustar opacidad y colores */
        .dark .floating-circle {
          opacity: 0.3;
        }

        /* Responsivo - reducir en móviles */
        @media (max-width: 768px) {
          .floating-circle {
            transform: scale(0.7);
            opacity: 0.4;
          }
          
          .dark .floating-circle {
            opacity: 0.2;
          }
        }
      `}</style>
    </>
  );
};