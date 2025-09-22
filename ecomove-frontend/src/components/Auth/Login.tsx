import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '../UI/ThemeToggle';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, clearError, user } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!email || !password) {
      return;
    }

    const success = await login({
      correo: email,
      password: password,
    });

    if (success) {
      console.log('Login exitoso');
    }
  };

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative transition-colors duration-200 overflow-hidden">
      {/* Toggle de tema en la esquina superior derecha */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle size="md" />
      </div>

      {/* Imagen lateral - solo visible en pantallas grandes */}
      <div className="hidden lg:flex lg:w-1/2 items-start justify-center p-1 pt-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full h-full flex items-start justify-center"
        >
          <img 
            src="/izq-login.png" 
            alt="Login illustration" 
            className="w-full h-full object-contain min-h-[90vh] max-h-[100vh]"
            style={{
              filter: 'drop-shadow(20px 20px 40px rgba(0, 0, 0, 0.3)) drop-shadow(-10px -10px 30px rgba(255, 255, 255, 0.1))',
              transform: 'translateY(-8vh)'
            }}
          />
        </motion.div>
      </div>

      {/* Formulario */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md lg:w-1/2 lg:max-w-lg lg:px-8 flex items-center justify-center"
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
            className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 flex items-center justify-center mb-8 shadow-lg overflow-hidden"
          >
            <img 
              src="/planet.png" 
              alt="Planet logo" 
              className="w-10 h-10 object-contain"
            />
          </motion.div>
          
          {/* Título */}
          <h2 className="neumorphic-heading">
            Iniciar Sesión
          </h2>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3"
            >
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Email Input */}
          <div className="relative mb-4">
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="neumorphic-input pl-12"
              placeholder="Correo electrónico"
              required
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div className="relative mb-6">
            
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="neumorphic-input pl-12 pr-12"
              placeholder="Contraseña"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading || !email || !password}
            className="neumorphic-button"
            whileHover={{ 
              x: -8, 
              y: -8,
              transition: { duration: 0.2, ease: "easeInOut" }
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
                <span>Iniciando...</span>
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </motion.button>

          {/* Register Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              ¿No tienes una cuenta?{' '}
              <Link
                to="/register"
                className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>

          
                  </motion.form>

          {/* Back to home */}
          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Estilos CSS en línea para el efecto neumórfico */}
      <style>{`
        /* Sombras dinámicas para la imagen en modo oscuro */
        .dark img[src="/izq-login.png"] {
          filter: drop-shadow(20px 20px 40px rgba(0, 0, 0, 0.6)) drop-shadow(-10px -10px 30px rgba(255, 255, 255, 0.05)) !important;
        }

        .neumorphic-form {
          display: flex;
          flex-direction: column;
          gap: 0;
          background-color: #f8fafc;
          padding: 2rem;
          border-radius: 25px;
          transition: all 0.4s ease-in-out;
          box-shadow: 20px 20px 60px #d0d7de, -20px -20px 60px #ffffff;
          border: 1px solid transparent;
          max-height: 80vh;
          overflow-y: auto;
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
          padding-bottom: 1rem;
          text-align: center;
          font-weight: bold;
          font-size: 1.875rem;
          margin-bottom: 0;
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
          padding: 0.875rem;
          transition: all 0.3s ease-in-out;
          color: #1f2937;
          box-shadow: inset 6px 6px 12px #d0d7de, inset -6px -6px 12px #ffffff;
        }

        .dark .neumorphic-input {
          border: 1px solid #374151;
          background-color: #111827;
          color: #f9fafb;
          box-shadow: inset 6px 6px 12px #0a0d12, inset -6px -6px 12px #1a1f2e;
        }

        .neumorphic-input::placeholder {
          color: #6b7280;
        }

        .dark .neumorphic-input::placeholder {
          color: #9ca3af;
        }

        .neumorphic-input:hover {
          box-shadow: inset 8px 8px 16px #bcc3cf, inset -8px -8px 16px #ffffff;
          border-color: #d1d5db;
        }

        .dark .neumorphic-input:hover {
          box-shadow: inset 8px 8px 16px #070911, inset -8px -8px 16px #1a1f2e;
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
          padding: 0.875rem 2rem;
          border-radius: 16px;
          border: none;
          color: #1f2937;
          background-color: #f8fafc;
          font-weight: 600;
          transition: all 0.3s ease-in-out;
          box-shadow: 8px 8px 16px #d0d7de, -8px -8px 16px #ffffff;
          cursor: pointer;
          min-width: 150px;
        }

        .dark .neumorphic-button {
          color: #f9fafb;
          background-color: #111827;
          box-shadow: 8px 8px 16px #0a0d12, -8px -8px 16px #1a1f2e;
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
};

export default Login;