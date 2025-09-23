// src/pages/User/UserDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Bike, 
  Clock, 
  DollarSign,
  User,
  LogOut,
  RefreshCw,
  Play,
  Square,
  Sun,
  Calendar,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { ThemeToggle } from '../../components/UI/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { userApiService, UserStats, QuickStats, UserLoan } from '../../services/userApi.service';
import { motion } from 'framer-motion';

interface QuickAction {
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  action: () => void;
  color: string;
}

export const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [recentLoans, setRecentLoans] = useState<UserLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadUserData();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or unavailable:', error);
        }
      );
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      const [statsData, quickStatsData, loansData] = await Promise.allSettled([
        userApiService.getUserStats(),
        userApiService.getQuickStats(userLocation?.lat, userLocation?.lng),
        userApiService.getUserLoans()
      ]);

      if (statsData.status === 'fulfilled') {
        setUserStats(statsData.value);
      }

      if (quickStatsData.status === 'fulfilled') {
        setQuickStats(quickStatsData.value);
      }

      if (loansData.status === 'fulfilled') {
        // Mostrar los 3 préstamos más recientes
        const sortedLoans = loansData.value.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentLoans(sortedLoans.slice(0, 3));
      }

      showSuccess('Dashboard actualizado', 'Datos cargados correctamente');
    } catch (error: any) {
      console.error('Error loading user data:', error);
      showError('Error de carga', error.message || 'No se pudieron cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await loadUserData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      showError('Error', 'No se pudo cerrar la sesión');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays}d`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'completed': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active': return 'En Uso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Acciones rápidas del usuario
  const quickActions: QuickAction[] = [
    {
      icon: MapPin,
      label: 'Ver Estaciones',
      description: 'Encuentra estaciones cercanas',
      action: () => window.location.href = '/estaciones',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: Bike,
      label: 'Alquilar Vehículo',
      description: 'Buscar vehículos disponibles',
      action: () => window.location.href = '/transportes',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: User,
      label: 'Mi Perfil',
      description: 'Ver y editar información personal',
      action: () => window.location.href = '/profile',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      icon: Clock,
      label: 'Historial',
      description: 'Ver historial de viajes',
      action: () => alert('Historial completo próximamente'),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

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
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ¡Hola, {user?.nombre}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Bienvenido a tu dashboard personal
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </Button>
              
              <ThemeToggle />
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Préstamo Activo Alert */}
        {quickStats?.currentLoan && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Play className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100">
                    Tienes un préstamo activo
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {quickStats.currentLoan.vehicleType === 'bicycle' ? 'Bicicleta' : 'Patineta'} • 
                    Desde {quickStats.currentLoan.originStationName}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={() => alert('Ver detalles del préstamo')}>
                  Ver Detalles
                </Button>
                <Button size="sm" onClick={() => alert('Finalizar préstamo')}>
                  <Square className="h-4 w-4 mr-1" />
                  Finalizar
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Estaciones Cercanas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {quickStats?.nearbyStations || 0}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  En tu área
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Vehículos Disponibles
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {quickStats?.availableVehicles || 0}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Listos para usar
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
                <Bike className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Mis Viajes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats?.totalLoans || 0}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  {userStats?.completedLoans || 0} completados
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Gastado
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(userStats?.totalSpent || 0)}
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  Este mes: {formatCurrency(userStats?.thisMonth.spent || 0)}
                </p>
              </div>
              <div className="bg-emerald-100 dark:bg-emerald-900/20 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Weather and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Weather Info */}
          {quickStats?.weatherInfo && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Clima Actual</h3>
                <Sun className="h-6 w-6" />
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-bold">
                  {quickStats.weatherInfo.temperature}°C
                </div>
                <div>
                  <p className="text-blue-100 capitalize">
                    {quickStats.weatherInfo.condition}
                  </p>
                  <p className="text-sm text-blue-200 mt-1">
                    {quickStats.weatherInfo.recommendation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Acciones Rápidas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={action.action}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${action.color} p-2 rounded-lg transition-transform group-hover:scale-110`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {action.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Actividad Reciente
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert('Historial completo próximamente')}
                >
                  Ver Todo
                </Button>
              </div>
              
              {recentLoans.length > 0 ? (
                <div className="space-y-4">
                  {recentLoans.map((loan) => (
                    <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                          <Bike className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {loan.vehicleType === 'bicycle' ? 'Bicicleta' : 'Patineta'} • {loan.vehicleModel}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Desde {loan.originStationName}
                            {loan.destinationStationName && ` hasta ${loan.destinationStationName}`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {formatTimeAgo(loan.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                          {getStatusText(loan.status)}
                        </span>
                        {loan.totalCost > 0 && (
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                            {formatCurrency(loan.totalCost)}
                          </p>
                        )}
                        {loan.duration && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {formatDuration(loan.duration)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bike className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Aún no tienes préstamos registrados
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    ¡Alquila tu primer vehículo para empezar!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* User Statistics */}
          <div className="space-y-6">
            {/* Monthly Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Resumen del Mes
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Viajes este mes
                    </span>
                  </div>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {userStats?.thisMonth.loans || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Gastado este mes
                    </span>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(userStats?.thisMonth.spent || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Tiempo total
                    </span>
                  </div>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {formatDuration(userStats?.thisMonth.duration || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Logros
              </h3>
              <div className="space-y-3">
                {userStats && userStats.totalLoans >= 1 && (
                  <div className="flex items-center space-x-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Primer Viaje
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        ¡Completaste tu primer viaje!
                      </p>
                    </div>
                  </div>
                )}

                {userStats && userStats.totalLoans >= 10 && (
                  <div className="flex items-center space-x-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Explorador
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        10+ viajes completados
                      </p>
                    </div>
                  </div>
                )}

                {userStats && userStats.totalLoans < 1 && (
                  <div className="text-center py-4">
                    <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Completa viajes para desbloquear logros
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Favorite Stations */}
            {userStats && userStats.favoriteStations.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Estaciones Favoritas
                </h3>
                <div className="space-y-3">
                  {userStats.favoriteStations.slice(0, 3).map((station) => (
                    <div key={station.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {station.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {station.address}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {station.availableVehicles} disponibles
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};