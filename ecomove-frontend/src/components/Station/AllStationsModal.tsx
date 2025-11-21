// src/components/Station/AllStationsModal.tsx - SIN ICONOS Y SIN KM
import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface Station {
  id: number;
  nombre: string;
  direccion: string;
  transportes_disponibles?: number;
  distancia_km?: number;
  latitud?: number;
  longitud?: number;
  capacidad?: number;
  estado?: string;
}

interface AllStationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStation?: (station: Station) => void;
}

export const AllStationsModal: React.FC<AllStationsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToStation
}) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'unavailable'>('all');

  useEffect(() => {
    if (isOpen) {
      loadStations();
    }
  }, [isOpen]);

  const loadStations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 [AllStationsModal] Cargando estaciones y vehículos...');

      const token = localStorage.getItem('ecomove_token');
      
      const stationsResponse = await fetch('http://localhost:4000/api/v1/stations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (!stationsResponse.ok) {
        throw new Error(`Error al cargar estaciones: ${stationsResponse.status}`);
      }

      const stationsData = await stationsResponse.json();

      const transportsResponse = await fetch('http://localhost:4000/api/v1/transports', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (!transportsResponse.ok) {
        throw new Error(`Error al cargar vehículos: ${transportsResponse.status}`);
      }

      const transportsData = await transportsResponse.json();

      if (!stationsData.success || !stationsData.data) {
        throw new Error('No se recibieron datos de estaciones');
      }

      if (!transportsData.success) {
        throw new Error('No se recibieron datos de vehículos');
      }

      console.log('🗺️ [AllStationsModal] Estaciones cargadas:', stationsData.data.length);

      let vehicleArray: any[] = [];
      if (Array.isArray(transportsData.data)) {
        vehicleArray = transportsData.data;
      } else if (transportsData.data?.transports && Array.isArray(transportsData.data.transports)) {
        vehicleArray = transportsData.data.transports;
      }

      console.log('🚗 [AllStationsModal] Total de vehículos:', vehicleArray.length);

      const adaptedStations = stationsData.data.map((station: any) => {
        const availableVehicles = vehicleArray.filter((vehicle: any) => {
          const stationId = vehicle.currentStationId || vehicle.estacion_actual_id;
          const status = vehicle.status || vehicle.estado;
          const isAvailable = status === 'available' || status === 'disponible';
          
          return stationId === station.id && isAvailable;
        });

        const transportes_disponibles = availableVehicles.length;

        return {
          id: station.id,
          nombre: station.name,
          direccion: station.address,
          latitud: station.coordinate?.latitude || station.latitud,
          longitud: station.coordinate?.longitude || station.longitud,
          capacidad: station.maxCapacity || station.capacity,
          estado: station.isActive ? 'activa' : 'inactiva',
          transportes_disponibles
        };
      });

      console.log('✅ [AllStationsModal] Estaciones procesadas:', adaptedStations.length);

      setStations(adaptedStations);

    } catch (err: any) {
      console.error('❌ [AllStationsModal] Error:', err);
      setError(err.message || 'Error al cargar las estaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStations();
  };

  const handleNavigate = (station: Station) => {
    if (onNavigateToStation && station.latitud && station.longitud) {
      console.log('🗺️ Abriendo mapa interno para:', station.nombre);
      onNavigateToStation(station);
      onClose();
    }
  };

  const handleRentAtStation = (stationId: number) => {
    onClose();
    window.location.href = `/transportes?station=${stationId}`;
  };

  const filteredStations = stations.filter(station => {
    const matchesSearch = station.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         station.direccion.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ? true :
                         filterStatus === 'available' ? (station.transportes_disponibles || 0) > 0 :
                         (station.transportes_disponibles || 0) === 0;

    return matchesSearch && matchesFilter;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Todas las Estaciones
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredStations.length} estaciones disponibles
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <span>Actualizar</span>
              </Button>
              <button
                onClick={onClose}
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar estación por nombre o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filtros rápidos */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Todas ({stations.length})
              </button>
              <button
                onClick={() => setFilterStatus('available')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'available'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Con vehículos ({stations.filter(s => (s.transportes_disponibles || 0) > 0).length})
              </button>
              <button
                onClick={() => setFilterStatus('unavailable')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'unavailable'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Sin vehículos ({stations.filter(s => (s.transportes_disponibles || 0) === 0).length})
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Cargando estaciones...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  Intentar nuevamente
                </Button>
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No se encontraron estaciones
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStations.map((station, index) => (
                  <motion.div
                    key={station.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-5 hover:shadow-lg transition-shadow"
                  >
                    {/* Header de la tarjeta */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {station.nombre}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {station.direccion}
                        </p>
                      </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="mb-4">
                      <div className="text-sm">
                        <span className={`font-medium ${
                          (station.transportes_disponibles || 0) > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-500'
                        }`}>
                          {station.transportes_disponibles || 0} vehículos disponibles
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex space-x-2">
                      {(station.transportes_disponibles || 0) > 0 ? (
                        <Button
                          onClick={() => handleRentAtStation(station.id)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
                          size="sm"
                        >
                          Alquilar aquí
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
                          size="sm"
                        >
                          Sin vehículos
                        </Button>
                      )}
                      
                      {station.latitud && station.longitud && onNavigateToStation && (
                        <Button
                          onClick={() => handleNavigate(station)}
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                          title="Calcular ruta a esta estación"
                        >
                          Cómo llegar
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {filteredStations.length} de {stations.length} estaciones
                {stations.length > 0 && (
                  <span className="ml-2">
                    • {stations.filter(s => (s.transportes_disponibles || 0) > 0).length} con vehículos
                  </span>
                )}
              </div>
              <Button
                onClick={onClose}
                variant="outline"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};