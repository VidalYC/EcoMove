import { useEffect, useState } from "react";
import { api } from "../api/client";
import StationCard from "../components/StationCard";
import TransportList from "../components/TransportList";
import type { Station, Transport } from "../types";

export default function Stations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selected, setSelected] = useState<Station | null>(null);
  const [avail, setAvail] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('list');

  useEffect(() => { 
    api<Station[]>("/stations").then(setStations).catch(console.error); 
  }, []);

  async function handleStationSelect(station: Station) {
    setSelected(station);
    setLoading(true);
    try {
      const r = await api<{ station_id: number; transports: Transport[] }>(`/stations/${station.id}/availability`);
      setAvail(r.transports);
    } catch (error) {
      console.error("Error loading station availability:", error);
      setAvail([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Estaciones</h1>
            <p className="text-gray-600 mt-1">
              Administra las estaciones de transporte y supervisa su estado en tiempo real
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'list' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Lista
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'map' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🗺️ Mapa
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Lista de estaciones */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Estaciones</h3>
              <p className="text-sm text-gray-600">Haz clic en una estación para ver detalles</p>
            </div>
            
            <div className="p-4 space-y-3">
              {stations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  onSelect={handleStationSelect}
                  isSelected={selected?.id === station.id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha: Vista de mapa o detalles */}
        <div className="lg:col-span-2">
          {view === 'map' ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapa de Estaciones</h3>
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center relative">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🗺️</div>
                  <p>Mapa interactivo con estaciones</p>
                  <p className="text-sm">Se implementará con integración de mapas</p>
                </div>
                
                {/* Estaciones simuladas en el mapa */}
                <div className="absolute top-16 left-20">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="absolute -bottom-6 -left-8 text-xs bg-white px-2 py-1 rounded shadow">EST-001</span>
                </div>
                <div className="absolute top-32 right-24">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="absolute -bottom-6 -left-8 text-xs bg-white px-2 py-1 rounded shadow">EST-002</span>
                </div>
                <div className="absolute bottom-20 left-1/3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="absolute -bottom-6 -left-8 text-xs bg-white px-2 py-1 rounded shadow">EST-003</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información de estación seleccionada */}
              {selected ? (
                <>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{selected.name}</h3>
                        <p className="text-gray-600">{selected.location}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        avail.filter(t => t.status === 'DISPONIBLE').length > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {avail.filter(t => t.status === 'DISPONIBLE').length > 0 ? 'Operativa' : 'Sin stock'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-600">
                          {avail.filter(t => t.status === 'DISPONIBLE').length}
                        </p>
                        <p className="text-sm text-emerald-700">Disponibles</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">
                          {avail.filter(t => t.status === 'EN_USO').length}
                        </p>
                        <p className="text-sm text-yellow-700">En uso</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">
                          {avail.filter(t => t.status === 'MANTENIMIENTO').length}
                        </p>
                        <p className="text-sm text-red-700">Mantenimiento</p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de transportes */}
                  {loading ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-600">Cargando transportes...</p>
                    </div>
                  ) : (
                    <TransportList transports={avail} />
                  )}
                </>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-4">📍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecciona una estación
                  </h3>
                  <p className="text-gray-500">
                    Elige una estación de la lista para ver su disponibilidad y gestionar los transportes
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}