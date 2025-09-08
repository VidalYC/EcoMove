import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import StationCard from '../../components/User/StationCard';
import VehicleCard from '../../components/User/VehicleCard';
import LoanModal from '../../components/User/LoanModal';
import { Station, Vehicle } from '../../contexts/DataContext';
import { ArrowLeft, MapPin, Bike } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StationsPage() {
  const { user } = useAuth();
  const { stations, getVehiclesByStation, createLoan } = useData();
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    setSelectedVehicle(null);
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleStartLoan = () => {
    if (selectedStation && selectedVehicle) {
      setShowLoanModal(true);
    }
  };

  const handleConfirmLoan = (destinationStationId: string) => {
    if (user && selectedVehicle && selectedStation) {
      createLoan({
        userId: user.id,
        vehicleId: selectedVehicle.id,
        originStationId: selectedStation.id,
        status: 'active'
      });
      
      setSelectedStation(null);
      setSelectedVehicle(null);
      setShowLoanModal(false);
      
      // Show success message (you can implement a toast notification here)
      alert('¡Préstamo iniciado exitosamente!');
    }
  };

  const activeStations = stations.filter(s => s.isActive);

  if (selectedStation) {
    const availableVehicles = getVehiclesByStation(selectedStation.id);

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

        {availableVehicles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onSelect={handleVehicleSelect}
                  selected={selectedVehicle?.id === vehicle.id}
                />
              ))}
            </div>

            {selectedVehicle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md p-6 border border-emerald-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Vehículo seleccionado</h3>
                    <p className="text-gray-600">{selectedVehicle.model}</p>
                  </div>
                  <button
                    onClick={handleStartLoan}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Iniciar Préstamo
                  </button>
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Bike className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay vehículos disponibles
            </h3>
            <p className="text-gray-600">
              Intenta con otra estación o vuelve más tarde.
            </p>
          </div>
        )}

        <LoanModal
          isOpen={showLoanModal}
          onClose={() => setShowLoanModal(false)}
          originStation={selectedStation}
          selectedVehicle={selectedVehicle}
          stations={stations}
          onConfirm={handleConfirmLoan}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <MapPin className="h-8 w-8 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estaciones EcoMove</h1>
          <p className="text-gray-600">Encuentra y alquila vehículos ecológicos cerca de ti</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeStations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            vehicles={getVehiclesByStation(station.id)}
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
            Las estaciones están temporalmente fuera de servicio.
          </p>
        </div>
      )}
    </div>
  );
}