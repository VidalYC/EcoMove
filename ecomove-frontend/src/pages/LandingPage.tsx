import React from 'react';
import { Navigation } from '../components/Layout/Navigation';
import { HeroSection } from '../components/Landing/HeroSection';
import { FeaturesSection } from '../components/Landing/FeaturesSection';
import { StatsSection } from '../components/Landing/StatsSection';
import { Footer } from '../components/Layout/Footer';

// Interface para las props de la landing page - Principio de Segregación de Interfaces
interface LandingPageProps {
  className?: string;
}

// Componente LandingPage - Principio de Responsabilidad Única
export const LandingPage: React.FC<LandingPageProps> = ({
  className = ''
}) => {
  // Handlers para navegación - Principio de Responsabilidad Única
  const handleLoginClick = () => {
    // Navegar a la página de login
    window.location.href = '/login';
  };

  const handleRegisterClick = () => {
    // Navegar a la página de registro
    window.location.href = '/register';
  };

  const handleGetStartedClick = () => {
    // Navegar directamente al registro para comenzar
    window.location.href = '/register';
  };

  const handleViewStationsClick = () => {
    // Scroll suave a la sección de estaciones o navegar a mapa
    const element = document.querySelector('#stations');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Si no existe la sección, navegar a página de estaciones
      window.location.href = '/estaciones';
    }
  };

  const handleWatchVideoClick = () => {
    // Abrir modal de video o navegar a video explicativo
    // Por ahora, scroll a la sección de características
    const element = document.querySelector('#features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Clases del contenedor principal
  const pageClasses = [
    'min-h-screen bg-white dark:bg-gray-900 transition-colors',
    className
  ].join(' ');

  return (
    <div className={pageClasses}>
      {/* Navegación */}
      <Navigation 
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
      />

      {/* Sección Hero */}
      <HeroSection 
        onGetStartedClick={handleGetStartedClick}
        onViewStationsClick={handleViewStationsClick}
        onWatchVideoClick={handleWatchVideoClick}
      />

      {/* Sección de Características */}
      <FeaturesSection />

      {/* Sección de Estadísticas */}
      <StatsSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};