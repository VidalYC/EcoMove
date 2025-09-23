// src/components/Vehicle/VehicleCard.tsx
import React from 'react';
import { 
  Bike, 
  MapPin, 
  Clock, 
  DollarSign,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '../UI/Button';
import { motion } from 'framer-motion';

// ============ INTERFACES ============

export interface Vehicle {
  id: string;
  codigo: string;
  tipo: 'bicycle' | 'electric_scooter' | 'scooter';
  modelo: string;
  marca?: string;
  estado: 'available' | 'in_use' | 'maintenance' | 'damaged';
  estacion_actual_id?: number;
  tarifa_por_hora: number;
  // Campos específicos
  numero_cambios?: number; // Para bicicletas
  tipo_frenos?: string; // Para bicicletas
  nivel_bateria?: number; // Para scooters eléctricos
  velocidad_maxima?: number; // Para scooters eléctricos
  created_at: string;
  updated_at: string;
}

export interface Station {
  id: number;
  nombre: string;
  direccion: string;
  distancia_km?: number;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  station?: Station;
  onRent: (vehicleId: string, stationId: string) => void;
  isRenting?: boolean;
  className?: string;
}

// ============ VEHICLE CARD COMPONENT ============

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  station,
  onRent,
  isRenting = false,
  className = ''
}) => {
  
  // Obtener icono según tipo de vehículo
  const getVehicleIcon = () => {
    switch (vehicle.tipo) {
      case 'bicycle':
        return Bike;
      case 'electric_scooter':
        return Zap;
      case 'scooter':
        return Bike; // Usar el mismo icono por ahora
      default:
        return Bike;
    }
  };

  // Obtener color según tipo de vehículo
  const getVehicleColor = () => {
    switch (vehicle.tipo) {
      case 'bicycle':
        return 'bg-blue-500';
      case 'electric_scooter':
        return 'bg-green-500';
      case 'scooter':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Formatear tipo de vehículo para mostrar
  const getVehicleTypeName = () => {
    switch (vehicle.tipo) {
      case 'bicycle':
        return 'Bicicleta';
      case 'electric_scooter':
        return 'Scooter Eléctrico';
      case 'scooter':
        return 'Scooter';
      default:
        return 'Vehículo';
    }
  };

  // Obtener estado y color del estado
  const getStatusInfo = () => {
    switch (vehicle.estado) {
      case 'available':
        return {
          text: 'Disponible',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900',
          icon: CheckCircle
        };
      case 'in_use':
        return {
          text: 'En uso',
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-100 dark:bg-orange-900',
          icon: Clock
        };
      case 'maintenance':
        return {
          text: 'Mantenimiento',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900',
          icon: AlertCircle
        };
      case 'damaged':
        return {
          text: 'Dañado',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900',
          icon: AlertCircle
        };
      default:
        return {
          text: 'Desconocido',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-900',
          icon: AlertCircle
        };
    }
  };

  const VehicleIcon = getVehicleIcon();
  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isAvailable = vehicle.estado === 'available';

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleRent = () => {
    if (isAvailable && station) {
      onRent(vehicle.id, station.id.toString());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-md ${className}`}
    >
      {/* Header con tipo de vehículo */}
      <div className={`${getVehicleColor()} px-4 py-3`}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <VehicleIcon className="h-5 w-5" />
            <span className="font-medium">{getVehicleTypeName()}</span>
          </div>
          <span className="text-sm font-mono bg-white/20 px-2 py-1 rounded">
            {vehicle.codigo}
          </span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-4">
        {/* Modelo y marca */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {vehicle.modelo}
          </h3>
          {vehicle.marca && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {vehicle.marca}
            </p>
          )}
        </div>

        {/* Estado */}
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${statusInfo.bgColor}`}>
            <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
            <span className={`text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
          
          {/* Tarifa */}
          <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-4 w-4" />
            <span className="font-semibold">
              {formatCurrency(vehicle.tarifa_por_hora)}/h
            </span>
          </div>
        </div>

        {/* Características específicas */}
        <div className="space-y-2 mb-4">
          {vehicle.tipo === 'bicycle' && (
            <div className="flex justify-between text-sm">
              {vehicle.numero_cambios && (
                <span className="text-gray-600 dark:text-gray-400">
                  {vehicle.numero_cambios} cambios
                </span>
              )}
              {vehicle.tipo_frenos && (
                <span className="text-gray-600 dark:text-gray-400">
                  Frenos: {vehicle.tipo_frenos}
                </span>
              )}
            </div>
          )}
          
          {vehicle.tipo === 'electric_scooter' && (
            <div className="space-y-1">
              {vehicle.nivel_bateria !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Batería:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          vehicle.nivel_bateria > 50 ? 'bg-green-500' :
                          vehicle.nivel_bateria > 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${vehicle.nivel_bateria}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{vehicle.nivel_bateria}%</span>
                  </div>
                </div>
              )}
              {vehicle.velocidad_maxima && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Vel. máx:</span>
                  <span className="font-medium">{vehicle.velocidad_maxima} km/h</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ubicación */}
        {station && (
          <div className="flex items-start space-x-2 mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {station.nombre}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {station.direccion}
              </p>
              {station.distancia_km !== undefined && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {station.distancia_km.toFixed(1)} km de distancia
                </p>
              )}
            </div>
          </div>
        )}

        {/* Botón de alquiler */}
        <Button
          onClick={handleRent}
          disabled={!isAvailable || isRenting || !station}
          className={`w-full ${
            isAvailable 
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isRenting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Alquilando...</span>
            </div>
          ) : isAvailable ? (
            'Alquilar Ahora'
          ) : (
            'No Disponible'
          )}
        </Button>
      </div>
    </motion.div>
  );
};