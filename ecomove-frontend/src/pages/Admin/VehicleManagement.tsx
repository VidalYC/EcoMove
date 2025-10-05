// src/pages/Admin/VehicleManagement.tsx - VERSIÓN COMPLETA CON AUTONOMÍA
import React, { useState, useEffect } from 'react';
import { 
  Bike, Search, Edit, Trash2, Plus, RefreshCw, ArrowLeft, Zap,
  MapPin, Eye, ChevronLeft, ChevronRight, CheckCircle, XCircle, 
  AlertCircle, X, Battery, Gauge, Settings, DollarSign, Fuel
} from 'lucide-react';
import { transportApiService, Transport } from '../../services/transportApi.service';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

interface Station {
  id: number;
  nombre: string;
  direccion: string;
}

interface VehicleFilters {
  searchTerm: string;
  type: 'all' | 'bicycle' | 'electric_scooter' | 'scooter';
  status: 'all' | 'available' | 'in_use' | 'maintenance' | 'damaged';
  station: string;
}

// ==================== MODAL DE EDICIÓN ====================
const EditVehicleModal = ({ isOpen, onClose, vehicle, editForm, setEditForm, stations, onSave, isLoading }: any) => {
  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Editar Vehículo - {vehicle.codigo}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marca</label>
              <input
                type="text"
                value={editForm.marca}
                onChange={(e) => setEditForm({ ...editForm, marca: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Modelo</label>
              <input
                type="text"
                value={editForm.modelo}
                onChange={(e) => setEditForm({ ...editForm, modelo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
              <select
                value={editForm.estado}
                onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="available">Disponible</option>
                <option value="in_use">En uso</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="damaged">Dañado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estación</label>
              <select
                value={editForm.estacion_actual_id || ''}
                onChange={(e) => setEditForm({ ...editForm, estacion_actual_id: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sin estación</option>
                {stations.map((s: Station) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tarifa por Hora (COP)</label>
            <input
              type="number"
              value={editForm.tarifa_por_hora}
              onChange={(e) => setEditForm({ ...editForm, tarifa_por_hora: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="0"
              step="100"
            />
          </div>

          {editForm.tipo === 'bicycle' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Número de Cambios</label>
                <input
                  type="number"
                  value={editForm.numero_cambios || ''}
                  onChange={(e) => setEditForm({ ...editForm, numero_cambios: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Frenos</label>
                <input
                  type="text"
                  value={editForm.tipo_frenos || ''}
                  onChange={(e) => setEditForm({ ...editForm, tipo_frenos: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {editForm.tipo === 'electric_scooter' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nivel de Batería (%)</label>
                <input
                  type="number"
                  value={editForm.nivel_bateria || ''}
                  onChange={(e) => setEditForm({ ...editForm, nivel_bateria: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Velocidad Máxima (km/h)</label>
                <input
                  type="number"
                  value={editForm.velocidad_maxima || ''}
                  onChange={(e) => setEditForm({ ...editForm, velocidad_maxima: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Autonomía (km)</label>
                <input
                  type="number"
                  value={editForm.autonomia || ''}
                  onChange={(e) => setEditForm({ ...editForm, autonomia: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="10"
                  max="100"
                  placeholder="50"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rango: 10-100 km</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== MODAL DE DETALLES ====================
const DetailsModal = ({ isOpen, onClose, vehicle, station }: any) => {
  if (!isOpen || !vehicle) return null;

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      in_use: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      maintenance: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      damaged: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[status as keyof typeof colors] || colors.available;
  };

  const getStatusLabel = (status: string) => {
    const labels = { available: 'Disponible', in_use: 'En uso', maintenance: 'Mantenimiento', damaged: 'Dañado' };
    return labels[status as keyof typeof labels] || status;
  };

  const getTypeName = (type: string) => {
    const names = { bicycle: 'Bicicleta', electric_scooter: 'Scooter Eléctrico', scooter: 'Scooter' };
    return names[type as keyof typeof names] || type;
  };

  const TypeIcon = vehicle.tipo === 'bicycle' ? Bike : Zap;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
              <TypeIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{vehicle.codigo}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{getTypeName(vehicle.tipo)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado Actual</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vehicle.estado)}`}>
              {getStatusLabel(vehicle.estado)}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Información General
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Marca</p>
                <p className="font-medium text-gray-900 dark:text-white">{vehicle.marca || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Modelo</p>
                <p className="font-medium text-gray-900 dark:text-white">{vehicle.modelo}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center mb-2">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ubicación</span>
              </div>
              <p className="text-sm text-gray-900 dark:text-white">
                {station?.nombre || 'Sin estación asignada'}
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center mb-2">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tarifa/Hora</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                ${vehicle.tarifa_por_hora?.toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          {vehicle.tipo === 'bicycle' && (vehicle.numero_cambios || vehicle.tipo_frenos) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Bike className="h-5 w-5 mr-2" />
                Especificaciones de Bicicleta
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {vehicle.numero_cambios && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Número de Cambios</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{vehicle.numero_cambios}</p>
                  </div>
                )}
                {vehicle.tipo_frenos && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tipo de Frenos</p>
                    <p className="font-medium text-gray-900 dark:text-white">{vehicle.tipo_frenos}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {vehicle.tipo === 'electric_scooter' && (vehicle.nivel_bateria !== undefined || vehicle.velocidad_maxima || vehicle.autonomia) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Especificaciones de Scooter Eléctrico
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {vehicle.nivel_bateria !== undefined && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Battery className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Nivel de Batería</p>
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{vehicle.nivel_bateria}%</p>
                  </div>
                )}
                {vehicle.velocidad_maxima && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Gauge className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Velocidad Máxima</p>
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{vehicle.velocidad_maxima} km/h</p>
                  </div>
                )}
                {vehicle.autonomia && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg col-span-2">
                    <div className="flex items-center mb-1">
                      <Fuel className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Autonomía</p>
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{vehicle.autonomia} km</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== MODAL DE CREACIÓN ====================
const CreateVehicleModal = ({ isOpen, onClose, createForm, setCreateForm, stations, onCreate, isLoading }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Crear Nuevo Vehículo</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Vehículo *</label>
            <select
              value={createForm.tipo}
              onChange={(e) => setCreateForm({ ...createForm, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="bicycle">Bicicleta</option>
              <option value="electric_scooter">Scooter Eléctrico</option>
              <option value="scooter">Scooter</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marca *</label>
              <input
                type="text"
                value={createForm.marca}
                onChange={(e) => setCreateForm({ ...createForm, marca: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: Trek"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Modelo *</label>
              <input
                type="text"
                value={createForm.modelo}
                onChange={(e) => setCreateForm({ ...createForm, modelo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: FX 3"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tarifa por Hora (COP) *</label>
              <input
                type="number"
                value={createForm.tarifa_por_hora}
                onChange={(e) => setCreateForm({ ...createForm, tarifa_por_hora: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
                step="100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estación Inicial</label>
              <select
                value={createForm.estacion_actual_id || ''}
                onChange={(e) => setCreateForm({ ...createForm, estacion_actual_id: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sin estación</option>
                {stations.map((s: Station) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {createForm.tipo === 'bicycle' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Especificaciones de Bicicleta</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Número de Cambios</label>
                  <input
                    type="number"
                    value={createForm.numero_cambios || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCreateForm({ ...createForm, numero_cambios: val && !isNaN(Number(val)) ? parseInt(val) : undefined });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    placeholder="21"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Tipo de Frenos</label>
                  <input
                    type="text"
                    value={createForm.tipo_frenos || ''}
                    onChange={(e) => setCreateForm({ ...createForm, tipo_frenos: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Disco"
                  />
                </div>
              </div>
            </div>
          )}

          {createForm.tipo === 'electric_scooter' && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Especificaciones de Scooter Eléctrico</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Nivel de Batería (%)</label>
                  <input
                    type="number"
                    value={createForm.nivel_bateria !== undefined ? createForm.nivel_bateria : 100}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCreateForm({ ...createForm, nivel_bateria: val && !isNaN(Number(val)) ? parseInt(val) : 100 });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Velocidad Máxima (km/h)</label>
                  <input
                    type="number"
                    value={createForm.velocidad_maxima || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCreateForm({ ...createForm, velocidad_maxima: val && !isNaN(Number(val)) ? parseInt(val) : undefined });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    placeholder="25"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Autonomía (km) *
                  </label>
                  <input
                    type="number"
                    value={createForm.autonomia || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCreateForm({ ...createForm, autonomia: val && !isNaN(Number(val)) ? parseInt(val) : undefined });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="10"
                    max="100"
                    placeholder="50"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rango: 10-100 km</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={onCreate}
            disabled={isLoading || !createForm.marca || !createForm.modelo}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? 'Creando...' : 'Crear Vehículo'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
const VehicleManagement: React.FC = () => {
  const { showSuccess, showError } = useNotifications();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Transport[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Transport[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Transport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [editForm, setEditForm] = useState({
    codigo: '',
    tipo: 'bicycle' as Transport['tipo'],
    marca: '',
    modelo: '',
    estado: 'available' as Transport['estado'],
    estacion_actual_id: undefined as number | undefined,
    tarifa_por_hora: 0,
    numero_cambios: undefined as number | undefined,
    tipo_frenos: '',
    nivel_bateria: undefined as number | undefined,
    velocidad_maxima: undefined as number | undefined,
    autonomia: undefined as number | undefined
  });
  
  const [createForm, setCreateForm] = useState({
    tipo: 'bicycle' as Transport['tipo'],
    marca: '',
    modelo: '',
    tarifa_por_hora: 500,
    estacion_actual_id: undefined as number | undefined,
    numero_cambios: undefined as number | undefined,
    tipo_frenos: '',
    nivel_bateria: undefined as number | undefined,
    velocidad_maxima: undefined as number | undefined,
    autonomia: undefined as number | undefined
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [vehiclesPerPage] = useState(12);
  
  const [filters, setFilters] = useState<VehicleFilters>({
    searchTerm: '',
    type: 'all',
    status: 'all',
    station: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('ecomove_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const [vehiclesResponse, stationsResponse] = await Promise.all([
        fetch('http://localhost:4000/api/v1/transports', { headers }).then(res => res.json()),
        fetch('http://localhost:4000/api/v1/stations?estado=active', { headers }).then(res => res.json())
      ]);

      let vehicleArray: any[] = [];
      let stationArray: any[] = [];

      if (vehiclesResponse?.success && vehiclesResponse?.data) {
        if (Array.isArray(vehiclesResponse.data)) {
          vehicleArray = vehiclesResponse.data;
        } else if (vehiclesResponse.data.transports && Array.isArray(vehiclesResponse.data.transports)) {
          vehicleArray = vehiclesResponse.data.transports;
        }
      } else if (Array.isArray(vehiclesResponse)) {
        vehicleArray = vehiclesResponse;
      }

      if (stationsResponse?.success && stationsResponse?.data) {
        if (Array.isArray(stationsResponse.data)) {
          stationArray = stationsResponse.data;
        }
      } else if (Array.isArray(stationsResponse)) {
        stationArray = stationsResponse;
      }

      const mappedVehicles = vehicleArray.map((v: any) => ({
        id: v.id,
        codigo: v.code || v.codigo || `T${v.id}`,
        tipo: (v.type || v.tipo || '').replace('-', '_'),
        modelo: v.model || v.modelo,
        marca: v.brand || v.marca || 'N/A',
        estado: v.status || v.estado,
        estacion_actual_id: v.currentStationId || v.estacion_actual_id,
        tarifa_por_hora: v.hourlyRate || v.tarifa_por_hora,
        numero_cambios: v.specifications?.gearCount || v.numero_cambios,
        tipo_frenos: v.specifications?.brakeType || v.tipo_frenos,
        nivel_bateria: v.specifications?.batteryLevel || v.nivel_bateria,
        velocidad_maxima: v.specifications?.maxSpeed || v.velocidad_maxima,
        autonomia: v.specifications?.autonomy || v.autonomia,
        created_at: v.createdAt || v.created_at,
        updated_at: v.updatedAt || v.updated_at
      }));

      setVehicles(mappedVehicles);
      setFilteredVehicles(mappedVehicles);

      const mappedStations = stationArray.map((s: any) => ({
        id: s.id,
        nombre: s.name || s.nombre,
        direccion: s.address || s.direccion
      }));
      setStations(mappedStations);

      showSuccess('Datos cargados', `${mappedVehicles.length} vehículos cargados correctamente`);
    } catch (error: any) {
      console.error('Error loading data:', error);
      showError('Error', error.message || 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...vehicles];

    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.codigo?.toLowerCase().includes(search) ||
        v.marca?.toLowerCase().includes(search) ||
        v.modelo?.toLowerCase().includes(search)
      );
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(v => v.tipo === filters.type);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(v => v.estado === filters.status);
    }

    if (filters.station !== 'all') {
      filtered = filtered.filter(v => v.estacion_actual_id?.toString() === filters.station);
    }

    setFilteredVehicles(filtered);
    setCurrentPage(1);
  }, [filters, vehicles]);

  const handleEdit = (vehicle: Transport) => {
    setSelectedVehicle(vehicle);
    setEditForm({
      codigo: vehicle.codigo,
      tipo: vehicle.tipo,
      marca: vehicle.marca || '',
      modelo: vehicle.modelo,
      estado: vehicle.estado,
      estacion_actual_id: vehicle.estacion_actual_id,
      tarifa_por_hora: vehicle.tarifa_por_hora,
      numero_cambios: vehicle.numero_cambios,
      tipo_frenos: vehicle.tipo_frenos || '',
      nivel_bateria: vehicle.nivel_bateria,
      velocidad_maxima: vehicle.velocidad_maxima,
      autonomia: vehicle.autonomia
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedVehicle) return;
    
    try {
      setIsLoading(true);
      
      const updateData: any = {
        modelo: editForm.modelo,
        marca: editForm.marca,
        estado: editForm.estado,
        estacion_actual_id: editForm.estacion_actual_id,
        tarifa_por_hora: editForm.tarifa_por_hora
      };

      if (editForm.tipo === 'bicycle') {
        if (editForm.numero_cambios) updateData.numero_cambios = editForm.numero_cambios;
        if (editForm.tipo_frenos) updateData.tipo_frenos = editForm.tipo_frenos;
      } else if (editForm.tipo === 'electric_scooter') {
        if (editForm.nivel_bateria !== undefined) updateData.nivel_bateria = editForm.nivel_bateria;
        if (editForm.velocidad_maxima) updateData.velocidad_maxima = editForm.velocidad_maxima;
        if (editForm.autonomia) updateData.autonomia = editForm.autonomia;
      }

      const response = await transportApiService.updateTransport(selectedVehicle.id, updateData);

      if (response.success) {
        await loadData();
        setShowEditModal(false);
        showSuccess('Actualizado', 'Vehículo actualizado exitosamente');
      } else {
        throw new Error(response.message || 'Error al actualizar');
      }
    } catch (error: any) {
      showError('Error', error.message || 'No se pudo actualizar el vehículo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setIsLoading(true);
      
      const createData: any = {
        tipo: createForm.tipo,
        modelo: createForm.modelo,
        marca: createForm.marca,
        tarifa_por_hora: createForm.tarifa_por_hora,
        estacion_actual_id: createForm.estacion_actual_id
      };

      if (createForm.tipo === 'bicycle') {
        if (createForm.numero_cambios) createData.numero_cambios = createForm.numero_cambios;
        if (createForm.tipo_frenos) createData.tipo_frenos = createForm.tipo_frenos;
      } else if (createForm.tipo === 'electric_scooter') {
        createData.nivel_bateria = createForm.nivel_bateria !== undefined ? createForm.nivel_bateria : 100;
        if (createForm.velocidad_maxima) createData.velocidad_maxima = createForm.velocidad_maxima;
        // CRÍTICO: Asegurar que autonomía sea un número válido
        createData.autonomia = createForm.autonomia && createForm.autonomia >= 10 && createForm.autonomia <= 100 
          ? createForm.autonomia 
          : 50; // Valor por defecto si no es válido
      }

      console.log('📦 Datos a enviar:', createData); // Debug

      const response = await transportApiService.createTransport(createData);

      if (response.success) {
        await loadData();
        setShowCreateModal(false);
        setCreateForm({
          tipo: 'bicycle',
          marca: '',
          modelo: '',
          tarifa_por_hora: 500,
          estacion_actual_id: undefined,
          numero_cambios: undefined,
          tipo_frenos: '',
          nivel_bateria: undefined,
          velocidad_maxima: undefined,
          autonomia: undefined
        });
        showSuccess('Creado', 'Vehículo creado exitosamente');
      } else {
        throw new Error(response.message || 'Error al crear');
      }
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      showError('Error', error.message || 'No se pudo crear el vehículo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (vehicleId: number) => {
    if (!confirm('¿Estás seguro de eliminar este vehículo?')) return;
    
    try {
      setIsLoading(true);
      const response = await transportApiService.deleteTransport(vehicleId);

      if (response.success) {
        await loadData();
        showSuccess('Eliminado', 'Vehículo eliminado exitosamente');
      } else {
        throw new Error(response.message || 'Error al eliminar');
      }
    } catch (error: any) {
      showError('Error', error.message || 'No se pudo eliminar el vehículo');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: Transport['estado']) => {
    const badges = {
      available: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle, label: 'Disponible' },
      in_use: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: AlertCircle, label: 'En uso' },
      maintenance: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: AlertCircle, label: 'Mantenimiento' },
      damaged: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: XCircle, label: 'Dañado' }
    };
    return badges[status] || badges.available;
  };

  const getTypeIcon = (type: Transport['tipo']) => type === 'bicycle' ? Bike : Zap;

  const getTypeName = (type: Transport['tipo']) => {
    const names = { bicycle: 'Bicicleta', electric_scooter: 'Scooter Eléctrico', scooter: 'Scooter' };
    return names[type];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
  };

  const indexOfLastVehicle = currentPage * vehiclesPerPage;
  const indexOfFirstVehicle = indexOfLastVehicle - vehiclesPerPage;
  const currentVehicles = filteredVehicles.slice(indexOfFirstVehicle, indexOfLastVehicle);
  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);

  if (isLoading && vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando vehículos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="bg-emerald-100 dark:bg-emerald-900/20 p-3 rounded-lg">
                <Bike className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Vehículos</h1>
                <p className="text-gray-600 dark:text-gray-400">{filteredVehicles.length} vehículos</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={loadData} disabled={isLoading} className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
              <button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                <Plus className="h-4 w-4" />
                <span>Nuevo</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select value={filters.type} onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))} className="px-4 py-2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg">
              <option value="all">Todos los tipos</option>
              <option value="bicycle">Bicicletas</option>
              <option value="electric_scooter">Scooters Eléctricos</option>
            </select>
            <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))} className="px-4 py-2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg">
              <option value="all">Todos los estados</option>
              <option value="available">Disponibles</option>
              <option value="in_use">En uso</option>
              <option value="maintenance">Mantenimiento</option>
            </select>
            <select value={filters.station} onChange={(e) => setFilters(prev => ({ ...prev, station: e.target.value }))} className="px-4 py-2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg">
              <option value="all">Todas las estaciones</option>
              {stations.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {currentVehicles.map((vehicle) => {
            const statusBadge = getStatusBadge(vehicle.estado);
            const TypeIcon = getTypeIcon(vehicle.tipo);
            const StatusIcon = statusBadge.icon;

            return (
              <div key={vehicle.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                      <TypeIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{vehicle.codigo}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{getTypeName(vehicle.tipo)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs flex items-center ${statusBadge.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusBadge.label}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Marca:</span> {vehicle.marca}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Modelo:</span> {vehicle.modelo}</p>
                  {vehicle.estacion_actual_id && (
                    <p className="text-sm flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="h-3 w-3 mr-1" />
                      {stations.find(s => s.id === vehicle.estacion_actual_id)?.nombre || 'Sin estación'}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(vehicle.tarifa_por_hora)}/h</p>
                </div>

                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(vehicle)} className="flex-1 p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors">
                    <Edit className="h-4 w-4 mx-auto" />
                  </button>
                  <button onClick={() => {setSelectedVehicle(vehicle); setShowDetailsModal(true);}} className="flex-1 p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                    <Eye className="h-4 w-4 mx-auto" />
                  </button>
                  <button onClick={() => handleDelete(vehicle.id)} className="flex-1 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {currentVehicles.length === 0 && !isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Bike className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay vehículos
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filters.searchTerm || filters.type !== 'all' || filters.status !== 'all' || filters.station !== 'all'
                ? 'No se encontraron vehículos con los filtros aplicados'
                : 'Aún no hay vehículos registrados en el sistema'
              }
            </p>
            {(filters.searchTerm || filters.type !== 'all' || filters.status !== 'all' || filters.station !== 'all') && (
              <button
                onClick={() => setFilters({ searchTerm: '', type: 'all', status: 'all', station: 'all' })}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">
              Mostrando {indexOfFirstVehicle + 1}-{Math.min(indexOfLastVehicle, filteredVehicles.length)} de {filteredVehicles.length}
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 text-gray-900 dark:text-white">
                Página {currentPage}/{totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALES */}
      <EditVehicleModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        vehicle={selectedVehicle}
        editForm={editForm}
        setEditForm={setEditForm}
        stations={stations}
        onSave={handleSaveEdit}
        isLoading={isLoading}
      />

      <DetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        vehicle={selectedVehicle}
        station={selectedVehicle ? stations.find(s => s.id === selectedVehicle.estacion_actual_id) : null}
      />

      <CreateVehicleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        createForm={createForm}
        setCreateForm={setCreateForm}
        stations={stations}
        onCreate={handleCreate}
        isLoading={isLoading}
      />
    </div>
  );
};

export default VehicleManagement;