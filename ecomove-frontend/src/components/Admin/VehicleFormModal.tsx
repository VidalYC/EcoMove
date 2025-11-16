// src/components/Admin/VehicleFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save, Bike, MapPin, DollarSign, Battery, Zap, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '../UI/Button';

export interface VehicleFormData {
  tipo: 'bicycle' | 'electric-scooter';
  modelo: string;
  tarifa_hora: number;
  estacion_id?: number;
  // Bicycle specific
  numero_marchas?: number;
  tipo_freno?: string;
  // Electric scooter specific
  velocidad_maxima?: number;
  autonomia?: number;
  nivel_bateria?: number;
}

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VehicleFormData) => Promise<void>;
  stations: Array<{ id: number; nombre: string }>;
  vehicle?: any; // For edit mode
  mode: 'create' | 'edit';
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  stations,
  vehicle,
  mode
}) => {
  const [formData, setFormData] = useState<VehicleFormData>({
    tipo: 'bicycle',
    modelo: '',
    tarifa_hora: 5000,
    numero_marchas: 21,
    tipo_freno: 'Disco',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vehicle && mode === 'edit') {
      // Mapear datos del backend (camelCase inglés) a formato del formulario (snake_case español)
      const tipo = (vehicle.type || vehicle.tipo)?.toLowerCase();
      const vehicleType = tipo === 'bicycle' || tipo === 'electric_scooter'
        ? tipo
        : tipo === 'electric-scooter'
        ? 'electric-scooter'
        : 'bicycle';

      setFormData({
        tipo: vehicleType as 'bicycle' | 'electric-scooter',
        modelo: vehicle.model || vehicle.modelo || '',
        tarifa_hora: vehicle.hourlyRate || vehicle.tarifa_por_hora || vehicle.tarifa_hora || 5000,
        estacion_id: vehicle.currentStationId || vehicle.estacion_actual_id || vehicle.estacion_id,
        numero_marchas: vehicle.specifications?.gears || vehicle.numero_marchas,
        tipo_freno: vehicle.specifications?.brakeType || vehicle.tipo_freno,
        velocidad_maxima: vehicle.specifications?.maxSpeed || vehicle.velocidad_maxima,
        autonomia: vehicle.specifications?.range || vehicle.autonomia,
        nivel_bateria: vehicle.specifications?.batteryLevel || vehicle.nivel_bateria,
      });
    } else {
      // Reset for create mode
      setFormData({
        tipo: 'bicycle',
        modelo: '',
        tarifa_hora: 5000,
        numero_marchas: 21,
        tipo_freno: 'Disco',
      });
    }
  }, [vehicle, mode, isOpen]);

  const handleTypeChange = (type: 'bicycle' | 'electric-scooter') => {
    if (type === 'bicycle') {
      setFormData({
        tipo: 'bicycle',
        modelo: formData.modelo,
        tarifa_hora: formData.tarifa_hora,
        estacion_id: formData.estacion_id,
        numero_marchas: 21,
        tipo_freno: 'Disco',
      });
    } else {
      setFormData({
        tipo: 'electric-scooter',
        modelo: formData.modelo,
        tarifa_hora: formData.tarifa_hora,
        estacion_id: formData.estacion_id,
        velocidad_maxima: 25,
        autonomia: 30,
        nivel_bateria: 100,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar vehículo');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
              <Bike className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Crear Vehículo' : 'Editar Vehículo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Vehicle Type */}
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Vehículo
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleTypeChange('bicycle')}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                    formData.tipo === 'bicycle'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300'
                  }`}
                >
                  <Bike className={`h-8 w-8 ${formData.tipo === 'bicycle' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${formData.tipo === 'bicycle' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    Bicicleta
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('electric-scooter')}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                    formData.tipo === 'electric-scooter'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300'
                  }`}
                >
                  <Zap className={`h-8 w-8 ${formData.tipo === 'electric-scooter' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${formData.tipo === 'electric-scooter' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    Scooter Eléctrico
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Modelo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modelo
              </label>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                required
                minLength={2}
                maxLength={100}
                placeholder="Ej: Trek FX 3, Xiaomi Mi Scooter Pro"
              />
            </div>

            {/* Tarifa por Hora */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Tarifa por Hora (COP)
              </label>
              <input
                type="number"
                value={formData.tarifa_hora}
                onChange={(e) => setFormData({ ...formData, tarifa_hora: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                required
                min={1000}
                max={50000}
                step={500}
              />
            </div>

            {/* Estación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Estación {mode === 'create' ? '(Opcional)' : ''}
              </label>
              <select
                value={formData.estacion_id || ''}
                onChange={(e) => setFormData({ ...formData, estacion_id: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Sin asignar</option>
                {stations.map(station => (
                  <option key={station.id} value={station.id}>
                    {station.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Bicycle specific fields */}
            {formData.tipo === 'bicycle' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <SettingsIcon className="inline h-4 w-4 mr-1" />
                    Número de Marchas
                  </label>
                  <input
                    type="number"
                    value={formData.numero_marchas || 21}
                    onChange={(e) => setFormData({ ...formData, numero_marchas: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    required
                    min={1}
                    max={30}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Freno
                  </label>
                  <select
                    value={formData.tipo_freno || 'Disco'}
                    onChange={(e) => setFormData({ ...formData, tipo_freno: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="Disco">Disco</option>
                    <option value="V-Brake">V-Brake</option>
                    <option value="Hidráulico">Hidráulico</option>
                    <option value="Mecánico">Mecánico</option>
                  </select>
                </div>
              </>
            )}

            {/* Electric Scooter specific fields */}
            {formData.tipo === 'electric-scooter' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Zap className="inline h-4 w-4 mr-1" />
                    Velocidad Máxima (km/h)
                  </label>
                  <input
                    type="number"
                    value={formData.velocidad_maxima || 25}
                    onChange={(e) => setFormData({ ...formData, velocidad_maxima: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    required
                    min={10}
                    max={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Autonomía (km)
                  </label>
                  <input
                    type="number"
                    value={formData.autonomia || 30}
                    onChange={(e) => setFormData({ ...formData, autonomia: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    required
                    min={10}
                    max={100}
                  />
                </div>

                {mode === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Battery className="inline h-4 w-4 mr-1" />
                      Nivel de Batería (%)
                    </label>
                    <input
                      type="number"
                      value={formData.nivel_bateria || 100}
                      onChange={(e) => setFormData({ ...formData, nivel_bateria: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      required
                      min={0}
                      max={100}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Crear Vehículo' : 'Guardar Cambios'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
