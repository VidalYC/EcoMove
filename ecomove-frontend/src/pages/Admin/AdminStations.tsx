// src/pages/Admin/AdminStations.tsx
import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Edit,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  Wrench,
  Navigation,
  Users
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { StationFormModal, StationFormData } from '../../components/Admin/StationFormModal';
import { stationApiService, StationWithStats } from '../../services/stationApi.service';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const AdminStations: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotifications();

  const [stations, setStations] = useState<StationWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStations, setTotalStations] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'maintenance'>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<StationWithStats | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    loadStations();
  }, [currentPage, filterStatus]);

  const loadStations = async () => {
    try {
      setIsLoading(true);

      const filters: any = {
        pagina: currentPage,
        limite: itemsPerPage
      };

      if (filterStatus !== 'all') filters.estado = filterStatus;

      const response = await stationApiService.getStations(filters);

      if (response.success) {
        // El backend puede devolver:
        // 1. data como array directo + pagination separado
        // 2. data.estaciones + data.pagination
        // 3. data.stations + data.pagination
        console.log('🏢 Datos de estaciones recibidos:', response.data);
        console.log('🏢 Pagination:', response.pagination);

        const stations = Array.isArray(response.data)
          ? response.data
          : (response.data?.stations || response.data?.estaciones || []);

        const pagination = response.pagination || response.data?.pagination;

        console.log('🏢 Estaciones procesadas:', stations);
        console.log('🏢 Primera estación:', stations[0]);

        setStations(stations);
        setTotalPages(pagination?.totalPages || pagination?.total_paginas || 1);
        setTotalStations(pagination?.total || 0);
      } else {
        console.log('⚠️ No se recibieron datos de estaciones o fallo la petición');
        setStations([]);
        setTotalPages(1);
        setTotalStations(0);
      }
    } catch (error: any) {
      showError('Error', error.message || 'No se pudieron cargar las estaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadStations();
      showSuccess('Actualizado', 'Lista de estaciones actualizada');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateStation = () => {
    setSelectedStation(null);
    setFormMode('create');
    setIsFormModalOpen(true);
  };

  const handleEditStation = (station: StationWithStats) => {
    setSelectedStation(station);
    setFormMode('edit');
    setIsFormModalOpen(true);
  };

  const handleSaveStation = async (data: StationFormData) => {
    try {
      if (formMode === 'create') {
        // El backend espera camelCase inglés
        const response = await stationApiService.createStation({
          name: data.nombre,
          address: data.direccion,
          latitude: data.latitud,
          longitude: data.longitud,
          maxCapacity: data.capacidad_maxima
        });
        showSuccess('Estación creada', 'La estación se creó correctamente');

        // Actualización optimista: agregar la nueva estación
        if (response.success && response.data) {
          setStations(prev => [response.data!, ...prev]);
          setTotalStations(prev => prev + 1);
        }
      } else if (selectedStation) {
        // El backend espera camelCase inglés
        const response = await stationApiService.updateStation(selectedStation.id, {
          name: data.nombre,
          address: data.direccion,
          latitude: data.latitud,
          longitude: data.longitud,
          maxCapacity: data.capacidad_maxima
        });
        showSuccess('Estación actualizada', 'Los cambios se guardaron correctamente');

        // Actualización optimista: actualizar la estación en la lista
        if (response.success && response.data) {
          setStations(prev => prev.map(s =>
            s.id === selectedStation.id ? response.data! : s
          ));
        }
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleActivateStation = async (station: StationWithStats) => {
    try {
      // Actualización optimista
      setStations(prev => prev.map(s =>
        s.id === station.id ? { ...s, isActive: true, estado: 'active' } : s
      ));

      await stationApiService.activateStation(station.id);
      showSuccess('Estación activada', `${station.name || station.nombre} ha sido activada`);
    } catch (error: any) {
      // Si falla, revertir
      await loadStations();
      showError('Error', error.message || 'No se pudo activar la estación');
    }
  };

  const handleDeactivateStation = async (station: StationWithStats) => {
    if (!confirm(`¿Está seguro de desactivar ${station.name || station.nombre}?`)) return;

    try {
      // Actualización optimista
      setStations(prev => prev.map(s =>
        s.id === station.id ? { ...s, isActive: false, estado: 'inactive' } : s
      ));

      await stationApiService.deactivateStation(station.id);
      showSuccess('Estación desactivada', `${station.name || station.nombre} ha sido desactivada`);
    } catch (error: any) {
      // Si falla, revertir
      await loadStations();
      showError('Error', error.message || 'No se pudo desactivar la estación');
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Activa
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Inactiva
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            <Wrench className="h-3 w-3 mr-1" />
            Mantenimiento
          </span>
        );
      default:
        return null;
    }
  };

  const getOccupancyColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-red-600 dark:text-red-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Gestión de Estaciones
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {totalStations} estaciones en total
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button onClick={handleCreateStation}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Estación
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="all">Todos</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
              <option value="maintenance">En Mantenimiento</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando estaciones...</p>
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No hay estaciones registradas</p>
            <Button onClick={handleCreateStation} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Estación
            </Button>
          </div>
        ) : (
          <>
            {/* Stations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stations.map((station, index) => (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Station Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
                        <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {station.name || station.nombre}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {station.id}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(station.estado || (station.isActive ? 'active' : 'inactive'))}
                  </div>

                  {/* Station Details */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                        <Navigation className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        {station.address || station.direccion}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Coordenadas:</span>
                      <span className="font-mono text-xs text-gray-900 dark:text-white">
                        {(station.coordinate?.latitude || station.latitud || 0).toFixed(4)}, {(station.coordinate?.longitude || station.longitud || 0).toFixed(4)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Capacidad:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {station.maxCapacity || station.capacidad || 0} espacios
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Ocupación:
                      </span>
                      <span className={`font-semibold ${getOccupancyColor(station.occupancyPercentage || station.ocupacion_porcentaje || 0)}`}>
                        {(station.occupancyPercentage || station.ocupacion_porcentaje || 0).toFixed(0)}%
                      </span>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Disponibles:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {station.availableTransports || station.transportes_disponibles || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {station.totalTransports || station.transportes_totales || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleEditStation(station)}
                      className="flex-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4 inline mr-1" />
                      Editar
                    </button>
                    {(station.estado === 'active' || station.isActive === true) ? (
                      <button
                        onClick={() => handleDeactivateStation(station)}
                        className="flex-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                        title="Desactivar"
                      >
                        <XCircle className="h-4 w-4 inline mr-1" />
                        Desactivar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivateStation(station)}
                        className="flex-1 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                        title="Activar"
                      >
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Activar
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      <StationFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveStation}
        station={selectedStation}
        mode={formMode}
      />
    </div>
  );
};
