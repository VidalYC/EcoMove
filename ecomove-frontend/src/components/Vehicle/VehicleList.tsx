// src/components/Vehicle/VehicleList.tsx
import React, { useState, useEffect } from 'react';
import { Bike, RefreshCw } from 'lucide-react';
import { VehicleCard } from './VehicleCard';
import { Transport } from '../../services/transportApi.service';
import { Station } from '../../services/stationApi.service';

// Props para el componente
interface VehicleListProps {
  onRent?: (vehicleId: string, stationId: string) => void;
  showOnlyAvailable?: boolean;
  stationFilter?: number;
  className?: string;
}

// Funciones auxiliares para acceder a propiedades de manera segura
const getStatus = (item: any): string => item.status || item.estado || '';
const getType = (item: any): string => item.type || item.tipo || '';
const getCurrentStationId = (item: any): number | undefined => item.currentStationId || item.estacion_actual_id;
const mapTransportToVehicle = (transport: any): any => ({
  id: transport.id.toString(),
  codigo: transport.code || transport.codigo || `T${transport.id}`, // fallback si no existe
  tipo: transport.type || transport.tipo,
  modelo: transport.model || transport.modelo,
  marca: transport.brand || transport.marca || 'N/A',
  estado: transport.status || transport.estado,
  estacion_actual_id: transport.currentStationId || transport.estacion_actual_id,
  tarifa_por_hora: transport.hourlyRate || transport.tarifa_por_hora,
  // Mapeo de specifications anidado
  numero_cambios: transport.specifications?.gearCount || transport.numero_cambios,
  tipo_frenos: transport.specifications?.brakeType || transport.tipo_frenos,
  nivel_bateria: transport.specifications?.batteryLevel || transport.nivel_bateria,
  velocidad_maxima: transport.specifications?.maxSpeed || transport.velocidad_maxima,
  created_at: transport.createdAt || transport.created_at,
  updated_at: transport.updatedAt || transport.updated_at
});

// Mapeo de objeto station a formato para VehicleCard
const mapStationForCard = (station: any): any => ({
  id: station.id,
  nombre: station.nombre,
  direccion: station.direccion
});

