import React from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  ArrowRight,
  Heart
} from 'lucide-react';
import { IconComponent } from '../../types/icons';
import { Logo } from '../UI/Logo';

// Interface para links del footer - Principio de Segregación de Interfaces
interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  name: string;
  href: string;
  icon: IconComponent;
}

interface FooterProps {
  className?: string;
}

// Componente Footer - Principio de Responsabilidad Única
export const Footer: React.FC<FooterProps> = ({
  className = ''
}) => {
  // Secciones de links - Principio Abierto/Cerrado
  const footerSections: FooterSection[] = [
    {
      title: 'Servicios',
      links: [
        { label: 'Alquiler de Bicicletas', href: '/bicicletas' },
        { label: 'Scooters Eléctricos', href: '/scooters' },
        { label: 'Mapa de Estaciones', href: '/estaciones' },
        { label: 'Planes y Precios', href: '/precios' },
        { label: 'App Móvil', href: '/app' }
      ]
    },
    {
      title: 'Empresa',
      links: [
        { label: 'Acerca de Nosotros', href: '/about' },
        { label: 'Nuestro Equipo', href: '/equipo' },
        { label: 'Carreras', href: '/carreras' },
        { label: 'Prensa', href: '/prensa' },
        { label: 'Blog', href: '/blog' }
      ]
    },
    {
      title: 'Soporte',
      links: [
        { label: 'Centro de Ayuda', href: '/ayuda' },
        { label: 'Contáctanos', href: '/contacto' },
        { label: 'Reportar Problema', href: '/reporte' },
        { label: 'Estado del Servicio', href: '/status' },
        { label: 'FAQ', href: '/faq' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Términos de Uso', href: '/terminos' },
        { label: 'Política de Privacidad', href: '/privacidad' },
        { label: 'Cookies', href: '/cookies' },
        { label: 'Seguridad', href: '/seguridad' },
        { label: 'Accesibilidad', href: '/accesibilidad' }
      ]
    }
  ];

  // Redes sociales - Principio Abierto/Cerrado
  const socialLinks: SocialLink[] = [
    { name: 'Facebook', href: 'https://facebook.com/ecomove', icon: Facebook },
    { name: 'Twitter', href: 'https://twitter.com/ecomove', icon: Twitter },
    { name: 'Instagram', href: 'https://instagram.com/ecomove', icon: Instagram },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/ecomove', icon: Linkedin }
  ];

  // Información de contacto - Principio Abierto/Cerrado
  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'hola@ecomove.co',
      href: 'mailto:hola@ecomove.co'
    },
    {
      icon: Phone,
      label: 'Teléfono',
      value: '+57 300 123 4567',
      href: 'tel:+573001234567'
    },
    {
      icon: MapPin,
      label: 'Dirección',
      value: 'Calle 123 #45-67, Valledupar, Cesar',
      href: 'https://maps.google.com/?q=Valledupar+Cesar'
    }
  ];

  // Manejar clicks en enlaces
  const handleLinkClick = (href: string, external?: boolean) => {
    if (external || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) {
      window.open(href, '_blank', 'noopener noreferrer');
    } else {
      // Para navegación interna (cuando implementes React Router)
      window.location.href = href;
    }
  };

  // Clases del footer
  const footerClasses = [
    'bg-gray-900 dark:bg-gray-950 text-white transition-colors',
    className
  ].join(' ');

  return (
    <footer className={footerClasses}>
      {/* Sección principal del footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Información de la empresa */}
          <div className="lg:col-span-2">
            {/* Logo y nombre */}
            <Logo 
              size="md"
              imageUrl="/planet.png"
              fallbackToIcon={true}
              textColor="text-white"
              className="mb-6"
            />

            {/* Descripción */}
            <p className="text-gray-400 mb-6 leading-relaxed">
              Transformando la movilidad urbana con soluciones sostenibles e innovadoras. 
              Conectamos a las personas con alternativas de transporte ecológicas para 
              construir ciudades más verdes y habitables.
            </p>

            {/* Newsletter signup */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Mantente Informado</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400"
                />
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-r-lg transition-colors flex items-center">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Recibe noticias sobre nuevas estaciones y promociones.
              </p>
            </div>

            {/* Redes sociales */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Síguenos</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <button
                    key={social.name}
                    onClick={() => handleLinkClick(social.href, true)}
                    className="w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors group"
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Enlaces organizados en secciones */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleLinkClick(link.href, link.external)}
                      className="text-gray-400 hover:text-emerald-400 transition-colors text-sm block w-full text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Separador */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información de contacto */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Información de Contacto</h4>
              <div className="space-y-3">
                {contactInfo.map((contact) => (
                  <button
                    key={contact.label}
                    onClick={() => handleLinkClick(contact.href, true)}
                    className="flex items-center text-gray-400 hover:text-emerald-400 transition-colors group"
                  >
                    <contact.icon className="h-4 w-4 mr-3 group-hover:text-emerald-400" />
                    <span className="text-sm">{contact.value}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Certificaciones y premios */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Certificaciones</h4>
              <div className="flex flex-wrap gap-4">
                <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300">
                  ISO 14001
                </div>
                <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300">
                  Carbono Neutral
                </div>
                <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300">
                  B-Corp Certified
                </div>
                <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300">
                  Movilidad Sostenible
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center text-gray-400 text-sm">
              <span>&copy; 2025 EcoMove. Todos los derechos reservados.</span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                Hecho con <Heart className="h-4 w-4 text-red-500 mx-1" /> en Colombia
              </span>
            </div>

            {/* Links legales rápidos */}
            <div className="flex items-center space-x-6 text-sm">
              <button
                onClick={() => handleLinkClick('/terminos')}
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                Términos
              </button>
              <button
                onClick={() => handleLinkClick('/privacidad')}
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                Privacidad
              </button>
              <button
                onClick={() => handleLinkClick('/cookies')}
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                Cookies
              </button>
              <button
                onClick={() => handleLinkClick('/sitemap')}
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                Sitemap
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};