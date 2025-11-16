// src/pages/Admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Bike,
  MapPin,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Settings,
  BarChart3,
  Shield,
  Activity,
  LogOut,
  RefreshCw,
  UserPlus,
  ChevronRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { ThemeToggle } from '../../components/UI/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { adminApiService, SystemStats } from '../../services/adminApi.service';
import { motion } from 'framer-motion';

interface QuickAction {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
  color: string;
  description: string;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'rental_completed' | 'vehicle_maintenance' | 'payment_processed';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Acciones rápidas de administración
  const quickActions: QuickAction[] = [
    {
      icon: Users,
      label: 'Gestionar Usuarios',
      href: '/admin/usuarios',
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Ver, editar y administrar usuarios'
    },
    {
      icon: Bike,
      label: 'Gestionar Vehículos',
      href: '/admin/vehiculos',
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Control de bicicletas y scooters'
    },
    {
      icon: MapPin,
      label: 'Gestionar Estaciones',
      href: '/admin/estaciones',
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Administrar puntos de alquiler'
    },
    {
      icon: BarChart3,
      label: 'Reportes',
      href: '/admin/reportes',
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Análisis y estadísticas detalladas'
    },
    {
      icon: DollarSign,
      label: 'Finanzas',
      href: '/admin/finanzas',
      color: 'bg-emerald-500 hover:bg-emerald-600',
      description: 'Ingresos, pagos y facturación'
    },
    {
      icon: Settings,
      label: 'Configuración',
      href: '/admin/configuracion',
      color: 'bg-gray-500 hover:bg-gray-600',
      description: 'Ajustes del sistema'
    }
  ];

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const systemStats = await adminApiService.getSystemStats();
      setStats(systemStats);

      // Simular actividad reciente (en una app real vendría del backend)
      setRecentActivity([
        {
          id: '1',
          type: 'user_registration',
          message: `Nuevo usuario registrado (Total: ${systemStats.users.totalUsers})`,
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          severity: 'success'
        },
        {
          id: '2',
          type: 'vehicle_maintenance',
          message: `${systemStats.transports.maintenanceVehicles} vehículos en mantenimiento`,
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          severity: 'warning'
        },
        {
          id: '3',
          type: 'rental_completed',
          message: `${systemStats.loans.completedLoans} préstamos completados este mes`,
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          severity: 'success'
        },
        {
          id: '4',
          type: 'payment_processed',
          message: `Ingresos totales: $${formatCurrency(systemStats.loans.totalRevenue)}`,
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          severity: 'info'
        }
      ]);

      showSuccess('Dashboard actualizado', 'Datos cargados correctamente');
    } catch (error: any) {
      console.error('Error loading admin data:', error);
      showError('Error de carga', error.message || 'No se pudieron cargar los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await loadAdminData();
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

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays}d`;
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'success': return 'text-green-800 dark:text-green-200';
      case 'warning': return 'text-yellow-800 dark:text-yellow-200';
      case 'error': return 'text-red-800 dark:text-red-200';
      default: return 'text-blue-800 dark:text-blue-200';
    }
  };

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

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Error al cargar datos</p>
          <Button onClick={handleRefresh}>Reintentar</Button>
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
              <Shield className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Panel de Administración
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Bienvenido, {user?.nombre}
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
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
              >
                <Shield className="h-4 w-4" />
                <span>Mi Perfil</span>
              </Button>

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
        {/* Métricas Principales */}
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
                  Total Usuarios
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.users.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  +{stats.users.newUsersThisMonth} este mes
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                  {stats.transports.availableVehicles}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  de {stats.transports.totalVehicles} total
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
                  Estaciones Activas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.stations.activeStations}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  {Math.round(stats.stations.occupancyRate)}% ocupación
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
                  Préstamos Activos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.loans.activeLoans}
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(stats.loans.totalRevenue)} ingresos
                </p>
              </div>
              <div className="bg-emerald-100 dark:bg-emerald-900/20 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Acciones Rápidas */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => navigate(action.href)}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Actividad Reciente */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Actividad Reciente
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert('Vista completa de logs próximamente')}
                >
                  Ver Todo
                </Button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-lg">
                      {getSeverityIcon(activity.severity)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${getSeverityColor(activity.severity)}`}>
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel de Control Rápido */}
          <div className="space-y-6">
            {/* Estado del Sistema */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Estado del Sistema
              </h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Sistema Operativo
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Todos los servicios funcionando
                    </p>
                  </div>
                </div>

                {stats.transports.maintenanceVehicles > 0 && (
                  <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Mantenimiento Requerido
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        {stats.transports.maintenanceVehicles} vehículos requieren atención
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Métricas de Hoy
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Tasa de Utilización
                    </span>
                  </div>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {Math.round(stats.transports.utilizationRate)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Usuarios Activos
                    </span>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {stats.users.activeUsers}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Duración Promedio
                    </span>
                  </div>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {Math.round(stats.loans.averageDuration)} min
                  </span>
                </div>
                
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Ingresos del Mes
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(stats.loans.totalRevenue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acceso Rápido a Reportes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Reportes Rápidos
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => alert('Reporte de usuarios próximamente')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Reporte de Usuarios
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => alert('Reporte financiero próximamente')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Reporte Financiero
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => alert('Análisis de utilización próximamente')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Análisis de Utilización
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Alertas y Notificaciones */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Alertas y Notificaciones del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Usuarios Nuevos
                </h4>
                <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                +{stats.users.newUsersThisMonth}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Registros este mes
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                  Mantenimiento
                </h4>
                <Settings className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {stats.transports.maintenanceVehicles}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Vehículos requieren atención
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  Eficiencia
                </h4>
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {Math.round(stats.transports.utilizationRate)}%
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Tasa de utilización
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};