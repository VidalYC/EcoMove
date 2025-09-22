// src/components/Auth/Register.tsx - Formulario optimizado sin desperdiciar espacio
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../UI/ThemeToggle';
import { AlertCircle, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    documento: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const { register, loading, error, clearError, user } = useAuth();
  const navigate = useNavigate();

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }

    if (name === 'password') {
      setShowPasswordRequirements(value.length > 0);
    }
  };

  // Verificar requisitos de contraseña
  const passwordRequirements = {
    length: formData.password.length >= 6,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.password.length > 0
  };

  const validateForm = (): boolean => {
    setPasswordError('');

    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return false;
    }

    if (formData.password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setPasswordError('La contraseña debe contener al menos una letra mayúscula');
      return false;
    }

    if (!/[a-z]/.test(formData.password)) {
      setPasswordError('La contraseña debe contener al menos una letra minúscula');
      return false;
    }

    if (!/\d/.test(formData.password)) {
      setPasswordError('La contraseña debe contener al menos un número');
      return false;
    }

    if (!formData.nombre || !formData.correo || !formData.password) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    clearError();

    if (!validateForm()) {
      return;
    }

    const success = await register({
      nombre: formData.nombre,
      correo: formData.correo,
      documento: formData.documento,
      telefono: formData.telefono,
      password: formData.password,
    });

    if (success) {
      console.log('Registro exitoso');
    }
  };

  const RequirementIndicator = ({ met, text }: { met: boolean; text: string }) => (
    <div
      className={`flex items-center space-x-2 text-sm ${
        met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      {met ? (
        <Check className="h-4 w-4 flex-shrink-0" />
      ) : (
        <X className="h-4 w-4 flex-shrink-0" />
      )}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex transition-colors duration-200 relative">
      {/* Elementos decorativos blob - dos capas giradas */}
      <div 
        className="absolute top-1/2 right-[20%] transform -translate-y-1/2 pointer-events-none z-0"
        style={{
          width: '500px',
          height: '500px',
          background: 'linear-gradient(135deg, #06B6D4 0%, #10B981 50%, #3B82F6 100%)',
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          opacity: 0.2,
        }}
      />
      
      {/* Segundo blob girado */}
      <div 
        className="absolute top-1/2 right-[18%] transform -translate-y-1/2 rotate-45 pointer-events-none z-0"
        style={{
          width: '400px',
          height: '400px',
          background: 'linear-gradient(200deg, #22D3EE 0%, #34D399 70%)',
          borderRadius: '40% 60% 60% 40% / 40% 40% 60% 60%',
          opacity: 0.15,
        }}
      />
      
      {/* Toggle de tema en la esquina superior derecha */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle size="md" />
      </div>

      {/* Formulario - Centrado y optimizado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6"
      >
        <div className="w-full max-w-md">
          <motion.form
            onSubmit={handleSubmit}
            className="neumorphic-form"
            whileHover={{ 
              x: -6, 
              y: -6,
              transition: { duration: 0.3, ease: "easeInOut" }
            }}
            whileTap={{ 
              x: 0, 
              y: 0,
              transition: { duration: 0.2 }
            }}
          >
            {/* Logo y título compactos */}
            <div className="flex flex-col items-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 200 }}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 flex items-center justify-center mb-3 shadow-lg overflow-hidden"
              >
                <img 
                  src="/planet.png" 
                  alt="Planet logo" 
                  className="w-7 h-7 object-contain"
                />
              </motion.div>

              <h2 className="neumorphic-heading">
                Crear Cuenta
              </h2>
            </div>

            {/* Mensajes de error compactos */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2"
              >
                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {passwordError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2"
              >
                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-400 text-sm">{passwordError}</p>
              </motion.div>
            )}

            {/* Campos del formulario con espaciado optimizado */}
            <div className="space-y-3">
              {/* Nombre */}
              <div>
                <input
                  type="text"
                  name="nombre"
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  className="neumorphic-input"
                  placeholder="Nombre completo *"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  name="correo"
                  required
                  value={formData.correo}
                  onChange={handleChange}
                  className="neumorphic-input"
                  placeholder="Correo electrónico *"
                  disabled={loading}
                />
              </div>

              {/* Documento y Teléfono en grid compacto */}
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  name="documento"
                  value={formData.documento}
                  onChange={handleChange}
                  className="neumorphic-input"
                  placeholder="Documento"
                  disabled={loading}
                />
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="neumorphic-input"
                  placeholder="Teléfono"
                  disabled={loading}
                />
              </div>

              {/* Contraseña */}
              <div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="neumorphic-input"
                  placeholder="Contraseña *"
                  disabled={loading}
                />
              </div>

              {/* Requisitos de contraseña compactos */}
              {showPasswordRequirements && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 space-y-1"
                >
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Requisitos de contraseña:
                  </p>
                  <RequirementIndicator met={passwordRequirements.length} text="Al menos 6 caracteres" />
                  <RequirementIndicator met={passwordRequirements.uppercase} text="Una letra mayúscula" />
                  <RequirementIndicator met={passwordRequirements.lowercase} text="Una letra minúscula" />
                  <RequirementIndicator met={passwordRequirements.number} text="Un número" />
                </motion.div>
              )}

              {/* Confirmar Contraseña */}
              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="neumorphic-input"
                  placeholder="Confirmar contraseña *"
                  disabled={loading}
                />
              </div>

              {/* Indicador de coincidencia compacto */}
              {formData.confirmPassword.length > 0 && (
                <RequirementIndicator met={passwordRequirements.match} text="Las contraseñas coinciden" />
              )}
            </div>

            {/* Botón de submit */}
            <motion.button
              type="submit"
              disabled={loading || !formData.nombre || !formData.correo || !formData.password || !Object.values(passwordRequirements).every(req => req)}
              className="neumorphic-button w-full mt-5"
              whileHover={{ 
                x: -6, 
                y: -6,
                transition: { duration: 0.3, ease: "easeInOut" }
              }}
              whileTap={{ 
                x: 0, 
                y: 0,
                transition: { duration: 0.2 }
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 dark:border-gray-300 border-t-transparent"></div>
                  <span>Creando cuenta...</span>
                </div>
              ) : (
                'Crear Cuenta'
              )}
            </motion.button>

            {/* Enlaces compactos */}
            <div className="text-center mt-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                ¿Ya tienes una cuenta?{' '}
                <Link
                  to="/login"
                  className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </motion.form>

          {/* Back to home */}
          <div className="text-center mt-3">
            <Link
              to="/"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Imagen lateral - contenedor más grande */}
      <div className="hidden lg:flex lg:w-[55%] items-center justify-start relative overflow-visible">
        <motion.img
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          src="/der-login.png" 
          alt="Register illustration" 
          className="block"
          style={{
            filter: 'drop-shadow(20px 20px 40px rgba(0, 0, 0, 0.3)) drop-shadow(-10px -10px 30px rgba(255, 255, 255, 0.1))',
            width: '800px',
            height: '800px',
            objectFit: 'contain',
            transform: 'translateX(-15%)',
            maxWidth: 'none'
          }}
        />
      </div>

      {/* Estilos CSS optimizados */}
      <style>{`
        .dark img[src="/der-login.png"] {
          filter: drop-shadow(20px 20px 40px rgba(0, 0, 0, 0.6)) drop-shadow(-10px -10px 30px rgba(255, 255, 255, 0.05)) !important;
        }

        .neumorphic-form {
          background-color: #f8fafc;
          padding: 2.5rem;
          border-radius: 25px;
          transition: all 0.3s ease-in-out;
          box-shadow: 12px 12px 35px #d0d7de, -12px -12px 35px #ffffff;
          border: 1px solid transparent;
          max-width: 100%;
          min-width: 480px;
        }

        .dark .neumorphic-form {
          background-color: #111827;
          box-shadow: 12px 12px 35px #0a0d12, -12px -12px 35px #1a1f2e;
        }

        .neumorphic-form:hover {
          border: 1px solid #e5e7eb;
          box-shadow: 6px 6px 18px #bcc3cf, -6px -6px 18px #ffffff, inset 1px 1px 5px rgba(0,0,0,0.1);
        }

        .dark .neumorphic-form:hover {
          border: 1px solid #374151;
          box-shadow: 6px 6px 18px #070911, -6px -6px 18px #1a1f2e, inset 1px 1px 5px rgba(255,255,255,0.03);
        }

        .neumorphic-heading {
          color: #1f2937;
          text-align: center;
          font-weight: bold;
          font-size: 1.375rem;
          margin: 0;
        }

        .dark .neumorphic-heading {
          color: #f9fafb;
        }

        .neumorphic-input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background-color: #f8fafc;
          outline: none;
          padding: 1rem 1.25rem;
          transition: all 0.3s ease-in-out;
          color: #1f2937;
          box-shadow: inset 4px 4px 8px #d0d7de, inset -4px -4px 8px #ffffff;
          font-size: 1rem;
          height: 3.5rem;
        }

        .dark .neumorphic-input {
          border: 1px solid #374151;
          background-color: #111827;
          color: #f9fafb;
          box-shadow: inset 4px 4px 8px #0a0d12, inset -4px -4px 8px #1a1f2e;
        }

        .neumorphic-input::placeholder {
          color: #6b7280;
        }

        .dark .neumorphic-input::placeholder {
          color: #9ca3af;
        }

        .neumorphic-input:hover {
          box-shadow: inset 6px 6px 12px #bcc3cf, inset -6px -6px 12px #ffffff;
          border-color: #d1d5db;
        }

        .dark .neumorphic-input:hover {
          box-shadow: inset 6px 6px 12px #070911, inset -6px -6px 12px #1a1f2e;
          border-color: #4b5563;
        }

        .neumorphic-input:focus {
          background: #ffffff;
          box-shadow: inset 8px 8px 16px #bcc3cf, inset -8px -8px 16px #ffffff;
          border-color: #3b82f6;
        }

        .dark .neumorphic-input:focus {
          background: #0d1117;
          box-shadow: inset 8px 8px 16px #070911, inset -8px -8px 16px #131821;
          border-color: #3b82f6;
        }

        .neumorphic-button {
          padding: 1rem 1.5rem;
          border-radius: 15px;
          border: none;
          color: #1f2937;
          background-color: #f8fafc;
          font-weight: 600;
          transition: all 0.3s ease-in-out;
          box-shadow: 8px 8px 20px #d0d7de, -8px -8px 20px #ffffff;
          cursor: pointer;
          font-size: 1rem;
          height: 3.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dark .neumorphic-button {
          color: #f9fafb;
          background-color: #111827;
          box-shadow: 8px 8px 20px #0a0d12, -8px -8px 20px #1a1f2e;
        }

        .neumorphic-button:hover:not(:disabled) {
          box-shadow: 4px 4px 10px #bcc3cf, -4px -4px 10px #ffffff, inset 1px 1px 4px rgba(0,0,0,0.1);
          transform: translate(2px, 2px);
        }

        .dark .neumorphic-button:hover:not(:disabled) {
          box-shadow: 4px 4px 10px #070911, -4px -4px 10px #1a1f2e, inset 1px 1px 4px rgba(255,255,255,0.03);
          transform: translate(2px, 2px);
        }

        .neumorphic-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .neumorphic-button:active:not(:disabled) {
          transition: 0.1s;
          box-shadow: inset 4px 4px 8px #bcc3cf, inset -4px -4px 8px #ffffff;
          transform: translate(0, 0);
        }

        .dark .neumorphic-button:active:not(:disabled) {
          box-shadow: inset 4px 4px 8px #070911, inset -4px -4px 8px #1a1f2e;
        }

        @media (max-width: 1024px) {
          .neumorphic-form {
            padding: 1.5rem;
            border-radius: 18px;
            box-shadow: 10px 10px 30px #d0d7de, -10px -10px 30px #ffffff;
          }
          
          .dark .neumorphic-form {
            box-shadow: 10px 10px 30px #0a0d12, -10px -10px 30px #1a1f2e;
          }
        }

        @media (max-width: 640px) {
          .neumorphic-form {
            padding: 1.25rem;
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  );
}