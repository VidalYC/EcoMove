// src/components/User/StationCard.tsx - CORREGIDO
import React from 'react';
import { MapPin, Bike, Zap, Battery } from 'lucide-react';
import { Station, Vehicle } from '../../contexts/DataContext';
import { motion } from 'framer-motion';

interface StationCardProps {
  station: Station;
  vehicles: Vehicle[];
  onSelectStation: (station: Station) => void;
}

export default function StationCard({ station, vehicles, onSelectStation }: StationCardProps) {
  // Asegurar que vehicles sea siempre un array
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  
  const bicycles = safeVehicles.filter(v => v.type === 'bicycle');
  const scooters = safeVehicles.filter(v => v.type === 'scooter');
  const electricScooters = safeVehicles.filter(v => v.type === 'electric-scooter');
  
  const totalVehicles = safeVehicles.length;
  const occupancyPercentage = station.capacity > 0 ? (totalVehicles / station.capacity) * 100 : 0;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer border border-gray-100"
      onClick={() => onSelectStation(station)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <MapPin className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{station.name}</h3>
            <p className="text-sm text-gray-600">{station.address}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          station.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {station.isActive ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Bike className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">{bicycles.length}</p>
            <p className="text-xs text-gray-600">Bicicletas</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-orange-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">{scooters.length}</p>
            <p className="text-xs text-gray-600">Patinetas</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Battery className="h-4 w-4 text-purple-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">{electricScooters.length}</p>
            <p className="text-xs text-gray-600">Eléctricas</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Capacidad total:</span>
          <span className="font-medium text-gray-900">{totalVehicles}/{station.capacity}</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
          />
        </div>
        {totalVehicles === 0 && (
          <p className="text-xs text-gray-500 mt-1">Sin vehículos disponibles</p>
        )}
      </div>
    </motion.div>
  );
}