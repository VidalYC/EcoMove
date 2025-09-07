import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, MapPin, Edit, Trash2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StationFormData {
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  capacity: number;
  isActive: boolean;
}

export default function AdminStations() {
  const { stations, addStation, updateStation, deleteStation, getVehiclesByStation } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingStation, setEditingStation] = useState<string | null>(null);
  const [formData, setFormData] = useState<StationFormData>({
    name: '',
    address: '',
    coordinates: { lat: 0, lng: 0 },
    capacity: 20,
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingStation) {
      updateStation(editingStation, formData);
      setEditingStation(null);
    } else {
      addStation(formData);
    }
    
    setFormData({
      name: '',
      address: '',
      coordinates: { lat: 0, lng: 0 },
      capacity: 20,
      isActive: true
    });
    setShowForm(false);
  };

  const handleEdit = (stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    if (station) {
      setFormData({
        name: station.name,
        address: station.address,
        coordinates: station.coordinates,
        capacity: station.capacity,
        isActive: station.isActive
      });
      setEditingStation(stationId);
      setShowForm(true);
    }
  };

  const handleDelete = (stationId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta estación?')) {
      deleteStation(stationId);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      coordinates: { lat: 0, lng: 0 },
      capacity: 20,
      isActive: true
    });
    setEditingStation(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MapPin className="h-8 w-8 text-emerald-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Estaciones</h1>
            <p className="text-gray-600">Administra las estaciones del sistema</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Estación</span>
        </button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingStation ? 'Editar Estación' : 'Nueva Estación'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitud
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.coordinates.lat}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        coordinates: { ...prev.coordinates, lat: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitud
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.coordinates.lng}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        coordinates: { ...prev.coordinates, lng: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 20 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Estación activa
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    {editingStation ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stations.map((station, index) => (
          <motion.div
            key={station.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${station.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                  <MapPin className={`h-5 w-5 ${station.isActive ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{station.name}</h3>
                  <p className="text-sm text-gray-600">{station.address}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(station.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(station.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Estado:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  station.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {station.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Vehículos actuales:</span>
                <span className="font-medium">
                  {getVehiclesByStation(station.id).length}/{station.capacity}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Coordenadas:</span>
                <span className="font-mono text-xs">
                  {station.coordinates.lat.toFixed(4)}, {station.coordinates.lng.toFixed(4)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {stations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay estaciones registradas
          </h3>
          <p className="text-gray-600 mb-6">
            Comienza agregando la primera estación al sistema.
          </p>
        </div>
      )}
    </div>
  );
}