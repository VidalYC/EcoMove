// src/pages/Admin/AdminDashboard.tsx - VERSIÓN ULTRA SIMPLIFICADA
import { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Users, MapPin, Bike, Activity, DollarSign, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const { stations, loans, getActiveLoans, stationsLoading, loansLoading } = useData();
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  // Cargar vehículos de forma simple
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setVehiclesLoading(true);
        // Simulamos datos de vehículos o los cargamos desde cada estación
        const mockVehicles = [
          { id: '1', model: 'Bicicleta Urban', status: 'available', stationId: '1' },
          { id: '2', model: 'Scooter Eléctrico', status: 'in-use', stationId: '1' },
          { id: '3', model: 'Bicicleta Mountain', status: 'available', stationId: '2' },
          { id: '4', model: 'Scooter Pro', status: 'maintenance', stationId: '2' },
        ];
        setAllVehicles(mockVehicles);
      } catch (error) {
        console.error('Error loading vehicles:', error);
        setAllVehicles([]);
      } finally {
        setVehiclesLoading(false);
      }
    };

    if (!stationsLoading && !loansLoading) {
      loadVehicles();
    }
  }, [stationsLoading, loansLoading]);

  // Mostrar loading mientras se cargan los datos
  if (stationsLoading || loansLoading || vehiclesLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Calcular estadísticas con datos seguros
  const totalStations = Array.isArray(stations) ? stations.length : 0;
  const activeStations = Array.isArray(stations) ? stations.filter(s => s.isActive).length : 0;
  const totalVehicles = Array.isArray(allVehicles) ? allVehicles.length : 0;
  const availableVehicles = Array.isArray(allVehicles) ? allVehicles.filter(v => v.status === 'available').length : 0;
  
  const activeLoansArray = getActiveLoans ? getActiveLoans() : [];
  const activeLoansCount = Array.isArray(activeLoansArray) ? activeLoansArray.length : 0;
  
  const allLoans = Array.isArray(loans) ? loans : [];
  const completedLoans = allLoans.filter(l => l.status === 'completed');
  const totalRevenue = completedLoans.reduce((sum, loan) => sum + (loan.cost || 0), 0);

  const stats = [
    {
      name: 'Estaciones Activas',
      value: totalStations > 0 ? `${activeStations}/${totalStations}` : '0/0',
      icon: MapPin,
      color: 'bg-emerald-50 text-emerald-600',
      iconColor: 'text-emerald-500'
    },
    {
      name: 'Vehículos Disponibles',
      value: totalVehicles > 0 ? `${availableVehicles}/${totalVehicles}` : '0/0',
      icon: Bike,
      color: 'bg-blue-50 text-blue-600',
      iconColor: 'text-blue-500'
    },
    {
      name: 'Préstamos Activos',
      value: activeLoansCount.toString(),
      icon: Activity,
      color: 'bg-orange-50 text-orange-600',
      iconColor: 'text-orange-500'
    },
    {
      name: 'Ingresos Totales',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-purple-50 text-purple-600',
      iconColor: 'text-purple-500'
    }
  ];

  // Obtener préstamos recientes
  const recentLoans = allLoans
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5);

  const getVehicleModel = (vehicleId: string) => {
    if (!Array.isArray(allVehicles)) return 'Desconocido';
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    return vehicle?.model || `Vehículo ${vehicleId}`;
  };

  const getStationName = (stationId: string) => {
    if (!Array.isArray(stations)) return 'Desconocida';
    const station = stations.find(s => s.id === stationId);
    return station?.name || `Estación ${stationId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <TrendingUp className="h-8 w-8 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600">Resumen general del sistema EcoMove</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
          {recentLoans.length > 0 ? (
            <div className="space-y-3">
              {recentLoans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{getVehicleModel(loan.vehicleId)}</p>
                    <p className="text-sm text-gray-600">{getStationName(loan.originStationId)}</p>
                    <p className="text-xs text-gray-400">
                      {loan.startTime ? new Date(loan.startTime).toLocaleDateString() : 'Fecha no disponible'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${(loan.cost || 0).toFixed(2)}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      loan.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {loan.status === 'completed' ? 'Completado' : 'Activo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay actividad reciente</p>
            </div>
          )}
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Estado del Sistema</h2>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {totalStations > 0 ? Math.round((activeStations / totalStations) * 100) : 0}%
              </div>
              <p className="text-gray-600">Estaciones Operativas</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${totalStations > 0 ? (activeStations / totalStations) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {totalVehicles > 0 ? Math.round((availableVehicles / totalVehicles) * 100) : 0}%
              </div>
              <p className="text-gray-600">Vehículos Disponibles</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {completedLoans.length}
              </div>
              <p className="text-gray-600">Préstamos Completados</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Info */}
      {(totalStations === 0 || totalVehicles === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800">Sistema en Configuración</h3>
              <p className="text-yellow-700 text-sm">
                {totalStations === 0 && "No hay estaciones registradas. "}
                {totalVehicles === 0 && "No hay vehículos registrados. "}
                Contacta al administrador para configurar el sistema.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}