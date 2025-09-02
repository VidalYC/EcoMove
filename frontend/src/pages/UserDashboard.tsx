import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { Loan, Station, Transport } from '../types';

export default function UserDashboard() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [nearbyStations, setNearbyStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [availableTransports, setAvailableTransports] = useState<Transport[]>([]);

  useEffect(() => {
    // Cargar préstamos del usuario
    if (user) {
      // Mock data por ahora
      setLoans([
        {
          id: 1,
          user_id: user.id,
          transport_id: 1,
          origin_station_id: 1,
          destination_station_id: 2,
          duration_minutes: 30,
          cost: 3500,
          status: 'ACTIVO'
        }
      ]);
    }

    // Cargar estaciones cercanas
    api<Station[]>('/stations').then(stations => {
      setNearbyStations(stations.slice(0, 3)); // Mostrar solo 3 estaciones cercanas
    }).catch(console.error);
  }, [user]);

  const handleStationSelect = async (station: Station) => {
    setSelectedStation(station);
    try {
      const result = await api<{ station_id: number; transports: Transport[] }>(`/stations/${station.id}/availability`);
      setAvailableTransports(result.transports);
    } catch (error) {
      console.error('Error loading transports:', error);
      setAvailableTransports([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Hola, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Encuentra tu transporte y continúa tu viaje sostenible
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Encuentra tu transporte */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-emerald-500 mr-2">🔍</span>
            Encuentra tu transporte
          </h3>
          <p className="text-gray-600 mb-4 text-sm">
            Selecciona una estación cercana y consulta la disponibilidad
          </p>
          
          <div className="space-y-3">
            {nearbyStations.map((station) => (
              <button
                key={station.id}
                onClick={() => handleStationSelect(station)}
                className={`w-full text-left p-3 rounded-md border transition-colors ${
                  selectedStation?.id === station.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{station.name}</p>
                    <p className="text-gray-500 text-xs">{station.location}</p>
                  </div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                </div>
              </button>
            ))}
          </div>

          {selectedStation && availableTransports.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-900 mb-2">Disponibles:</p>
              {availableTransports.slice(0, 3).map((transport) => (
                <div key={transport.id} className="flex justify-between items-center py-1">
                  <span className="text-xs text-gray-600">
                    {transport.type === 'BICICLETA' ? '🚲' : '🛴'} {transport.type}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    transport.status === 'DISPONIBLE' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {transport.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Préstamos activos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-emerald-500 mr-2">🚲</span>
            Préstamos activos
          </h3>
          
          {loans.filter(loan => loan.status === 'ACTIVO').length > 0 ? (
            <div className="space-y-3">
              {loans.filter(loan => loan.status === 'ACTIVO').map((loan) => (
                <div key={loan.id} className="p-3 border border-emerald-200 rounded-md bg-emerald-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-emerald-900 text-sm">Transporte #{loan.transport_id}</p>
                      <p className="text-emerald-700 text-xs">Duración: {loan.duration_minutes} min</p>
                      <p className="text-emerald-700 text-xs">Costo: ${loan.cost.toLocaleString()}</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
                      ACTIVO
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">No tienes préstamos activos</p>
              <p className="text-gray-400 text-xs mt-1">¡Encuentra un transporte cercano!</p>
            </div>
          )}
        </div>

        {/* Accesos rápidos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acceso rápido</h3>
          <div className="space-y-3">
            <button className="w-full p-3 text-left border border-gray-200 rounded-md hover:border-emerald-300 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <span className="text-emerald-500 mr-3">➕</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Nuevo préstamo</p>
                  <p className="text-gray-500 text-xs">Reserva un transporte</p>
                </div>
              </div>
            </button>
            
            <button className="w-full p-3 text-left border border-gray-200 rounded-md hover:border-emerald-300 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <span className="text-emerald-500 mr-3">↩️</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Devolver transporte</p>
                  <p className="text-gray-500 text-xs">Finalizar viaje</p>
                </div>
              </div>
            </button>
            
            <button className="w-full p-3 text-left border border-gray-200 rounded-md hover:border-emerald-300 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <span className="text-emerald-500 mr-3">📊</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Mis viajes</p>
                  <p className="text-gray-500 text-xs">Historial completo</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas del usuario */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tus estadísticas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">12</p>
            <p className="text-sm text-emerald-700">Viajes realizados</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">4.5</p>
            <p className="text-sm text-blue-700">Horas de uso</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">2.1 kg</p>
            <p className="text-sm text-green-700">CO₂ ahorrado</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">$42.000</p>
            <p className="text-sm text-purple-700">Total invertido</p>
          </div>
        </div>
      </div>
    </div>
  );
}