export const VehicleList: React.FC<VehicleListProps> = ({
  onRent,
  showOnlyAvailable = true,
  stationFilter,
  className = ''
}) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVehiclesAndStations();
  }, [stationFilter, showOnlyAvailable]);

  const loadVehiclesAndStations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Loading vehicles and stations...');
      
      const token = localStorage.getItem('ecomove_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };
      
      console.log('🌐 Fetching from: http://localhost:4000/api/v1/transports');
      console.log('🏢 Fetching from: http://localhost:4000/api/v1/stations');
      
      const [vehiclesResponse, stationsResponse] = await Promise.all([
        fetch('http://localhost:4000/api/v1/transports', { headers }).then(res => res.json()),
        fetch('http://localhost:4000/api/v1/stations?estado=active', { headers }).then(res => res.json())
      ]);

      console.log('🚗 RAW VEHICLES RESPONSE:', vehiclesResponse);
      console.log('🏢 RAW STATIONS RESPONSE:', stationsResponse);

      let vehicleArray: Transport[] = [];
      let stationArray: Station[] = [];

      // Para vehículos - el formato parece ser { success: true, data: { transports: [...] } }
      if (vehiclesResponse?.success && vehiclesResponse?.data) {
        if (Array.isArray(vehiclesResponse.data)) {
          vehicleArray = vehiclesResponse.data;
          console.log('✅ Vehicles: Direct array in data');
        } else if (vehiclesResponse.data.transports && Array.isArray(vehiclesResponse.data.transports)) {
          vehicleArray = vehiclesResponse.data.transports;
          console.log('✅ Vehicles: Found in data.transports');
        } else {
          console.log('❌ Vehicles: Unexpected data structure:', vehiclesResponse.data);
        }
      } else if (Array.isArray(vehiclesResponse)) {
        vehicleArray = vehiclesResponse;
        console.log('✅ Vehicles: Direct array format');
      } else {
        console.log('❌ Vehicles: Unknown format', vehiclesResponse);
      }

      // Para estaciones - el formato parece ser { success: true, data: [...] }
      if (stationsResponse?.success && stationsResponse?.data) {
        if (Array.isArray(stationsResponse.data)) {
          stationArray = stationsResponse.data;
          console.log('✅ Stations: Found in data array');
        } else {
          console.log('❌ Stations: Data is not array:', stationsResponse.data);
        }
      } else if (Array.isArray(stationsResponse)) {
        stationArray = stationsResponse;
        console.log('✅ Stations: Direct array format');
      } else {
        console.log('❌ Stations: Unknown format', stationsResponse);
      }

      console.log(`🔍 BEFORE FILTERING - Vehicles: ${vehicleArray.length}, Stations: ${stationArray.length}`);
      
      if (vehicleArray.length > 0) {
        console.log('🔍 Vehicle statuses:', vehicleArray.map(v => getStatus(v)));
        console.log('🔍 First vehicle:', vehicleArray[0]);
      }
      
      if (stationArray.length > 0) {
        console.log('🔍 Station statuses:', stationArray.map(s => getStatus(s)));
        console.log('🔍 First station:', stationArray[0]);
      }

      // Filtrar estaciones activas primero (adaptar a formato real de API)
      const originalStationCount = stationArray.length;
      // Si todas las estaciones tienen status vacío, asumirlas como activas
      if (stationArray.every(s => getStatus(s) === '')) {
        console.log('🏢 All stations have empty status, assuming active');
      } else {
        stationArray = stationArray.filter(s => {
          const status = getStatus(s);
          return status === 'active' || status === 'activo';
        });
      }
      console.log(`🏢 Stations after active filter: ${originalStationCount} → ${stationArray.length}`);

      // Filtrar solo disponibles si se requiere (adaptar a formato real de API)
      const originalVehicleCount = vehicleArray.length;
      if (showOnlyAvailable) {
        vehicleArray = vehicleArray.filter(v => {
          const status = getStatus(v);
          return status === 'available' || status === 'disponible';
        });
        console.log(`🚗 Vehicles after available filter: ${originalVehicleCount} → ${vehicleArray.length}`);
      }

      // Filtrar por estación si se especifica (adaptar a formato real de API)
      if (stationFilter) {
        const beforeStationFilter = vehicleArray.length;
        vehicleArray = vehicleArray.filter(v => {
          const stationId = getCurrentStationId(v);
          return stationId === stationFilter;
        });
        console.log(`🏢 Vehicles after station filter (${stationFilter}): ${beforeStationFilter} → ${vehicleArray.length}`);
      }

      setVehicles(vehicleArray);
      setStations(stationArray);

      console.log(`📊 Final vehicles count: ${vehicleArray.length}`);
      console.log(`🏢 Final stations count: ${stationArray.length}`);

      if (vehicleArray.length > 0) {
        console.log('🔍 First vehicle sample:', vehicleArray[0]);
      }
      if (stationArray.length > 0) {
        console.log('🔍 First station sample:', stationArray[0]);
      }

    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      setError(`Error al cargar datos: ${error?.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para encontrar la estación de un vehículo
  const getVehicleStation = (vehicleStationId?: number): any | null => {
    if (!vehicleStationId) return null;
    return stations.find((station: any) => station.id === vehicleStationId) || null;
  };

  // Manejar el alquiler de vehículo
  const handleRentVehicle = (vehicleId: string, stationId: string) => {
    if (onRent) {
      onRent(vehicleId, stationId);
    } else {
      console.log('Rent vehicle:', vehicleId, 'from station:', stationId);
      alert(`Funcionalidad de alquiler no implementada. Vehículo: ${vehicleId}, Estación: ${stationId}`);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Cargando vehículos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 dark:text-red-400 font-medium mb-4">
            {error}
          </p>
          <button
            onClick={loadVehiclesAndStations}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Vehículos Disponibles
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {vehicles.length} vehículo{vehicles.length !== 1 ? 's' : ''} {showOnlyAvailable ? 'disponible' : 'encontrado'}{vehicles.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <button
          onClick={loadVehiclesAndStations}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Estadísticas rápidas */}
      {vehicles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {vehicles.filter(v => {
                const type = getType(v);
                return type === 'bicycle';
              }).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Bicicletas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {vehicles.filter(v => {
                const type = getType(v);
                return type === 'electric_scooter' || type === 'electric-scooter';
              }).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Scooters Eléctricos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {vehicles.filter(v => {
                const type = getType(v);
                return type === 'scooter';
              }).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Scooters</div>
          </div>
        </div>
      )}

      {/* Lista de Vehículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.length > 0 ? (
          vehicles.map((vehicle: any) => {
            const station = getVehicleStation(vehicle.currentStationId || vehicle.estacion_actual_id);
            
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={mapTransportToVehicle(vehicle)}
                station={station ? mapStationForCard(station) : undefined}
                onRent={handleRentVehicle}
                isRenting={false}
              />
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <Bike className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay vehículos disponibles
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              {showOnlyAvailable 
                ? "En este momento no hay vehículos disponibles para alquiler. Intenta de nuevo más tarde."
                : "No se encontraron vehículos con los filtros aplicados."
              }
            </p>
            <button
              onClick={loadVehiclesAndStations}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Actualizar Lista
            </button>
          </div>
        )}
      </div>

      {/* Debug Info (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Debug Info:</h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>Vehicles loaded: {vehicles.length}</p>
            <p>Stations loaded: {stations.length}</p>
            <p>Show only available: {showOnlyAvailable.toString()}</p>
            <p>Station filter: {stationFilter || 'none'}</p>
            <p>Check console for detailed logs</p>
          </div>
        </div>
      )}
    </div>
  );
};