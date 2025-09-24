// src/components/Vehicle/VehicleCard.tsx
import React, { useState } from 'react';
import { 
  Bike, 
  MapPin, 
  Battery, 
  Zap, 
  Clock,
  DollarSign,
  PlayCircle,
  Loader2 
} from 'lucide-react';
import { Button } from '../UI/Button';

// Interfaces
interface VehicleCardProps {
  vehicle: {
    id: string;
    codigo?: string;
    tipo: string;
    modelo: string;
    marca?: string;
    estado: string;
    estacion_actual_id?: number;
    tarifa_por_hora: number;
    numero_cambios?: number;
    tipo_frenos?: string;
    nivel_bateria?: number;
    velocidad_maxima?: number;
  };
  station?: {
    id: number;
    nombre: string;
    direccion?: string;
  };
  onRent: (vehicleId: string, stationId: string) => void;
  isRenting?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  station,
  onRent,
  isRenting = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRent = async () => {
    if (!station) {
      alert('No se puede alquilar: estación no disponible');
      return;
    }

    setIsProcessing(true);
    try {
      await onRent(vehicle.id, station.id.toString());
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para obtener el icono según el tipo de vehículo
  const getVehicleIcon = (tipo: string) => {
    if (tipo?.toLowerCase().includes('bicicleta') || tipo === 'bicycle') {
      return Bike;
    }
    if (tipo?.toLowerCase().includes('scooter') || tipo === 'electric_scooter') {
      return Zap;
    }
    return Bike;
  };

  // Función para obtener el color según el tipo
  const getVehicleColor = (tipo: string) => {
    if (tipo?.toLowerCase().includes('bicicleta') || tipo === 'bicycle') {
      return 'bg-blue-500';
    }
    if (tipo?.toLowerCase().includes('scooter') || tipo === 'electric_scooter') {
      return 'bg-green-500';
    }
    return 'bg-gray-500';
  };

  // Función para formatear el tipo de vehículo
  const formatVehicleType = (tipo: string) => {
    const types: Record<string, string> = {
      'bicicleta': 'Bicicleta',
      'bicycle': 'Bicicleta',
      'scooter_electrico': 'Scooter Eléctrico',
      'electric_scooter': 'Scooter Eléctrico',
      'scooter': 'Scooter'
    };
    return types[tipo] || tipo;
  };

  const VehicleIcon = getVehicleIcon(vehicle.tipo);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header con tipo de vehículo */}
      <div className={`${getVehicleColor(vehicle.tipo)} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <VehicleIcon className="h-5 w-5" />
            <span className="font-medium">{formatVehicleType(vehicle.tipo)}</span>
          </div>
          <span className="text-sm opacity-90">
            {vehicle.codigo || `#${vehicle.id}`}
          </span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-4">
        {/* Información del vehículo */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {vehicle.modelo}
          </h3>
          {vehicle.marca && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {vehicle.marca}
            </p>
          )}
        </div>

        {/* Especificaciones */}
        <div className="space-y-3 mb-4">
          {/* Estación */}
          {station && (
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {station.nombre}
              </span>
            </div>
          )}

          {/* Tarifa */}
          <div className="flex items-center space-x-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">
              ${vehicle.tarifa_por_hora}/hora
            </span>
          </div>

          {/* Características específicas */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {vehicle.nivel_bateria !== undefined && (
              <div className="flex items-center space-x-1">
                <Battery className="h-3 w-3 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {vehicle.nivel_bateria}%
                </span>
              </div>
            )}

            {vehicle.velocidad_maxima && (
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {vehicle.velocidad_maxima} km/h
                </span>
              </div>
            )}

            {vehicle.numero_cambios && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-purple-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {vehicle.numero_cambios} velocidades
                </span>
              </div>
            )}

            {vehicle.tipo_frenos && (
              <div className="text-gray-600 dark:text-gray-400">
                Frenos {vehicle.tipo_frenos}
              </div>
            )}
          </div>
        </div>

        {/* Estado del vehículo */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            vehicle.estado === 'disponible' || vehicle.estado === 'available'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : vehicle.estado === 'ocupado' || vehicle.estado === 'occupied' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {vehicle.estado === 'disponible' || vehicle.estado === 'available' ? 'Disponible' :
             vehicle.estado === 'ocupado' || vehicle.estado === 'occupied' ? 'Ocupado' :
             vehicle.estado === 'mantenimiento' || vehicle.estado === 'maintenance' ? 'Mantenimiento' :
             vehicle.estado}
          </span>
        </div>

        {/* Botón de alquiler */}
        <Button
          onClick={handleRent}
          disabled={
            isProcessing || 
            isRenting || 
            !station ||
            (vehicle.estado !== 'disponible' && vehicle.estado !== 'available')
          }
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : isRenting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Alquilando...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4 mr-2" />
              Alquilar
            </>
          )}
        </Button>

        {/* Información adicional si no está disponible */}
        {(!station || (vehicle.estado !== 'disponible' && vehicle.estado !== 'available')) && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            {!station ? 'Estación no disponible' : 
             vehicle.estado === 'ocupado' || vehicle.estado === 'occupied' ? 'Actualmente en uso' :
             'No disponible para alquiler'}
          </p>
        )}
      </div>
    </div>
  );
};