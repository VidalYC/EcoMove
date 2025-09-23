// src/pages/User/RentVehicle.tsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin,  
  Bike,
  AlertTriangle,
  CheckCircle,
  DollarSign,
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { VehicleList } from '../../components/Vehicle/VehicleList';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { userApiService } from '../../services/userApi.service';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// ============ INTERFACES ============

interface QuickStats {
  availableVehicles: number;
  nearbyStations: number;
  avgPrice: number;
}

// ============ RENT VEHICLE PAGE ============

export const RentVehicle: React.FC = () => {
  useAuth();
  const { showSuccess, showError, showWarning } = useNotifications();
  const navigate = useNavigate();
  
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [userHasActiveLoan, setUserHasActiveLoan] = useState(false);
  const [isCheckingActiveLoan, setIsCheckingActiveLoan] = useState(true);

  // Verificar si el usuario ya tiene un préstamo activo
  const checkActiveLoan = async () => {
    try {
      setIsCheckingActiveLoan(true);
      const activeLoan = await userApiService.getCurrentLoan();
      setUserHasActiveLoan(activeLoan !== null);
    } catch (error) {
      console.error('Error checking active loan:', error);
      setUserHasActiveLoan(false);
    } finally {
      setIsCheckingActiveLoan(false);
    }
  };

  // Cargar estadísticas rápidas
  const loadQuickStats = async () => {
    try {
      setIsLoadingStats(true);
      const stats = await userApiService.getQuickStats();
      setQuickStats({
        availableVehicles: stats.availableVehicles,
        nearbyStations: stats.nearbyStations,
        avgPrice: 3500 // Precio promedio simulado
      });
    } catch (error) {
      console.error('Error loading quick stats:', error);
      setQuickStats({
        availableVehicles: 0,
        nearbyStations: 0,
        avgPrice: 3500
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Manejar alquiler de vehículo
  const handleRentVehicle = async (vehicleId: string, stationId: string) => {
    try {
      // Verificar nuevamente si el usuario ya tiene un préstamo activo
      const currentLoan = await userApiService.getCurrentLoan();
      if (currentLoan) {
        showWarning(
          'Préstamo activo encontrado',
          'Ya tienes un vehículo alquilado. Termina tu préstamo actual antes de alquilar otro.'
        );
        return;
      }

      // Crear nuevo préstamo
      const newLoan = await userApiService.createLoan(vehicleId, stationId);
      
      showSuccess(
        'Vehículo alquilado exitosamente',
        `Has alquilado el vehículo ${newLoan.transportType} - ${newLoan.transportModel}. ¡Disfruta tu viaje!`
      );

      // Actualizar estado
      setUserHasActiveLoan(true);
      
      // Redirigir al dashboard después de un breve delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Error renting vehicle:', error);
      showError(
        'Error al alquilar vehículo',
        error.message || 'No se pudo completar el alquiler. Inténtalo de nuevo.'
      );
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    checkActiveLoan();
    loadQuickStats();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Si está cargando
  if (isCheckingActiveLoan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando disponibilidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>
              
              <div className="border-l border-gray-300 dark:border-gray-600 pl-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Alquilar Vehículo
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Encuentra el vehículo perfecto para tu viaje
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Verificar si ya tiene un préstamo activo */}
        {userHasActiveLoan ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8"
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Ya tienes un vehículo alquilado
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  Debes terminar tu préstamo actual antes de poder alquilar otro vehículo.
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => navigate('/dashboard')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Ver Préstamo Activo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={checkActiveLoan}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/30"
                  >
                    Verificar Nuevamente
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Estadísticas rápidas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              {/* Vehículos disponibles */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Bike className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Vehículos Disponibles
                  </h3>
                </div>
                {isLoadingStats ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {quickStats?.availableVehicles || 0}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Listos para alquilar
                </p>
              </div>

              {/* Estaciones cercanas */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Estaciones Activas
                  </h3>
                </div>
                {isLoadingStats ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {quickStats?.nearbyStations || 0}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  En tu área
                </p>
              </div>

              {/* Precio promedio */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Precio Promedio
                  </h3>
                </div>
                {isLoadingStats ? (
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(quickStats?.avgPrice || 3500)}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Por hora
                </p>
              </div>
            </motion.div>

            {/* Información importante */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8"
            >
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Información importante
                  </h3>
                  <ul className="space-y-1 text-blue-700 dark:text-blue-300 text-sm">
                    <li>• Solo puedes tener un vehículo alquilado a la vez</li>
                    <li>• El tiempo se cuenta desde el momento del alquiler</li>
                    <li>• Debes devolver el vehículo en cualquier estación activa</li>
                    <li>• Revisa el estado del vehículo antes de usarlo</li>
                    <li>• El pago se procesa automáticamente al finalizar</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Lista de vehículos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <VehicleList onRent={handleRentVehicle} />
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};