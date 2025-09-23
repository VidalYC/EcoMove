// src/pages/User/RentVehicle.tsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Search, 
  Filter,
  Bike,
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { VehicleList } from '../../components/Vehicle/VehicleList';
import { userApiService } from '../../services/userApi.service';
import { stationApiService } from '../../services/stationApi.service';

interface Station {
  id: number;
  nombre: string;
  direccion: string;
  latitud?: number;
  longitud?: number;
  capacidad?: number;
  estado?: string;
}

export const RentVehicle: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [vehicleType, setVehicleType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRenting, setIsRenting] = useState(false);
  const [rentSuccess, setRentSuccess] = useState<string | null>(null);

  // Cargar estaciones al inicializar
  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setIsLoading(true);
      const response = await stationApiService.getActiveStations();
      
      if (response.success && response.data) {
        setStations(response.data);
        console.log('📍 Loaded stations:', response.data.length);
      } else {
        setError('Error al cargar estaciones');
      }
    } catch (err) {
      console.error('Error loading stations:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar alquiler de vehículo
  const handleVehicleRent = async (vehicleId: string, stationId: string) => {
    try {
      setIsRenting(true);
      setError(null);
      setRentSuccess(null);

      console.log('🚀 Starting rental process:', { vehicleId, stationId });

      // Verificar si el usuario ya tiene un préstamo activo
      const hasActiveLoan = await userApiService.getCurrentLoan();
      if (hasActiveLoan) {
        throw new Error('Ya tienes un préstamo activo. Completa tu viaje actual antes de alquilar otro vehículo.');
      }

      // Crear el préstamo
      const newLoan = await userApiService.createLoan(vehicleId, stationId);
      
      if (newLoan) {
        setRentSuccess(`¡Préstamo creado exitosamente! ID: ${newLoan.id}`);
        
        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => {
          window.location.href = '/user/dashboard';
        }, 3000);
      } else {
        throw new Error('No se pudo crear el préstamo');
      }

    } catch (err: any) {
      console.error('Error renting vehicle:', err);
      setError(err.message || 'Error al alquilar el vehículo');
    } finally {
      setIsRenting(false);
    }
  };

  const clearFilters = () => {
    setSelectedStation(null);
    setVehicleType('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando vehículos disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>

              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
                  <Bike className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Alquilar Vehículo
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Encuentra el vehículo perfecto para tu viaje
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={loadStations}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
            </Button>
          </div>
        </div>
      </div>


      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensajes de estado */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {rentSuccess && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
              <div>
                <p className="text-green-600 dark:text-green-400 font-medium">
                  {rentSuccess}
                </p>
                <p className="text-green-500 dark:text-green-300 text-sm mt-1">
                  Redirigiendo al dashboard...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Indicadores rápidos */}
        {stations.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Estaciones activas</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stations.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                  <Bike className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Filtro actual</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedStation 
                      ? stations.find(s => s.id === selectedStation)?.nombre || 'Estación'
                      : 'Todas'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tipo de vehículo</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {vehicleType === 'bicicleta' ? 'Bicicletas' :
                     vehicleType === 'scooter_electrico' ? 'Scooters Eléctricos' :
                     vehicleType === 'scooter' ? 'Scooters' : 'Todos'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de vehículos */}
        <VehicleList
          onRent={handleVehicleRent}
          showOnlyAvailable={true}
          stationFilter={selectedStation || undefined}
          className={isRenting ? 'pointer-events-none opacity-50' : ''}
        />

        {/* Overlay de procesamiento */}
        {isRenting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-sm mx-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Procesando alquiler...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Por favor espera mientras confirmamos tu préstamo.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};