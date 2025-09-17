// src/pages/User/StationsPage.tsx - CORREGIDO
import { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import StationCard from '../../components/User/StationCard';
import VehicleCard from '../../components/User/VehicleCard';
// import LoanModal from '../../components/User/LoanModal';
import { Station, Vehicle } from '../../contexts/DataContext';
import { ArrowLeft, MapPin, Bike } from 'lucide-react';

export default function StationsPage() {
  const { user } = useAuth();
  const { stations, getVehiclesByStation, createLoan, stationsLoading } = useData();
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [stationVehicles, setStationVehicles] = useState<Record<string, Vehicle[]>>({});
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // Cargar vehículos para todas las estaciones
  useEffect(() => {
    const loadAllStationVehicles = async () => {
      if (stations.length === 0) return;

      setVehiclesLoading(true);
      const vehiclesMap: Record<string, Vehicle[]> = {};

      try {
        for (const station of stations) {
          try {
            const vehicles = await getVehiclesByStation(station.id);
            vehiclesMap[station.id] = vehicles || [];
          } catch (error) {
            console.error(`Error loading vehicles for station ${station.id}:`, error);
            vehiclesMap[station.id] = [];
          }
        }
        setStationVehicles(vehiclesMap);
      } catch (error) {
        console.error('Error loading station vehicles:', error);
      } finally {
        setVehiclesLoading(false);
      }
    };

    loadAllStationVehicles();
  }, [stations, getVehiclesByStation]);

  // Cargar vehículos para la estación seleccionada
  useEffect(() => {
    const loadSelectedStationVehicles = async () => {
      if (!selectedStation) {
        setAvailableVehicles([]);
        return;
      }

      setVehiclesLoading(true);
      try {
        const vehicles = await getVehiclesByStation(selectedStation.id);
        setAvailableVehicles(vehicles || []);
      } catch (error) {
        console.error('Error loading vehicles for selected station:', error);
        setAvailableVehicles([]);
      } finally {
        setVehiclesLoading(false);
      }
    };

    loadSelectedStationVehicles();
  }, [selectedStation, getVehiclesByStation]);

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    setSelectedVehicle(null);
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleStartLoan = () => {
    if (selectedStation && selectedVehicle && user) {
      // Lógica simple para iniciar préstamo
      createLoan({
        vehicleId: selectedVehicle.id,
        originStationId: selectedStation.id,
      }).then(loanId => {
        if (loanId) {
          setSelectedStation(null);
          setSelectedVehicle(null);
          alert('¡Préstamo iniciado exitosamente!');
        } else {
          alert('Error al crear el préstamo. Inténtalo de nuevo.');
        }
      });
    }
  };

  const activeStations = stations.filter(s => s.isActive);

  // Mostrar loading mientras cargan las estaciones
  if (stationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estaciones...</p>
        </div>
      </div>
    );
  }

  // Vista de estación seleccionada
  if (selectedStation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedStation(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedStation.name}</h1>
            <p className="text-gray-600">{selectedStation.address}</p>
          </div>
        </div>

        {vehiclesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando vehículos...</p>
            </div>
          </div>
        ) : availableVehicles.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Vehículos Disponibles ({availableVehicles.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onSelect={() => handleVehicleSelect(vehicle)}
                  selected={selectedVehicle?.id === vehicle.id}
                />
              ))}
            </div>
            {selectedVehicle && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleStartLoan}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Iniciar Préstamo
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bike className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay vehículos disponibles
            </h3>
            <p className="text-gray-600">
              Esta estación no tiene vehículos disponibles en este momento.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Vista principal de estaciones
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <MapPin className="h-8 w-8 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estaciones EcoMove</h1>
          <p className="text-gray-600">Encuentra y alquila vehículos ecológicos cerca de ti</p>
        </div>
      </div>

      {vehiclesLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-blue-700">Cargando información de vehículos...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeStations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            vehicles={stationVehicles[station.id] || []}
            onSelectStation={handleStationSelect}
          />
        ))}
      </div>

      {activeStations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay estaciones disponibles
          </h3>
          <p className="text-gray-600">
            Las estaciones están temporalmente fuera de servicio o aún se están cargando.
          </p>
        </div>
      )}
    </div>
  );
}