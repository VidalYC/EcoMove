// src/pages/User/UserDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bike, 
  MapPin, 
  Clock,
  DollarSign,
  Activity,
  TrendingUp,
  Navigation,
  Play,
  Square,
  RefreshCw,
  ChevronRight,
  Calendar,
  Target,
  LogOut
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { ThemeToggle } from '../../components/UI/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { userApiService, UserStats, QuickStats, UserLoan } from '../../services/userApi.service';
import { apiService } from '../../services/api.service';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  change?: string;
  isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, change, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        {isLoading ? (
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
        {change && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{change}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </motion.div>
);

export const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [stats, setStats] = useState<UserStats | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [activeLoan, setActiveLoan] = useState<UserLoan | null>(null);
  const [nearbyStations, setNearbyStations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  // Verificar conectividad con el backend
  const checkBackendConnectivity = async () => {
    try {
      // Usar la ruta correcta que acabas de verificar
      const response = await apiService.get('/api/v1/health');
      // Tu backend responde con { success: true, status: "healthy", ... }
      setBackendConnected(response.success === true);
    } catch (error) {
      console.log('Backend connectivity check failed:', error);
      setBackendConnected(false);
    }
  };

  // Cargar datos del dashboard - VERSIÓN SIMPLIFICADA
  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      setIsRefreshing(isRefresh);

      // Por ahora solo cargamos datos básicos para evitar errores
      // Una vez que las rutas estén corregidas, volveremos a la versión completa
      console.log('Loading dashboard data - simplified version');
      
      // Establecer datos de fallback por defecto
      setStats({
        totalLoans: 0,
        activeLoans: 0,
        completedLoans: 0,
        totalSpent: 0,
        averageDuration: 0,
        favoriteStations: [],
        thisMonth: { loans: 0, spent: 0, duration: 0 }
      });
      
      setQuickStats({
        activeLoans: 0,
        availableVehicles: 0,
        nearbyStations: 0,
        totalSpent: 0
      });
      
      setActiveLoan(null);
      setNearbyStations([]);

      if (isRefresh) {
        showSuccess('Actualizado', 'Datos básicos cargados correctamente');
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      showError('Error de carga', 'Mostrando interfaz básica. Las APIs se están configurando.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    await loadDashboardData(true);
  };

  const handleStartRental = () => {
    // Redirigir a la página de alquiler
    window.location.href = '/rent-vehicle';
  };

  const handleEndRental = async () => {
    if (!activeLoan) return;
    
    try {
      // TODO: Implementar lógica completa para terminar préstamo
      await userApiService.completeLoan(activeLoan.id, '1'); // Station ID temporal
      showSuccess('Préstamo terminado', 'El préstamo se ha completado exitosamente');
      await loadDashboardData();
    } catch (error: any) {
      console.error('Error ending rental:', error);
      showError('Error', error.message || 'No se pudo terminar el préstamo. Inténtalo de nuevo.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('Sesión cerrada', 'Has cerrado sesión exitosamente');
      // Redirigir a la página principal
      window.location.href = '/';
    } catch (error: any) {
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

  useEffect(() => {
    checkBackendConnectivity();
    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
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
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ¡Hola, {user?.nombre}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Bienvenido a tu dashboard de EcoMove
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Indicador de conectividad */}
              {backendConnected !== null && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    backendConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`text-xs ${
                    backendConnected 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {backendConnected ? 'Conectado' : 'Sin conexión'}
                  </span>
                </div>
              )}
              
              {/* Toggle de tema */}
              <ThemeToggle />
              
              {/* Botón de actualizar */}
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
              
              {/* Botón de cerrar sesión */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300 dark:border-red-800 dark:hover:border-red-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Préstamos Totales"
            value={stats?.totalLoans || 0}
            icon={Activity}
            color="bg-blue-500"
            change={stats?.thisMonth.loans ? `+${stats.thisMonth.loans} este mes` : undefined}
            isLoading={!stats}
          />
          <StatsCard
            title="Gasto Total"
            value={stats ? formatCurrency(stats.totalSpent) : formatCurrency(0)}
            icon={DollarSign}
            color="bg-green-500"
            change={stats?.thisMonth.spent ? `+${formatCurrency(stats.thisMonth.spent)} este mes` : undefined}
            isLoading={!stats}
          />
          <StatsCard
            title="Tiempo de Uso"
            value={stats ? formatDuration(stats.averageDuration) : '0m'}
            icon={Clock}
            color="bg-purple-500"
            change={stats?.thisMonth.duration ? `+${formatDuration(stats.thisMonth.duration)} este mes` : undefined}
            isLoading={!stats}
          />
          <StatsCard
            title="Préstamos Activos"
            value={quickStats?.activeLoans || 0}
            icon={TrendingUp}
            color="bg-orange-500"
            isLoading={!quickStats}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Préstamo Activo */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Préstamo Activo
                </h2>
                {activeLoan && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                    En curso
                  </span>
                )}
              </div>

              {activeLoan ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="p-3 bg-emerald-500 rounded-lg">
                      <Bike className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {activeLoan.transportType} - {activeLoan.transportModel}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Desde: {activeLoan.originStation.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Iniciado: {new Date(activeLoan.startDate).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(activeLoan.cost)}
                      </p>
                      {activeLoan.duration && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDuration(activeLoan.duration)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleEndRental}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Terminar Préstamo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => showSuccess('Próximamente', 'Función en desarrollo')}
                      className="flex-1"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Extender Tiempo
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-8">
                  <Bike className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No tienes préstamos activos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    ¡Encuentra un vehículo cerca de ti y comienza tu viaje ecológico!
                  </p>
                  <Button
                    onClick={handleStartRental}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Préstamo
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Estaciones Cercanas */}
          <div className="space-y-6">
            {/* Acciones Rápidas */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Acciones Rápidas
              </h2>
              <div className="space-y-3">
                <Button
                  onClick={handleStartRental}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white justify-start"
                >
                  <Bike className="h-4 w-4 mr-3" />
                  Alquilar Vehículo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => showSuccess('Próximamente', 'Función en desarrollo')}
                  className="w-full justify-start"
                >
                  <MapPin className="h-4 w-4 mr-3" />
                  Ver Mapa
                </Button>
                <Button
                  variant="outline"
                  onClick={() => showSuccess('Próximamente', 'Función en desarrollo')}
                  className="w-full justify-start"
                >
                  <Calendar className="h-4 w-4 mr-3" />
                  Mi Historial
                </Button>
              </div>
            </div>

            {/* Estaciones Cercanas */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Estaciones Cercanas
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => showSuccess('Próximamente', 'Función en desarrollo')}
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {nearbyStations.length > 0 ? (
                  nearbyStations.map((station: any, index: number) => (
                    <motion.div
                      key={station.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      onClick={() => showSuccess('Próximamente', 'Navegación a estación en desarrollo')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                          <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {station.nombre || `Estación ${index + 1}`}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                            <span>{station.transportes_disponibles || 0} vehículos</span>
                            {station.distancia_km && (
                              <>
                                <span>•</span>
                                <span>{station.distancia_km.toFixed(1)} km</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <MapPin className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No se encontraron estaciones cercanas
                    </p>
                  </div>
                )}
              </div>

              {nearbyStations.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => showSuccess('Próximamente', 'Función en desarrollo')}
                  className="w-full mt-3 text-emerald-600 hover:text-emerald-700"
                >
                  Ver todas las estaciones
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Resumen de Actividad Reciente */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Resumen de Este Mes
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => showSuccess('Próximamente', 'Función en desarrollo')}
              >
                Ver historial completo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-3">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.thisMonth.loans || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Préstamos este mes
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-lg mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats ? formatCurrency(stats.thisMonth.spent) : formatCurrency(0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gastado este mes
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-3">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats ? formatDuration(stats.thisMonth.duration) : '0m'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tiempo de uso
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};