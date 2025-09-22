import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence, Variants } from 'framer-motion';
import { Navigation } from '../components/Layout/Navigation';
import { HeroSection } from '../components/Landing/HeroSection';
import { FeaturesSection } from '../components/Landing/FeaturesSection';
import { StatsSection } from '../components/Landing/StatsSection';
import { Footer } from '../components/Layout/Footer';
import { Logo } from '../components/UI/Logo';

// Interface para las props de la landing page
interface LandingPageProps {
  className?: string;
}

// Interfaz para las secciones
interface Section {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
}

// Componente de partículas flotantes más sutil
const FloatingParticles: React.FC = () => {
  const particles = Array.from({ length: 8 }, (_, i) => i);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-2 h-2 bg-emerald-300/20 rounded-full blur-sm"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
          }}
          animate={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
          }}
          transition={{
            duration: Math.random() * 30 + 40,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

// Wrapper de sección con animaciones más suaves
interface SectionWrapperProps {
  children: React.ReactNode;
  sectionId: string;
  index: number;
  animationType?: 'fadeUp' | 'slideLeft' | 'scaleIn' | 'fadeIn';
  setCurrentSection: (index: number) => void;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({ 
  children, 
  sectionId, 
  index, 
  animationType = 'fadeUp',
  setCurrentSection 
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.2 });

  // Animaciones más suaves y menos agresivas
  const getAnimationVariants = (): Variants => {
    switch (animationType) {
      case 'slideLeft':
        return {
          hidden: { opacity: 0, x: -60 },
          visible: { 
            opacity: 1, 
            x: 0
          }
        };
      
      case 'scaleIn':
        return {
          hidden: { opacity: 0, scale: 0.9 },
          visible: { 
            opacity: 1, 
            scale: 1
          }
        };
      
      case 'fadeIn':
        return {
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1
          }
        };
      
      default: // fadeUp
        return {
          hidden: { opacity: 0, y: 40 },
          visible: { 
            opacity: 1, 
            y: 0
          }
        };
    }
  };

  useEffect(() => {
    if (isInView) {
      setCurrentSection(index);
    }
  }, [isInView, index, setCurrentSection]);

  return (
    <motion.section
      ref={ref}
      id={sectionId}
      className="relative"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.2 }}
      variants={getAnimationVariants()}
      transition={{ 
        duration: 0.8, 
        ease: "easeOut" 
      }}
    >
      {children}
    </motion.section>
  );
};

// Navegación lateral simplificada
interface SideNavigationProps {
  sections: Section[];
  currentSection: number;
}

const SideNavigation: React.FC<SideNavigationProps> = ({ sections, currentSection }) => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div 
      className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 hidden lg:block"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.5, duration: 0.5 }}
    >
      <div className="flex flex-col space-y-3">
        {sections.map((section, index) => (
          <motion.button
            key={section.id}
            className={`w-2 h-8 rounded-full transition-all duration-300 ${
              currentSection === index 
                ? 'bg-emerald-500 shadow-lg' 
                : 'bg-gray-300 hover:bg-emerald-300'
            }`}
            onClick={() => scrollToSection(section.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={section.id}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Transición de página simplificada
const PageTransition: React.FC<{ isVisible: boolean }> = ({ isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        className="fixed inset-0 z-50 bg-white dark:bg-gray-900"
        initial={{ clipPath: 'circle(0% at 50% 50%)' }}
        animate={{ clipPath: 'circle(150% at 50% 50%)' }}
        exit={{ clipPath: 'circle(0% at 50% 50%)' }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <div className="flex items-center justify-center h-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Logo 
              size="lg"
              imageUrl="/planet.png"
              fallbackToIcon={true}
              showText={false}
              className="scale-150"
            />
          </motion.div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Efecto de scroll reveal para elementos individuales
const ScrollReveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ 
  children, 
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
};

// Componente LandingPage principal
export const LandingPage: React.FC<LandingPageProps> = ({
  className = ''
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const { scrollYProgress } = useScroll();

  // Efecto de parallax sutil para el fondo
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  // Handlers para navegación
  const handleLoginClick = () => {
    setShowTransition(true);
    setTimeout(() => {
      window.location.href = '/login';
    }, 800);
  };

  const handleRegisterClick = () => {
    setShowTransition(true);
    setTimeout(() => {
      window.location.href = '/register';
    }, 800);
  };

  const handleGetStartedClick = () => {
    setShowTransition(true);
    setTimeout(() => {
      window.location.href = '/register';
    }, 800);
  };

  const handleViewStationsClick = () => {
    const element = document.querySelector('#features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowTransition(true);
      setTimeout(() => {
        window.location.href = '/estaciones';
      }, 800);
    }
  };


  // Definición de secciones
  const sections: Section[] = [
    { 
      id: 'hero', 
      component: HeroSection,
      props: {
        onGetStartedClick: handleGetStartedClick,
        onViewStationsClick: handleViewStationsClick
      }
    },
    { 
      id: 'features', 
      component: FeaturesSection 
    },
    { 
      id: 'stats', 
      component: StatsSection 
    }
  ];

  // Tipos de animación más sutiles
  const animationTypes: Array<'fadeUp' | 'slideLeft' | 'scaleIn' | 'fadeIn'> = [
    'fadeUp',    // Hero
    'slideLeft', // Features
    'scaleIn'    // Stats
  ];

  const pageClasses = [
    'relative min-h-screen bg-white dark:bg-gray-900 transition-colors',
    className
  ].join(' ');

  return (
    <div className={pageClasses}>
      {/* Background con parallax sutil */}
      <motion.div
        className="fixed inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-blue-50/30 pointer-events-none"
        style={{ y: backgroundY }}
      />

      {/* Partículas flotantes */}
      <FloatingParticles />

      {/* Navegación */}
      <ScrollReveal>
        <div className="relative z-30">
          <Navigation 
            onLoginClick={handleLoginClick}
            onRegisterClick={handleRegisterClick}
          />
        </div>
      </ScrollReveal>

      {/* Secciones principales */}
      <div className="relative z-20">
        {sections.map((section, index) => {
          const Component = section.component;
          return (
            <SectionWrapper
              key={section.id}
              sectionId={section.id}
              index={index}
              animationType={animationTypes[index]}
              setCurrentSection={setCurrentSection}
            >
              <ScrollReveal delay={index * 0.1}>
                <Component {...(section.props || {})} />
              </ScrollReveal>
            </SectionWrapper>
          );
        })}

        {/* Footer */}
        <SectionWrapper
          sectionId="footer"
          index={sections.length}
          animationType="fadeUp"
          setCurrentSection={setCurrentSection}
        >
          <ScrollReveal delay={0.2}>
            <Footer />
          </ScrollReveal>
        </SectionWrapper>
      </div>

      {/* Navegación lateral */}
      <SideNavigation 
        sections={sections} 
        currentSection={currentSection} 
      />

      {/* Transición de página */}
      <PageTransition isVisible={showTransition} />

      {/* Indicador de progreso de scroll */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 transform origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />
    </div>
  );
};