// src/components/Station/AllStationsModal.tsx
// Importa este componente en tu UserDashboard.tsx así:
// import { AllStationsModal } from '../../components/Station/AllStationsModal';
import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Bike,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
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
}

export const AllStationsModal: React.FC<AllStationsModalProps> = ({
  isOpen,
  onClose
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

      const token = localStorage.getItem('ecomove_token');
      const response = await fetch('http://localhost:4000/api/v1/stations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar estaciones');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Adaptar los datos del backend
        const adaptedStations = result.data.map((station: any) => ({
          id: station.id,
          nombre: station.name,
          direccion: station.address,
          latitud: station.latitude,
          longitud: station.longitude,
          capacidad: station.capacity,
          estado: station.status,
          // Simular datos adicionales que no vienen del backend
          transportes_disponibles: station.id === 5 ? 3 : 
                                   station.id === 4 ? 2 : 
                                   Math.floor(Math.random() * 5),
          distancia_km: station.id === 5 ? 0.8 : 
                       station.id === 4 ? 1.2 : 
                       Number((Math.random() * 5 + 0.5).toFixed(1))
        }));

        setStations(adaptedStations);
      }
    } catch (err: any) {
      console.error('Error loading stations:', err);
      setError(err.message || 'Error al cargar las estaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStations();
  };

  const handleNavigate = (station: Station) => {
    if (station.latitud && station.longitud) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitud},${station.longitud}`;
      window.open(url, '_blank');
    }
  };

  const handleRentAtStation = (stationId: number) => {
    onClose();
    window.location.href = `/transportes?station=${stationId}`;
  };

  // Filtrar estaciones
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
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
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
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              />
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  Intentar nuevamente
                </Button>
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
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
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          (station.transportes_disponibles || 0) > 0
                            ? 'bg-emerald-100 dark:bg-emerald-900'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <MapPin className={`h-5 w-5 ${
                            (station.transportes_disponibles || 0) > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {station.nombre}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {station.direccion}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Bike className={`h-4 w-4 ${
                          (station.transportes_disponibles || 0) > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-500'
                        }`} />
                        <span className={`font-medium ${
                          (station.transportes_disponibles || 0) > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-500'
                        }`}>
                          {station.transportes_disponibles || 0} disponibles
                        </span>
                      </div>
                      {station.distancia_km && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Navigation className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {station.distancia_km} km
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Estado */}
                    {station.estado && (
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          station.estado === 'activa'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {station.estado === 'activa' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Activa
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              {station.estado}
                            </>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex space-x-2">
                      {(station.transportes_disponibles || 0) > 0 ? (
                        <Button
                          onClick={() => handleRentAtStation(station.id)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
                          size="sm"
                        >
                          <Bike className="h-4 w-4 mr-2" />
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
                      
                      {station.latitud && station.longitud && (
                        <Button
                          onClick={() => handleNavigate(station)}
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                        >
                          <ExternalLink className="h-4 w-4" />
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