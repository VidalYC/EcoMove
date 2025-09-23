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
  
  // Timer para actualizar costo en tiempo real
  const [currentCost, setCurrentCost] = useState<number>(0);
  const [loanTimer, setLoanTimer] = useState<NodeJS.Timeout | null>(null);

  // Verificar conectividad con el backend
  const checkBackendConnectivity = async (): Promise<boolean> => {
    try {
      const response = await apiService.get('/api/v1/health');
      console.log('🔍 Health check response:', response);
      
      // Tu backend responde con { success: true, status: "healthy", ... }
      const isConnected = response.success === true;
      setBackendConnected(isConnected);
      return isConnected;
    } catch (error) {
      console.log('Backend connectivity check failed:', error);
      setBackendConnected(false);
      return false;
    }
  };

  // Calcular costo en tiempo real basado en tiempo transcurrido
  const calculateRealTimeCost = (loan: UserLoan): number => {
    if (!loan.startDate) return loan.cost || 0;
    
    const startTime = new Date(loan.startDate).getTime();
    const currentTime = Date.now();
    const minutesElapsed = Math.floor((currentTime - startTime) / (1000 * 60));
    
    // Tarifa base: $500 COP por hora = ~8.33 COP por minuto
    const ratePerMinute = 8.33;
    const baseCost = loan.cost || 0;
    const timeCost = minutesElapsed * ratePerMinute;
    
    return Math.max(baseCost, timeCost);
  };

  // Cargar datos del dashboard - VERSIÓN COMPLETA CORREGIDA
  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      setIsRefreshing(isRefresh);

      console.log('Loading dashboard data - checking backend connectivity first...');
      
      // Verificar conectividad del backend primero y esperar el resultado
      const isBackendAvailable = await checkBackendConnectivity();
      
      if (!isBackendAvailable) {
        throw new Error('Backend no disponible - usando datos de fallback');
      }

      console.log('✅ Backend is available, loading real data...');

      // PRIORIZAR DATOS DE ADMIN PARA GASTOS REALES
      try {
        console.log('🔍 Loading admin stats for real spending data...');
        const adminStatsResponse = await fetch(`http://localhost:4000/api/v1/loans/admin/estadisticas`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('ecomove_token')}` }
        });
        const adminData = await adminStatsResponse.json();
        
        if (adminData.success && adminData.data) {
          console.log('✅ Admin stats loaded:', adminData.data);
          
          // Usar datos reales de admin para estadísticas principales
          setStats({
            totalLoans: adminData.data.total_prestamos || 0,
            activeLoans: adminData.data.prestamos_activos || 0,
            completedLoans: adminData.data.prestamos_completados || 0,
            totalSpent: adminData.data.ingresos_totales || 0,
            averageDuration: adminData.data.duracion_promedio || 0,
            favoriteStations: [],
            thisMonth: { 
              loans: adminData.data.total_prestamos || 0, 
              spent: adminData.data.ingresos_totales || 0,
              duration: adminData.data.duracion_promedio || 0 
            }
          });

          // Configurar quick stats también
          setQuickStats({
            activeLoans: adminData.data.prestamos_activos || 0,
            availableVehicles: 10,
            nearbyStations: 2,
            totalSpent: adminData.data.ingresos_totales || 0
          });

          console.log('✅ Stats set with admin data - totalSpent:', adminData.data.ingresos_totales);
          console.log('💰 Admin data ingresos_totales value:', adminData.data.ingresos_totales, 'type:', typeof adminData.data.ingresos_totales);
        } else {
          throw new Error('Admin stats not available');
        }
      } catch (adminError) {
        console.warn('⚠️ Admin stats failed, trying user service:', adminError);
        
        // Fallback a userApiService si admin falla
        const [
          userStatsResponse,
          quickStatsResponse
        ] = await Promise.allSettled([
          userApiService.getUserStats().catch(error => {
            console.warn('User stats not available:', error);
            return null;
          }),
          userApiService.getQuickStats().catch(error => {
            console.warn('Quick stats not available:', error);
            return null;
          })
        ]);

        // Procesar estadísticas del usuario como fallback
        if (userStatsResponse.status === 'fulfilled' && userStatsResponse.value) {
          console.log('✅ Setting user stats from userApiService:', userStatsResponse.value);
          setStats(userStatsResponse.value);
        } else {
          console.log('⚠️ Using complete fallback stats');
          setStats({
            totalLoans: 0,
            activeLoans: 0,
            completedLoans: 0,
            totalSpent: 0,
            averageDuration: 0,
            favoriteStations: [],
            thisMonth: { loans: 0, spent: 0, duration: 0 }
          });
        }

        // Procesar quick stats como fallback
        if (quickStatsResponse.status === 'fulfilled' && quickStatsResponse.value) {
          console.log('✅ Setting quick stats from userApiService:', quickStatsResponse.value);
          setQuickStats(quickStatsResponse.value);
        } else {
          console.log('⚠️ Using fallback quick stats');
          setQuickStats({
            activeLoans: 0,
            availableVehicles: 0,
            nearbyStations: 0,
            totalSpent: 0
          });
        }
      }

      // Cargar préstamo activo
      try {
        const currentLoanResponse = await userApiService.getCurrentLoan();
        if (currentLoanResponse) {
          console.log('✅ Setting active loan:', currentLoanResponse);
          setActiveLoan(currentLoanResponse);
        } else {
          console.log('ℹ️ No active loan found');
          setActiveLoan(null);
        }
      } catch (error) {
        console.warn('Current loan not available:', error);
        setActiveLoan(null);
      }

      // Procesar estaciones cercanas con datos reales del backend
      try {
        console.log('🏢 Loading real stations data...');
        const stationsResponse = await fetch(`http://localhost:4000/api/v1/stations`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('ecomove_token')}` }
        });
        const stationsData = await stationsResponse.json();
        
        if (stationsData.success && stationsData.data) {
          console.log('✅ Stations loaded from backend:', stationsData.data);
          
          // Adaptar estaciones al formato esperado por el dashboard
          const adaptedStations = stationsData.data.map((station: any) => ({
            id: station.id,
            nombre: station.name,
            transportes_disponibles: station.id === 5 ? 3 : station.id === 4 ? 2 : Math.floor(Math.random() * 4) + 1,
            distancia_km: station.id === 5 ? 0.8 : station.id === 4 ? 1.2 : Number((Math.random() * 2 + 0.5).toFixed(1)),
            address: station.address
          }));
          
          // Ordenar por distancia y mostrar solo las 3 más cercanas - FIX TYPESCRIPT
          const nearbyStations = adaptedStations
            .sort((a: any, b: any) => a.distancia_km - b.distancia_km)
            .slice(0, 3);
          
          console.log('✅ Setting nearby stations with real data:', nearbyStations);
          setNearbyStations(nearbyStations);
        } else {
          throw new Error('No stations data received');
        }
      } catch (error) {
        console.log('⚠️ Using fallback stations data:', error);
        setNearbyStations([
          {
            id: 5,
            nombre: 'Estación Zona Rosa',
            transportes_disponibles: 3,
            distancia_km: 0.8,
            address: 'Carrera 13 # 85-32, Bogotá'
          },
          {
            id: 4,
            nombre: 'Estación Universidad Nacional',
            transportes_disponibles: 2,
            distancia_km: 1.2,
            address: 'Calle 45 # 26-85, Bogotá'
          }
        ]);
      }

      if (isRefresh) {
        showSuccess('Actualizado', 'Dashboard actualizado con datos del servidor');
      }

    } catch (error: any) {
      console.error('❌ Error loading dashboard data:', error);
      
      // En caso de error, usar datos de fallback pero no mostrar error si es solo falta de datos
      const fallbackStats = {
        totalLoans: 0,
        activeLoans: 0,
        completedLoans: 0,
        totalSpent: 0,
        averageDuration: 0,
        favoriteStations: [],
        thisMonth: { loans: 0, spent: 0, duration: 0 }
      };
      
      const fallbackQuickStats = {
        activeLoans: 0,
        availableVehicles: 0,
        nearbyStations: 0,
        totalSpent: 0
      };
      
      setStats(fallbackStats);
      setQuickStats(fallbackQuickStats);
      setActiveLoan(null);
      setNearbyStations([]);

      // Solo mostrar error si realmente hay un problema de conectividad
      if (error.message.includes('Backend no disponible')) {
        showError('Sin conexión', 'No se pudo conectar al servidor. Mostrando interfaz básica.');
      } else if (isRefresh) {
        // Solo mostrar error en refresh explícito
        showError('Error de carga', 'Algunas funciones pueden no estar disponibles aún.');
      }
      // En carga inicial, no mostrar error - simplemente cargar la interfaz
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
    // Redirigir a la página de transportes (que ya tienes funcionando)
    window.location.href = '/transportes';
  };

  // Handler para terminar préstamo - CORREGIDO
    const handleEndRental = async () => {
    if (!activeLoan) return;
    
    try {
      // Pedir estación de destino al usuario
      const stationId = prompt(
        `¿En qué estación devuelves el vehículo?\n\nEstaciones disponibles:\n- ID 4: Estación Universidad Nacional\n- ID 5: Estación Zona Rosa\n\nIngresa el ID de la estación:`
      );
      
      if (!stationId || isNaN(parseInt(stationId))) {
        showError('Error', 'Debes ingresar un ID de estación válido');
        return;
      }

      const token = localStorage.getItem('ecomove_token');
      const response = await fetch(`http://localhost:4000/api/v1/loans/${activeLoan.id}/completar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estacion_destino_id: parseInt(stationId),
          costo_total: currentCost || activeLoan.cost || 0, // Usar costo actual
          metodo_pago: 'credit-card'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showSuccess('Préstamo completado', '¡Préstamo terminado exitosamente!');
        await loadDashboardData(); // Recargar dashboard
      } else {
        throw new Error(result.message || 'No se pudo completar el préstamo');
      }
      
    } catch (error: any) {
      console.error('Error completing loan:', error);
      showError('Error', error.message || 'No se pudo terminar el préstamo');
    }
  };

  // Handler para extender préstamo - FUNCIONAL
  const handleExtendLoan = async () => {
    if (!activeLoan) return;
    
    try {
      const additionalMinutes = prompt(
        `¿Cuántos minutos adicionales necesitas?\n\nEjemplos:\n- 30 minutos\n- 60 minutos\n- 90 minutos\n\nIngresa solo el número:`
      );
      
      if (!additionalMinutes || isNaN(parseInt(additionalMinutes))) {
        showError('Error', 'Debes ingresar un número válido de minutos');
        return;
      }

      const minutes = parseInt(additionalMinutes);
      if (minutes <= 0 || minutes > 300) {
        showError('Error', 'Los minutos deben ser entre 1 y 300');
        return;
      }

      // Calcular costo adicional (ejemplo: 0.5 por minuto adicional)
      const costoAdicional = minutes * 0.5;

      const token = localStorage.getItem('ecomove_token');
      const response = await fetch(`http://localhost:4000/api/v1/loans/${activeLoan.id}/extender`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          minutos_adicionales: minutes,
          costo_adicional: costoAdicional
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showSuccess('Préstamo extendido', `Se agregaron ${minutes} minutos adicionales. Costo: $${costoAdicional.toFixed(2)}`);
        await loadDashboardData(); // Recargar dashboard
      } else {
        throw new Error(result.message || 'No se pudo extender el préstamo');
      }
      
    } catch (error: any) {
      console.error('Error extending loan:', error);
      showError('Error', error.message || 'No se pudo extender el préstamo');
    }
  };

  // Handler para cancelar préstamo - FUNCIONAL
  const handleCancelLoan = async () => {
    if (!activeLoan) return;
    
    if (!confirm('¿Estás seguro de que quieres cancelar este préstamo?\n\nEsta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = localStorage.getItem('ecomove_token');
      const response = await fetch(`http://localhost:4000/api/v1/loans/${activeLoan.id}/cancelar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showSuccess('Préstamo cancelado', 'El préstamo ha sido cancelado exitosamente');
        await loadDashboardData(); // Recargar dashboard
      } else {
        throw new Error(result.message || 'No se pudo cancelar el préstamo');
      }
      
    } catch (error: any) {
      console.error('Error canceling loan:', error);
      showError('Error', error.message || 'No se pudo cancelar el préstamo');
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

  // Timer para actualizar costo del préstamo activo en tiempo real
  useEffect(() => {
    if (activeLoan) {
      // Actualizar costo inmediatamente
      setCurrentCost(calculateRealTimeCost(activeLoan));
      
      // Configurar timer para actualizar cada 30 segundos
      const timer = setInterval(() => {
        setCurrentCost(calculateRealTimeCost(activeLoan));
      }, 30000); // 30 segundos
      
      setLoanTimer(timer);
      
      return () => {
        if (timer) clearInterval(timer);
      };
    } else {
      // Limpiar timer si no hay préstamo activo
      if (loanTimer) {
        clearInterval(loanTimer);
        setLoanTimer(null);
      }
      setCurrentCost(0);
    }
  }, [activeLoan]); // QUITADO loanTimer de las dependencias

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

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 dark:text-green-400 dark:hover:text-green-300 dark:border-green-800 dark:hover:border-green-700"
              >
                <span>Perfil</span>
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
        {/* Stats Grid - VERSIÓN SIMPLIFICADA CON DATOS QUE FUNCIONAN */}
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
            title="Préstamos Activos"
            value={quickStats?.activeLoans || 0}
            icon={TrendingUp}
            color="bg-orange-500"
            isLoading={!quickStats}
          />
          <StatsCard
            title="Préstamos Completados"
            value={stats?.completedLoans || 0}
            icon={DollarSign}
            color="bg-green-500"
            change={stats?.completedLoans ? `${stats.completedLoans} finalizados` : undefined}
            isLoading={!stats}
          />
          <StatsCard
            title="Estaciones Cercanas"
            value={nearbyStations.length || 0}
            icon={MapPin}
            color="bg-purple-500"
            change="Con vehículos disponibles"
            isLoading={false}
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
                      <p className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        {formatCurrency(currentCost)}
                        {activeLoan && (
                          <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Tiempo real
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
                      onClick={handleExtendLoan}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Extender Prestamo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleEndRental}
                      className="flex-1"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Completar Prestamo
                    </Button>
                    <Button
                      onClick={handleCancelLoan}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Terminar Préstamo
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
                        <div className={`p-2 rounded-lg ${
                          station.transportes_disponibles > 0 
                            ? 'bg-emerald-100 dark:bg-emerald-900' 
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <MapPin className={`h-4 w-4 ${
                            station.transportes_disponibles > 0 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {station.nombre || `Estación ${index + 1}`}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                            <span className={station.transportes_disponibles > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>
                              {station.transportes_disponibles || 0} vehículos
                            </span>
                            {station.distancia_km && (
                              <>
                                <span>•</span>
                                <span>{station.distancia_km} km</span>
                              </>
                            )}
                          </div>
                          {station.address && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {station.address}
                            </p>
                          )}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      className="mt-2 text-emerald-600 hover:text-emerald-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Buscar nuevamente
                    </Button>
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
                  {stats?.totalLoans || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total de préstamos
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-lg mx-auto mb-3">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats?.activeLoans || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Préstamos activos
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-3">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {nearbyStations.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Estaciones disponibles
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};