// src/components/Vehicle/VehicleList.tsx
import React, { useState, useEffect } from 'react';
import { Bike, RefreshCw, Filter } from 'lucide-react';
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
  codigo: transport.code || transport.codigo || `T${transport.id}`,
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

const mapStationForCard = (station: any): any => ({
  id: station.id,
  nombre: station.name || station.nombre,
  direccion: station.address || station.direccion
});

export const VehicleList: React.FC<VehicleListProps> = ({
  onRent,
  showOnlyAvailable = true,
  stationFilter: externalStationFilter,
  className = ''
}) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [allVehicles, setAllVehicles] = useState<any[]>([]); // Todos los vehículos sin filtrar
  const [stations, setStations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);

  useEffect(() => {
    loadVehiclesAndStations();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [allVehicles, selectedStation, selectedType, onlyAvailable, externalStationFilter]);

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
      
      const [vehiclesResponse, stationsResponse] = await Promise.all([
        fetch('http://localhost:4000/api/v1/transports', { headers }).then(res => res.json()),
        fetch('http://localhost:4000/api/v1/stations?estado=active', { headers }).then(res => res.json())
      ]);

      console.log('🚗 RAW VEHICLES RESPONSE:', vehiclesResponse);
      console.log('🏢 RAW STATIONS RESPONSE:', stationsResponse);

      let vehicleArray: Transport[] = [];
      let stationArray: Station[] = [];

      // Procesar vehículos
      if (vehiclesResponse?.success && vehiclesResponse?.data) {
        if (Array.isArray(vehiclesResponse.data)) {
          vehicleArray = vehiclesResponse.data;
        } else if (vehiclesResponse.data.transports && Array.isArray(vehiclesResponse.data.transports)) {
          vehicleArray = vehiclesResponse.data.transports;
        }
      } else if (Array.isArray(vehiclesResponse)) {
        vehicleArray = vehiclesResponse;
      }

      // Procesar estaciones
      if (stationsResponse?.success && stationsResponse?.data) {
        if (Array.isArray(stationsResponse.data)) {
          stationArray = stationsResponse.data;
        }
      } else if (Array.isArray(stationsResponse)) {
        stationArray = stationsResponse;
      }

      console.log(`🔍 Loaded - Vehicles: ${vehicleArray.length}, Stations: ${stationArray.length}`);

      // Guardar todos los vehículos sin filtrar
      setAllVehicles(vehicleArray);
      setStations(stationArray);

    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      setError(`Error al cargar datos: ${error?.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredVehicles = [...allVehicles];

    console.log('🔍 Applying filters:', {
      selectedStation,
      selectedType,
      onlyAvailable,
      externalStationFilter,
      totalVehicles: filteredVehicles.length
    });

    // Filtro por disponibilidad
    if (onlyAvailable) {
      filteredVehicles = filteredVehicles.filter(v => {
        const status = getStatus(v);
        return status === 'available' || status === 'disponible';
      });
      console.log(`After availability filter: ${filteredVehicles.length}`);
    }

    // Filtro por estación (externo tiene prioridad)
    const stationFilterValue = externalStationFilter?.toString() || selectedStation;
    if (stationFilterValue && stationFilterValue !== 'all') {
      filteredVehicles = filteredVehicles.filter(v => {
        const stationId = getCurrentStationId(v);
        return stationId?.toString() === stationFilterValue;
      });
      console.log(`After station filter (${stationFilterValue}): ${filteredVehicles.length}`);
    }

    // Filtro por tipo
    if (selectedType && selectedType !== 'all') {
      filteredVehicles = filteredVehicles.filter(v => {
        const type = getType(v);
        return type === selectedType;
      });
      console.log(`After type filter (${selectedType}): ${filteredVehicles.length}`);
    }

    setVehicles(filteredVehicles);
  };

  // Función para encontrar la estación de un vehículo
  const getVehicleStation = (vehicleStationId?: number): any | null => {
    if (!vehicleStationId) return null;
    return stations.find((station: any) => station.id === vehicleStationId) || null;
  };

  // Obtener tipos únicos de vehículos
  const getUniqueTypes = () => {
    const types = allVehicles.map(v => getType(v)).filter(Boolean);
    return [...new Set(types)];
  };

  // Formatear nombre del tipo
  const formatTypeName = (type: string) => {
    const typeNames: Record<string, string> = {
      'bicycle': 'Bicicletas',
      'electric-scooter': 'Scooters Eléctricos',
      'electric_scooter': 'Scooters Eléctricos',
      'scooter': 'Scooters'
    };
    return typeNames[type] || type;
  };

  // Manejar el alquiler de vehículo
  const handleRentVehicle = async (vehicleId: string, stationId: string) => {
    if (onRent) {
      await onRent(vehicleId, stationId);
      // Recargar datos después del alquiler
      loadVehiclesAndStations();
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
            {vehicles.length} vehículo{vehicles.length !== 1 ? 's' : ''} encontrado{vehicles.length !== 1 ? 's' : ''}
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

      {/* Filtros funcionales - Solo mostrar si NO hay filtro externo */}
      {!externalStationFilter && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtros</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por estación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estación
              </label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todas las estaciones</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id.toString()}>
                    {station.name || station.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de vehículo
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Todos los tipos</option>
                {getUniqueTypes().map((type) => (
                  <option key={type} value={type}>
                    {formatTypeName(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por disponibilidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Disponibilidad
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="onlyAvailable"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="onlyAvailable" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Solo disponibles
                </label>
              </div>
            </div>
          </div>

          {/* Resumen de filtros */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Mostrando {vehicles.length} de {allVehicles.length} vehículos
          </div>
        </div>
      )}

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
              {onlyAvailable 
                ? "No hay vehículos disponibles con los filtros aplicados."
                : "No se encontraron vehículos con los filtros aplicados."
              }
            </p>
            <div className="space-x-4">
              <button
                onClick={() => {
                  setSelectedStation('all');
                  setSelectedType('all');
                  setOnlyAvailable(false);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Limpiar Filtros
              </button>
              <button
                onClick={loadVehiclesAndStations}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Actualizar Lista
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};