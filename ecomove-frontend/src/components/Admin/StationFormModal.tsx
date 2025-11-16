// src/components/Admin/StationFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save, MapPin, Navigation } from 'lucide-react';
import { Button } from '../UI/Button';

export interface StationFormData {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  capacidad_maxima: number;
}

interface StationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: StationFormData) => Promise<void>;
  station?: any; // For edit mode
  mode: 'create' | 'edit';
}

export const StationFormModal: React.FC<StationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  station,
  mode
}) => {
  const [formData, setFormData] = useState<StationFormData>({
    nombre: '',
    direccion: '',
    latitud: 4.6097,
    longitud: -74.0817,
    capacidad_maxima: 20
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (station && mode === 'edit') {
      // Mapear datos del backend (camelCase inglés) a formato del formulario (snake_case español)
      setFormData({
        nombre: station.name || station.nombre || '',
        direccion: station.address || station.direccion || '',
        latitud: station.coordinate?.latitude || station.latitud || 4.6097,
        longitud: station.coordinate?.longitude || station.longitud || -74.0817,
        capacidad_maxima: station.maxCapacity || station.capacidad || station.capacidad_maxima || 20
      });
    } else {
      // Reset for create mode
      setFormData({
        nombre: '',
        direccion: '',
        latitud: 4.6097,
        longitud: -74.0817,
        capacidad_maxima: 20
      });
    }
  }, [station, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar estación');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitud: position.coords.latitude,
            longitud: position.coords.longitude
          });
        },
        (error) => {
          setError('No se pudo obtener la ubicación actual');
        }
      );
    } else {
      setError('Geolocalización no disponible en este navegador');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
              <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Crear Estación' : 'Editar Estación'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de la Estación
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                required
                minLength={2}
                maxLength={100}
                placeholder="Ej: Estación Parque Central"
              />
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                required
                minLength={5}
                maxLength={200}
                placeholder="Ej: Calle 123 # 45-67"
              />
            </div>

            {/* Latitud */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Latitud
              </label>
              <input
                type="number"
                value={formData.latitud}
                onChange={(e) => setFormData({ ...formData, latitud: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                required
                step="0.000001"
                min={-90}
                max={90}
              />
            </div>

            {/* Longitud */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Longitud
              </label>
              <input
                type="number"
                value={formData.longitud}
                onChange={(e) => setFormData({ ...formData, longitud: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                required
                step="0.000001"
                min={-180}
                max={180}
              />
            </div>

            {/* Get Current Location Button */}
            <div className="md:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGetCurrentLocation}
                className="w-full"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Usar Mi Ubicación Actual
              </Button>
            </div>

            {/* Capacidad Máxima */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Capacidad Máxima
              </label>
              <input
                type="number"
                value={formData.capacidad_maxima}
                onChange={(e) => setFormData({ ...formData, capacidad_maxima: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                required
                min={1}
                max={100}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Número máximo de vehículos que puede albergar la estación (1-100)
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Vista Previa de Ubicación
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>
                <strong>Coordenadas:</strong> {formData.latitud.toFixed(6)}, {formData.longitud.toFixed(6)}
              </p>
              <p className="text-xs">
                Verifica que las coordenadas sean correctas antes de guardar
              </p>
            </div>
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
                  {mode === 'create' ? 'Crear Estación' : 'Guardar Cambios'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
