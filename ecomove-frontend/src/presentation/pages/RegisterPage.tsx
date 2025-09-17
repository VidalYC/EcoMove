// 🎨 REGISTER PAGE
import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Bike } from 'lucide-react';
import { RegisterForm, RegisterFormData } from '../components/forms/RegisterForm';
import { RegisterUserUseCase } from '../../app/use-cases/RegisterUserUseCase';
import { useAuthStore } from '../../app/stores/authStore';
import { container } from '../../config/container';

const registerUserUseCase = new RegisterUserUseCase(container.repositories.auth);

export const RegisterPage: React.FC = () => {
  const { isAuthenticated, setLoading, setError, login, error, isLoading } = useAuthStore();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await registerUserUseCase.execute(data);

      login(result.user, result.tokens);
      toast.success(`¡Bienvenido a EcoMove, ${result.user.name}!`);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al crear la cuenta';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-20" />
          
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 right-1/4 w-64 h-64 border-2 border-white rounded-full" />
            <div className="absolute bottom-1/4 left-1/4 w-48 h-48 border-2 border-white rounded-full" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white rounded-full" />
          </div>

          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="flex items-center mb-8">
              <Bike className="w-12 h-12 mr-4" />
              <h1 className="text-4xl font-bold">EcoMove</h1>
            </div>
            
            <h2 className="text-3xl font-semibold mb-4">
              Únete a la revolución verde
            </h2>
            
            <p className="text-xl opacity-90 mb-8">
              Crea tu cuenta y accede a la red de transporte sostenible más grande de Colombia. 
              Fácil, rápido y ecológico.
            </p>

            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-sm">✓</span>
                </div>
                <span>Registro completamente gratuito</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-sm">✓</span>
                </div>
                <span>Acceso inmediato a todos los vehículos</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-sm">✓</span>
                </div>
                <span>Tarifas preferenciales para usuarios frecuentes</span>
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-sm">✓</span>
                </div>
                <span>Contribuye a un planeta más limpio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Register form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <Bike className="w-10 h-10 text-teal-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">EcoMove</h1>
            </div>

            <RegisterForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
            />

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link
                  to="/login"
                  className="font-medium text-teal-600 hover:text-teal-500 transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-500">
              Al crear una cuenta, aceptas nuestros{' '}
              <button className="underline hover:text-gray-700">
                términos de servicio
              </button>{' '}
              y{' '}
              <button className="underline hover:text-gray-700">
                política de privacidad
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};