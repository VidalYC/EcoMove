import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-white dark:bg-gray-900 flex transition-colors duration-200 relative">
      {/* Elementos decorativos blob - dos capas giradas */}
      <div 
        className="absolute top-1/2 left-[20%] transform -translate-y-1/2 pointer-events-none z-0"
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
        className="absolute top-1/2 left-[22%] transform -translate-y-1/2 rotate-45 pointer-events-none z-0"
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

      {/* Imagen lateral - lado izquierdo */}
      <div className="hidden lg:flex lg:w-[55%] items-center justify-end pl-8 pr-4">
        <motion.img
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          src="/izq-login.png" 
          alt="Login illustration" 
          className="block"
          style={{
            filter: 'drop-shadow(20px 20px 40px rgba(0, 0, 0, 0.3)) drop-shadow(-10px -10px 30px rgba(255, 255, 255, 0.1))',
            width: '800px',
            height: '800px',
            objectFit: 'contain',
            transform: 'translateX(15%)',
            maxWidth: 'none'
          }}
        />
      </div>

      {/* Formulario - lado derecho */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full lg:w-[45%] flex items-center justify-start p-4 sm:p-6 lg:pl-2"
      >
        <div className="w-full max-w-lg">
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
                className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-200 to-blue-200 flex items-center justify-center mb-3 shadow-lg overflow-hidden"
              >
                <img 
                  src="/planet.png" 
                  alt="Planet logo" 
                  className="w-7 h-7 object-contain"
                />
              </motion.div>

              <h2 className="neumorphic-heading">
                Iniciar Sesión
              </h2>
            </div>

            {/* Mensaje de error */}
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

            {/* Campos del formulario */}
            <div className="space-y-4">
              {/* Email */}
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="neumorphic-input"
                  placeholder="Correo electrónico *"
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neumorphic-input pr-12"
                  placeholder="Contraseña *"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Botón de submit */}
            <motion.button
              type="submit"
              disabled={loading || !email || !password}
              className="neumorphic-button w-full mt-6"
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
                  <span>Iniciando...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </motion.button>

            {/* Enlaces */}
            <div className="text-center mt-4">
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

      {/* Estilos CSS optimizados */}
      <style>{`
        .dark img[src="/izq-login.png"] {
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
};

export default Login;