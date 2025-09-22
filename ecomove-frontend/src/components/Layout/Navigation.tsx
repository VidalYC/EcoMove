import React, { useState, useEffect } from 'react';
import { Menu, X, LogIn, UserPlus } from 'lucide-react';
import { Button } from '../UI/Button';
import { ThemeToggle } from '../UI/ThemeToggle';
import { Logo } from '../UI/Logo';

// Interface para los elementos de navegación - Principio de Segregación de Interfaces
interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

interface NavigationProps {
  className?: string;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

// Componente Navigation - Principio de Responsabilidad Única
export const Navigation: React.FC<NavigationProps> = ({
  className = '',
  onLoginClick,
  onRegisterClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Items de navegación - Principio Abierto/Cerrado
  const navItems: NavItem[] = [
    { label: 'Inicio', href: '#home' },
    { label: 'Características', href: '#features' },
    { label: 'Estadísticas', href: '#stats' }
  ];

  // Efecto para detectar scroll y cambiar estilo de la navegación
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Manejar click en elemento de navegación
  const handleNavClick = (href: string, external?: boolean) => {
    if (external) {
      window.open(href, '_blank');
    } else {
      // Scroll suave a la sección
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  // Manejar click en login
  const handleLoginClick = () => {
    setIsOpen(false);
    if (onLoginClick) {
      onLoginClick();
    } else {
      // Navegación por defecto a login
      window.location.href = '/login';
    }
  };

  // Manejar click en registro
  const handleRegisterClick = () => {
    setIsOpen(false);
    if (onRegisterClick) {
      onRegisterClick();
    } else {
      // Navegación por defecto a registro
      window.location.href = '/register';
    }
  };

  // Clases dinámicas para la navegación
  const navClasses = [
    'fixed top-0 left-0 right-0 z-50',
    'transition-all duration-300',
    isScrolled 
      ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg border-b border-gray-200 dark:border-gray-700'
      : 'bg-transparent',
    className
  ].join(' ');

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y marca */}
          <div className="flex items-center">
            <Logo 
              size="md"
              imageUrl="/planet.png"
              fallbackToIcon={true}
              onClick={() => handleNavClick('#home')}
            />
          </div>

          {/* Navegación desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Links de navegación */}
            <div className="flex justify-center items-center space-x-6">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.href, item.external)}
                  className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-2 text-sm font-medium transition-colors relative group"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
                </button>
              ))}
            </div>

            {/* Controles de tema y autenticación */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={LogIn}
                  onClick={handleLoginClick}
                >
                  Iniciar Sesión
                </Button>
                
                <Button
                  variant="primary"
                  size="sm"
                  icon={UserPlus}
                  onClick={handleRegisterClick}
                >
                  Registrarse
                </Button>
              </div>
            </div>
          </div>

          {/* Botón de menú móvil */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle size="sm" />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
              {/* Links de navegación móvil */}
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.href, item.external)}
                  className="block w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  {item.label}
                </button>
              ))}
              
              {/* Separador */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
              
              {/* Botones de autenticación móvil */}
              <div className="space-y-2 px-3">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  icon={LogIn}
                  onClick={handleLoginClick}
                >
                  Iniciar Sesión
                </Button>
                
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  icon={UserPlus}
                  onClick={handleRegisterClick}
                >
                  Registrarse
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};