// src/pages/User/UserDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  MapPin, 
  Clock, 
  CreditCard, 
  User,
  History,
  Star,
  TrendingUp,
  LogOut
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { ThemeToggle } from '../../components/UI/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

interface RentalStats {
  totalRides: number;
  totalDistance: number;
  totalTime: number;
  co2Saved: number;
}

interface ActiveRental {
  id: string;
  vehicle: {
    type: 'bike' | 'scooter';
    id: string;
    batteryLevel?: number;
  };
  startTime: Date;
  startLocation: string;
}

interface QuickAction {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
  color: string;
}

export const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<RentalStats>({
    totalRides: 0,
    totalDistance: 0,
    totalTime: 0,
    co2Saved: 0
  });
  const [activeRental, setActiveRental] = useState<ActiveRental | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Acciones rápidas
  const quickActions: QuickAction[] = [
    {
      icon: Bike,
      label: 'Alquilar Vehículo',
      href: '/transportes',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: MapPin,
      label: 'Ver Estaciones',
      href: '/estaciones',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: History,
      label: 'Mi Historial',
      href: '/prestamos',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      icon: CreditCard,
      label: 'Métodos de Pago',
      href: '/profile',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  useEffect(() => {
    // Cargar datos del usuario
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Simulación de carga de datos - aquí harías llamadas a tu API
      setTimeout(() => {
        setStats({
          totalRides: 42,
          totalDistance: 180.5,
          totalTime: 320,
          co2Saved: 15.2
        });

        // Opcional: Simular alquiler activo
        // setActiveRental({
        //   id: 'rental-123',
        //   vehicle: { type: 'bike', id: 'B-142' },
        //   startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
        //   startLocation: 'Estación Central'
        // });

        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                ¡Hola, {user?.nombre}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Bienvenido a tu dashboard de EcoMove
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle size="md" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/profile'}
                className="flex items-center space-x-2"
              >
                <User size={16} />
                <span>Perfil</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 border-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                <span>Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alquiler Activo */}
        {activeRental && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-green-500 p-3 rounded-full">
                  <Bike className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Alquiler Activo
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    {activeRental.vehicle.type === 'bike' ? 'Bicicleta' : 'Scooter'} {activeRental.vehicle.id}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Desde {activeRental.startLocation}
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => alert('Funcionalidad de finalizar viaje próximamente')}
                className="bg-green-600 hover:bg-green-700"
              >
                Finalizar Viaje
              </Button>
            </div>
          </motion.div>
        )}

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = action.href}
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {action.label}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Accede rápidamente a {action.label.toLowerCase()}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Total de Viajes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalRides}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-full">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Distancia Total
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalDistance} km
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-full">
                <MapPin className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Tiempo Total
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(stats.totalTime)}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-full">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  CO₂ Ahorrado
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.co2Saved} kg
                </p>
              </div>
              <div className="bg-green-600 p-3 rounded-full">
                <Star className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Adicional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actividad Reciente
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                  <Bike className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Viaje completado
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Estación Central → Universidad - 2.5 km
                  </p>
                </div>
                <span className="text-xs text-gray-400">2h</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                  <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Pago procesado
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    $5.500 - Viaje completado
                  </p>
                </div>
                <span className="text-xs text-gray-400">1d</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recomendaciones
            </h3>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  ¡Consigue tu Plan Mensual!
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Ahorra hasta 30% en tus viajes con nuestro plan mensual unlimited.
                </p>
                <Button size="sm" variant="primary" className="bg-blue-600 hover:bg-blue-700">
                  Ver Planes
                </Button>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Recomienda a un amigo
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Gana viajes gratis invitando a tus amigos a usar EcoMove.
                </p>
                <Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                  Invitar Amigos
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};