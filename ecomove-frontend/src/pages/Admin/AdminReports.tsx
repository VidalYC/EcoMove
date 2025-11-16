// src/pages/Admin/AdminReports.tsx
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  ChevronLeft,
  RefreshCw,
  Calendar,
  Download,
  TrendingUp,
  Users,
  Bike,
  MapPin,
  DollarSign,
  Clock
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { adminApiService } from '../../services/adminApi.service';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const AdminReports: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotifications();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodReport, setPeriodReport] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const systemStats = await adminApiService.getSystemStats();
      setStats(systemStats);
    } catch (error: any) {
      showError('Error', error.message || 'No se pudieron cargar las estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
      showSuccess('Actualizado', 'Estadísticas actualizadas');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      showError('Error', 'Debe seleccionar un rango de fechas');
      return;
    }

    try {
      const report = await adminApiService.getPeriodReport(startDate, endDate);
      setPeriodReport(report);
      showSuccess('Reporte generado', 'El reporte se generó correctamente');
    } catch (error: any) {
      showError('Error', error.message || 'No se pudo generar el reporte');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Reportes y Análisis
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Estadísticas del sistema
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
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
                  {stats?.users.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats?.users.activeUsers} activos
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
                  Total Vehículos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.transports.totalVehicles}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  {stats?.transports.availableVehicles} disponibles
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
                  Total Estaciones
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.stations.totalStations}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  {stats?.stations.activeStations} activas
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
                  Ingresos Totales
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats?.loans.totalRevenue || 0)}
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats?.loans.totalLoans} préstamos
                </p>
              </div>
              <div className="bg-emerald-100 dark:bg-emerald-900/20 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Period Report Generator */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Generar Reporte por Período
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleGenerateReport} className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
          </div>

          {periodReport && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Reporte del {formatDate(startDate)} al {formatDate(endDate)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Préstamos</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {periodReport.total_prestamos || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(periodReport.ingresos_totales || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Duración Promedio</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(periodReport.duracion_promedio || 0)} min
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Loan Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Estadísticas de Préstamos
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Préstamos Activos</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {stats?.loans.activeLoans}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completados</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {stats?.loans.completedLoans}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Duración Promedio
                </span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {Math.round(stats?.loans.averageDuration || 0)} min
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Ingresos Totales
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(stats?.loans.totalRevenue || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transport Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Bike className="h-5 w-5 mr-2" />
              Estadísticas de Vehículos
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Vehículos</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats?.transports.totalVehicles}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Disponibles</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {stats?.transports.availableVehicles}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">En Uso</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {stats?.transports.inUseVehicles}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mantenimiento</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {stats?.transports.maintenanceVehicles}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Tasa de Utilización
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.round(stats?.transports.utilizationRate || 0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
