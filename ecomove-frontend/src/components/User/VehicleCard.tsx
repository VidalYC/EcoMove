import React from 'react';
import { Bike, Zap, Battery } from 'lucide-react';
import { Vehicle } from '../../contexts/DataContext';
import { motion } from 'framer-motion';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect: (vehicle: Vehicle) => void;
  selected?: boolean;
}

export default function VehicleCard({ vehicle, onSelect, selected }: VehicleCardProps) {
  const getVehicleIcon = () => {
    switch (vehicle.type) {
      case 'bicycle':
        return <Bike className="h-6 w-6 text-blue-500" />;
      case 'scooter':
        return <Zap className="h-6 w-6 text-orange-500" />;
      case 'electric-scooter':
        return <Battery className="h-6 w-6 text-purple-500" />;
    }
  };

  const getVehicleType = () => {
    switch (vehicle.type) {
      case 'bicycle':
        return 'Bicicleta';
      case 'scooter':
        return 'Patineta';
      case 'electric-scooter':
        return 'Scooter Eléctrico';
    }
  };

  const getStatusColor = () => {
    switch (vehicle.status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in-use':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = () => {
    switch (vehicle.status) {
      case 'available':
        return 'Disponible';
      case 'in-use':
        return 'En uso';
      case 'maintenance':
        return 'Mantenimiento';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => vehicle.status === 'available' && onSelect(vehicle)}
      className={`p-4 border rounded-xl cursor-pointer transition-all ${
        selected
          ? 'border-emerald-500 bg-emerald-50'
          : vehicle.status === 'available'
          ? 'border-gray-200 hover:border-gray-300 bg-white'
          : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getVehicleIcon()}
          <div>
            <h4 className="font-medium text-gray-900">{vehicle.model}</h4>
            <p className="text-sm text-gray-600">{getVehicleType()}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {vehicle.batteryLevel !== undefined && (
        <div className="flex items-center space-x-2">
          <Battery className="h-4 w-4 text-gray-500" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Batería</span>
              <span className="font-medium">{vehicle.batteryLevel}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  vehicle.batteryLevel > 50 ? 'bg-green-500' : 
                  vehicle.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${vehicle.batteryLevel}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}