import { useState } from 'react';
import type { Station, Transport } from '../types';

interface StationCardProps {
  station: Station;
  transports?: Transport[];
  onSelect?: (station: Station) => void;
  isSelected?: boolean;
}

export default function StationCard({ station, transports = [], onSelect, isSelected = false }: StationCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const availableCount = transports.filter(t => t.status === 'DISPONIBLE').length;
  const totalCount = transports.length;

  const handleClick = () => {
    if (onSelect) {
      onSelect(station);
    }
    setShowDetails(!showDetails);
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border border-gray-200'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              availableCount > 0 ? 'bg-emerald-500' : 'bg-red-500'
            }`}></div>
            <h3 className="font-semibold text-gray-900">{station.name}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">{station.location}</p>
          
          <div className="mt-3 flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-900">{availableCount}</span>
              <span className="text-xs text-gray-500">disponibles</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-900">{totalCount}</span>
              <span className="text-xs text-gray-500">total</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            availableCount > 0 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {availableCount > 0 ? 'Disponible' : 'Sin stock'}
          </span>
          
          {showDetails && (
            <div className="mt-2">
              <span className="text-xs text-gray-400">Ver detalles ↓</span>
            </div>
          )}
        </div>
      </div>

      {/* Detalles expandidos */}
      {showDetails && transports.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Transportes en la estación:</h4>
          <div className="space-y-2">
            {transports.map((transport) => (
              <div key={transport.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {transport.type === 'BICICLETA' ? '🚲' : '🛴'}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-gray-900">ID: {transport.id}</p>
                    <p className="text-xs text-gray-500">{transport.type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  transport.status === 'DISPONIBLE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : transport.status === 'EN_USO'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {transport.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}