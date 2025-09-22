// src/components/Auth/Register.tsx - Estilo neumórfico completo
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
    <div className="h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative transition-colors duration-200 overflow-hidden">
      {/* Toggle de tema en la esquina superior derecha */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle size="md" />
      </div>

      {/* Formulario */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg lg:w-1/2 lg:max-w-xl lg:px-8 lg:order-1 flex items-center justify-center"
      >
        {/* Formulario principal con estilo neumórfico */}
        <div className="w-full">
          <motion.form
            onSubmit={handleSubmit}
            className="neumorphic-form"
            whileHover={{ 
              x: -8, 
              y: -8,
              transition: { duration: 0.4, ease: "easeInOut" }
            }}
            whileTap={{ 
              x: 0, 
              y: 0,
              transition: { duration: 0.2 }
            }}
          >

          {/* Logo con imagen */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 200 }}
            className="mx-auto w-14 h-14 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 flex items-center justify-center mb-4 shadow-lg overflow-hidden flex-shrink-0"
          >
            <img 
              src="/planet.png" 
              alt="Planet logo" 
              className="w-8 h-8 object-contain"
            />
          </motion.div>

          {/* Título */}
          <h2 className="neumorphic-heading mb-4">
            Crear Cuenta
          </h2>

          <div className="flex-1 flex flex-col justify-between">
            {/* Error Alerts */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3 flex-shrink-0"
              >
                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {passwordError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3 flex-shrink-0"
              >
                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-400 text-sm">{passwordError}</p>
              </motion.div>
            )}

            <div className="space-y-3 flex-1">
              {/* Nombre */}
              <div className="relative">
                <input
                  type="text"
                  name="nombre"
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  className="neumorphic-input pl-10"
                  placeholder="Nombre completo *"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  name="correo"
                  required
                  value={formData.correo}
                  onChange={handleChange}
                  className="neumorphic-input pl-10"
                  placeholder="Correo electrónico *"
                  disabled={loading}
                />
              </div>

              {/* Documento y Teléfono en grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    name="documento"
                    value={formData.documento}
                    onChange={handleChange}
                    className="neumorphic-input pl-10"
                    placeholder="Documento"
                    disabled={loading}
                  />
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="neumorphic-input pl-10"
                    placeholder="Teléfono"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="neumorphic-input pl-10"
                  placeholder="Contraseña *"
                  disabled={loading}
                />
              </div>

              {/* Requisitos de contraseña */}
              {showPasswordRequirements && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 space-y-1"
                >
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requisitos de contraseña:
                  </p>
                  <RequirementIndicator met={passwordRequirements.length} text="Al menos 6 caracteres" />
                  <RequirementIndicator met={passwordRequirements.uppercase} text="Una letra mayúscula" />
                  <RequirementIndicator met={passwordRequirements.lowercase} text="Una letra minúscula" />
                  <RequirementIndicator met={passwordRequirements.number} text="Un número" />
                </motion.div>
              )}

              {/* Confirmar Contraseña */}
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="neumorphic-input pl-10"
                  placeholder="Confirmar contraseña *"
                  disabled={loading}
                />
              </div>

              {/* Indicador de coincidencia */}
              {formData.confirmPassword.length > 0 && (
                <div>
                  <RequirementIndicator met={passwordRequirements.match} text="Las contraseñas coinciden" />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || !formData.nombre || !formData.correo || !formData.password || !Object.values(passwordRequirements).every(req => req)}
              className="neumorphic-button mt-4"
              whileHover={{ 
                x: -8, 
                y: -8,
                transition: { duration: 0.4, ease: "easeInOut" }
              }}
              whileTap={{ 
                x: 0, 
                y: 0,
                transition: { duration: 0.2 }
              }}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 dark:border-gray-300 border-t-transparent"></div>
                  <span>Creando cuenta...</span>
                </div>
              ) : (
                'Crear Cuenta'
              )}
            </motion.button>

            {/* Login Link */}
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
          </div>
                  </motion.form>

          {/* Back to home */}
          <div className="text-center mt-4">
            <Link
              to="/"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Imagen lateral - solo visible en pantallas grandes */}
      <div className="hidden lg:flex lg:w-1/2 items-start justify-center p-1 pt-8 lg:order-2">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full h-full flex items-start justify-center"
        >
          <img 
            src="/der-login.png" 
            alt="Register illustration" 
            className="w-full h-full object-contain min-h-[90vh] max-h-[100vh]"
            style={{
              filter: 'drop-shadow(20px 20px 40px rgba(0, 0, 0, 0.3)) drop-shadow(-10px -10px 30px rgba(255, 255, 255, 0.1))',
              transform: 'translateY(-8vh)'
            }}
          />
        </motion.div>
      </div>

      {/* Estilos CSS completos para el efecto neumórfico */}
      <style>{`
        /* Sombras dinámicas para la imagen en modo oscuro */
        .dark img[src="/der-login.png"] {
          filter: drop-shadow(20px 20px 40px rgba(0, 0, 0, 0.6)) drop-shadow(-10px -10px 30px rgba(255, 255, 255, 0.05)) !important;
        }

        .neumorphic-form {
          display: flex;
          flex-direction: column;
          gap: 0;
          background-color: #f8fafc;
          padding: 1.75rem;
          border-radius: 25px;
          transition: all 0.4s ease-in-out;
          box-shadow: 20px 20px 60px #d0d7de, -20px -20px 60px #ffffff;
          border: 1px solid transparent;
          height: 88vh;
          overflow-y: auto;
          max-width: 100%;
          justify-content: space-between;
          /* Ocultar scrollbar pero mantener funcionalidad */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE y Edge */
        }

        /* Ocultar scrollbar en Webkit (Chrome, Safari, Opera) */
        .neumorphic-form::-webkit-scrollbar {
          display: none;
        }

        .dark .neumorphic-form {
          background-color: #111827;
          box-shadow: 20px 20px 60px #0a0d12, -20px -20px 60px #1a1f2e;
        }

        .neumorphic-form:hover {
          border: 1px solid #e5e7eb;
          box-shadow: 10px 10px 30px #bcc3cf, -10px -10px 30px #ffffff, inset 2px 2px 10px rgba(0,0,0,0.1);
        }

        .dark .neumorphic-form:hover {
          border: 1px solid #374151;
          box-shadow: 10px 10px 30px #070911, -10px -10px 30px #1a1f2e, inset 2px 2px 10px rgba(255,255,255,0.03);
        }

        .neumorphic-heading {
          color: #1f2937;
          padding-bottom: 0.5rem;
          text-align: center;
          font-weight: bold;
          font-size: 1.5rem;
          margin-bottom: 0;
          flex-shrink: 0;
        }

        .dark .neumorphic-heading {
          color: #f9fafb;
        }

        .neumorphic-input {
          width: 100%;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background-color: #f8fafc;
          outline: none;
          padding: 0.875rem 1rem;
          transition: all 0.3s ease-in-out;
          color: #1f2937;
          box-shadow: inset 5px 5px 10px #d0d7de, inset -5px -5px 10px #ffffff;
          font-size: 0.875rem;
          height: 3rem;
        }

        .dark .neumorphic-input {
          border: 1px solid #374151;
          background-color: #111827;
          color: #f9fafb;
          box-shadow: inset 5px 5px 10px #0a0d12, inset -5px -5px 10px #1a1f2e;
        }

        .neumorphic-input::placeholder {
          color: #6b7280;
        }

        .dark .neumorphic-input::placeholder {
          color: #9ca3af;
        }

        .neumorphic-input:hover {
          box-shadow: inset 7px 7px 14px #bcc3cf, inset -7px -7px 14px #ffffff;
          border-color: #d1d5db;
        }

        .dark .neumorphic-input:hover {
          box-shadow: inset 7px 7px 14px #070911, inset -7px -7px 14px #1a1f2e;
          border-color: #4b5563;
        }

        .neumorphic-input:focus {
          background: #ffffff;
          box-shadow: inset 10px 10px 20px #bcc3cf, inset -10px -10px 20px #ffffff;
          border-color: #3b82f6;
        }

        .dark .neumorphic-input:focus {
          background: #0d1117;
          box-shadow: inset 10px 10px 20px #070911, inset -10px -10px 20px #131821;
          border-color: #3b82f6;
        }

        .neumorphic-button {
          margin-top: 1rem;
          align-self: center;
          padding: 0.75rem 1.5rem;
          border-radius: 14px;
          border: none;
          color: #1f2937;
          background-color: #f8fafc;
          font-weight: 600;
          transition: all 0.3s ease-in-out;
          box-shadow: 7px 7px 14px #d0d7de, -7px -7px 14px #ffffff;
          cursor: pointer;
          min-width: 140px;
          font-size: 0.875rem;
          flex-shrink: 0;
          height: 2.75rem;
        }

        .dark .neumorphic-button {
          color: #f9fafb;
          background-color: #111827;
          box-shadow: 7px 7px 14px #0a0d12, -7px -7px 14px #1a1f2e;
        }

        .neumorphic-button:hover:not(:disabled) {
          box-shadow: 4px 4px 8px #bcc3cf, -4px -4px 8px #ffffff, inset 2px 2px 8px rgba(0,0,0,0.1);
          transform: translate(2px, 2px);
        }

        .dark .neumorphic-button:hover:not(:disabled) {
          box-shadow: 4px 4px 8px #070911, -4px -4px 8px #1a1f2e, inset 2px 2px 8px rgba(255,255,255,0.03);
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

        @media (max-width: 640px) {
          .neumorphic-form {
            padding: 1.5rem;
            border-radius: 20px;
            box-shadow: 15px 15px 45px #d0d7de, -15px -15px 45px #ffffff;
          }
          
          .dark .neumorphic-form {
            box-shadow: 15px 15px 45px #0a0d12, -15px -15px 45px #1a1f2e;
          }
          
          .neumorphic-form:hover {
            box-shadow: 8px 8px 24px #bcc3cf, -8px -8px 24px #ffffff, inset 1px 1px 6px rgba(0,0,0,0.1);
          }
          
          .dark .neumorphic-form:hover {
            box-shadow: 8px 8px 24px #070911, -8px -8px 24px #1a1f2e, inset 1px 1px 6px rgba(255,255,255,0.03);
          }
        }
      `}</style>
    </div>
  );
}