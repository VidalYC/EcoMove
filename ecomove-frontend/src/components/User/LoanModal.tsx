// src/components/Loan/LoanModal.tsx
import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, DollarSign } from 'lucide-react';
import { Station, Vehicle } from '../../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  originStation: Station | null;
  selectedVehicle: Vehicle | null;
  stations: Station[];
  onConfirm: (destinationStationId: string) => void;
}

export default function LoanModal({
  isOpen,
  onClose,
  originStation,
  selectedVehicle,
  stations,
  onConfirm
}: LoanModalProps) {
  const [destinationStationId, setDestinationStationId] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(30); // minutes
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    if (selectedVehicle) {
      // Nuevas tarifas ajustadas para cumplir con Stripe (mínimo $3,000 COP):
      // - Bicicleta: $50/min = $3,000/hora
      // - Scooter: $80/min = $4,800/hora
      // - Scooter Eléctrico: $120/min = $7,200/hora
      const rates = {
        bicycle: 50,           // $3,000/hora
        scooter: 80,          // $4,800/hora
        'electric-scooter': 120  // $7,200/hora
      };
      const rate = rates[selectedVehicle.type] || 50;
      
      // Calcular costo con tarifa base mínima de $3,000
      const baseRate = 3000;
      const calculatedCost = estimatedDuration * rate;
      const totalCost = Math.max(baseRate, calculatedCost);
      
      setEstimatedCost(Math.round(totalCost));
    }
  }, [selectedVehicle, estimatedDuration]);

  const handleConfirm = () => {
    if (destinationStationId) {
      onConfirm(destinationStationId);
      onClose();
    }
  };

  const availableDestinations = stations.filter(
    s => s.id !== originStation?.id && s.isActive
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Préstamo</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Resumen del préstamo</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehículo:</span>
                    <span>{selectedVehicle?.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estación origen:</span>
                    <span>{originStation?.name}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Estación de destino
                </label>
                <select
                  value={destinationStationId}
                  onChange={(e) => setDestinationStationId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Seleccionar destino</option>
                  {availableDestinations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name} - {station.address}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Duración estimada (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="240"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || 30)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Costo estimado:
                  </span>
                  <span className="text-lg font-semibold text-emerald-800">
                    ${estimatedCost.toLocaleString('es-CO')}
                  </span>
                </div>
                <p className="text-xs text-emerald-600 mt-1">
                  * Tarifa base mínima: $3,000 COP. El costo final se calculará según la duración real del préstamo
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!destinationStationId}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirmar Préstamo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}