// src/pages/Admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Bike, 
  MapPin, 
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Settings,
  BarChart3,
  Calendar,
  Shield,
  Activity,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { ThemeToggle } from '../../components/UI/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalVehicles: number;
  availableVehicles: number;
  totalStations: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  activeRentals: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'rental_completed' | 'vehicle_maintenance' | 'payment_processed';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'success';
}

interface QuickAction {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
  color: string;
  description: string;
}

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    totalStations: 0,
    dailyRevenue: 0,
    monthlyRevenue: 0,
    activeRentals: 0
  });
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
      // Simulación de carga de datos - aquí harías llamadas a tu API admin
      setTimeout(() => {
        setStats({
          totalUsers: 1247,
          activeUsers: 892,
          totalVehicles: 450,
          availableVehicles: 312,
          totalStations: 28,
          dailyRevenue: 2856000,
          monthlyRevenue: 78450000,
          activeRentals: 127
        });

        setRecentActivity([
          {
            id: '1',
            type: 'user_registration',
            message: 'Nuevo usuario registrado: Maria García',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            severity: 'success'
          },
          {
            id: '2',
            type: 'vehicle_maintenance',
            message: 'Bicicleta B-142 requiere mantenimiento',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            severity: 'warning'
          },
          {
            id: '3',
            type: 'rental_completed',
            message: 'Alquiler completado: $12.500 - Usuario: Carlos López',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            severity: 'info'
          },
          {
            id: '4',
            type: 'payment_processed',
            message: 'Pago mensual procesado: $45.000',
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
            severity: 'success'
          }
        ]);

        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Simular actualización de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadAdminData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
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
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando panel de administración...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Shield className="h-8 w-8 text-blue-500 mr-3" />
                Panel de Administración
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Bienvenido, {user?.nombre} - Control total del sistema EcoMove
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                <span className="text-green-800 dark:text-green-200 text-sm font-medium">
                  Sistema Activo
                </span>
              </div>
              <ThemeToggle size="md" />
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isRefreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/admin/reportes'}
                className="flex items-center space-x-2"
              >
                <BarChart3 size={16} />
                <span>Reportes</span>
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
        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Usuarios Totales
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats.activeUsers} activos
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-full">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Vehículos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalVehicles}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
                  <Activity className="h-3 w-3 mr-1" />
                  {stats.availableVehicles} disponibles
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-full">
                <Bike className="h-6 w-6 text-white" />
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
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Ingresos Diarios
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.dailyRevenue)}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {stats.activeRentals} alquileres activos
                </p>
              </div>
              <div className="bg-emerald-500 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-white" />
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
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Estaciones
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalStations}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400 flex items-center mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  Todas operativas
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-full">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
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
                {action.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actividad Reciente */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Actividad Reciente
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert('Funcionalidad de logs completos próximamente')}
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

          {/* Panel de Control Rápido */}
          <div className="space-y-6">
            {/* Alertas del Sistema */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Alertas del Sistema
              </h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Mantenimiento Programado
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      15 vehículos requieren revisión
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Sistema Operativo
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Todos los servicios funcionando
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Resumen Mensual
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Ingresos del Mes
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(stats.monthlyRevenue)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Nuevos Usuarios
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    +156
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Tasa de Utilización
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    87%
                  </span>
                </div>
                
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => alert('Reporte mensual completo próximamente')}
                  >
                    Ver Reporte Completo
                  </Button>
                </div>
              </div>
            </div>

            {/* Acciones Administrativas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Acciones Rápidas
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => alert('Funcionalidad próximamente')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Crear Usuario
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => alert('Funcionalidad próximamente')}
                >
                  <Bike className="h-4 w-4 mr-2" />
                  Agregar Vehículo
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => alert('Funcionalidad próximamente')}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Nueva Estación
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => alert('Funcionalidad próximamente')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Backup Sistema
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};