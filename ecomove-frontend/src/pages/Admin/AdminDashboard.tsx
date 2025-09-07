import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Users, MapPin, Bike, Activity, DollarSign, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const { stations, vehicles, loans, getActiveLoans } = useData();

  const totalStations = stations.length;
  const activeStations = stations.filter(s => s.isActive).length;
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'available').length;
  const activeLoans = getActiveLoans().length;
  const completedLoans = loans.filter(l => l.status === 'completed');
  const totalRevenue = completedLoans.reduce((sum, loan) => sum + loan.cost, 0);

  const stats = [
    {
      name: 'Estaciones Activas',
      value: `${activeStations}/${totalStations}`,
      icon: MapPin,
      color: 'bg-emerald-50 text-emerald-600',
      iconColor: 'text-emerald-500'
    },
    {
      name: 'Vehículos Disponibles',
      value: `${availableVehicles}/${totalVehicles}`,
      icon: Bike,
      color: 'bg-blue-50 text-blue-600',
      iconColor: 'text-blue-500'
    },
    {
      name: 'Préstamos Activos',
      value: activeLoans.toString(),
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

  const recentLoans = loans
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5);

  const getVehicleModel = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.model || 'Desconocido';
  };

  const getStationName = (stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    return station?.name || 'Desconocida';
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
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Loans */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Préstamos Activos</h2>
          {activeLoans > 0 ? (
            <div className="space-y-3">
              {loans
                .filter(l => l.status === 'active')
                .slice(0, 3)
                .map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{getVehicleModel(loan.vehicleId)}</p>
                      <p className="text-sm text-gray-600">Desde: {getStationName(loan.originStationId)}</p>
                    </div>
                    <span className="text-sm font-medium text-yellow-800 bg-yellow-200 px-2 py-1 rounded-full">
                      En curso
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay préstamos activos</p>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
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
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${loan.cost.toFixed(2)}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      loan.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {loan.status === 'completed' ? 'Completado' : 'active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay actividad reciente</p>
          )}
        </motion.div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Estado del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {Math.round((activeStations / totalStations) * 100)}%
            </div>
            <p className="text-gray-600">Estaciones Operativas</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {Math.round((availableVehicles / totalVehicles) * 100)}%
            </div>
            <p className="text-gray-600">Vehículos Disponibles</p>
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
  );
}