import React from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { History, Clock, MapPin, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function HistoryPage() {
  const { user } = useAuth();
  const { getUserLoans, stations, vehicles } = useData();

  const userLoans = user ? getUserLoans(user.id) : [];

  const getStationName = (stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    return station?.name || 'Estación no encontrada';
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.model} (${vehicle.type})` : 'Vehículo no encontrado';
  };

  const getVehicleType = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    switch (vehicle?.type) {
      case 'bicycle':
        return 'Bicicleta';
      case 'scooter':
        return 'Patineta';
      case 'electric-scooter':
        return 'Scooter Eléctrico';
      default:
        return 'Vehículo';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <History className="h-8 w-8 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historial de Préstamos</h1>
          <p className="text-gray-600">Revisa todos tus viajes anteriores</p>
        </div>
      </div>

      {userLoans.length > 0 ? (
        <div className="space-y-4">
          {userLoans.map((loan, index) => (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    loan.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    <Clock className={`h-5 w-5 ${
                      loan.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getVehicleType(loan.vehicleId)}
                    </h3>
                    <p className="text-sm text-gray-600">{getVehicleInfo(loan.vehicleId)}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  loan.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {loan.status === 'completed' ? 'Completado' : 'En curso'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Inicio</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(loan.startTime), 'dd MMM yyyy, HH:mm', { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Origen</p>
                    <p className="text-xs text-gray-600">{getStationName(loan.originStationId)}</p>
                  </div>
                </div>

                {loan.destinationStationId && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Destino</p>
                      <p className="text-xs text-gray-600">{getStationName(loan.destinationStationId)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Costo</p>
                    <p className="text-xs text-gray-600">
                      ${loan.cost.toFixed(2)}
                      {loan.duration && ` (${loan.duration} min)`}
                    </p>
                  </div>
                </div>
              </div>

              {loan.endTime && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                  Finalizado el {format(new Date(loan.endTime), 'dd MMM yyyy, HH:mm', { locale: es })}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes préstamos registrados
          </h3>
          <p className="text-gray-600 mb-6">
            Comienza a usar EcoMove para ver tu historial de viajes aquí.
          </p>
          <button 
            onClick={() => window.location.href = '/stations'}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Explorar Estaciones
          </button>
        </div>
      )}
    </div>
  );
}