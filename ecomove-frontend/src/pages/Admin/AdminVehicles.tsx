// src/pages/Admin/AdminVehicles.tsx
import React, { useState, useEffect } from 'react';
import {
  Bike,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Battery,
  Zap,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Wrench
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { VehicleFormModal, VehicleFormData } from '../../components/Admin/VehicleFormModal';
import { transportApiService, Transport } from '../../services/transportApi.service';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const AdminVehicles: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotifications();

  const [vehicles, setVehicles] = useState<Transport[]>([]);
  const [stations, setStations] = useState<Array<{ id: number; nombre: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'bicycle' | 'electric-scooter'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'in_use' | 'maintenance' | 'damaged'>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Transport | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, [currentPage, filterType, filterStatus]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load vehicles
      const filters: any = {
        pagina: currentPage,
        limite: itemsPerPage
      };

      if (filterType !== 'all') filters.tipo = filterType;
      if (filterStatus !== 'all') filters.estado = filterStatus;

      const vehiclesResponse = await transportApiService.getTransports(filters);

      if (vehiclesResponse.success && vehiclesResponse.data) {
        // El backend devuelve "transports" y "pagination"
        const data = vehiclesResponse.data;
        console.log('📦 Datos de vehículos recibidos:', data);
        console.log('📦 Primer vehículo:', data.transports?.[0] || data.transportes?.[0]);
        setVehicles(data.transports || data.transportes || []);
        setTotalPages(data.pagination?.totalPages || data.total_paginas || 1);
        setTotalVehicles(data.pagination?.total || data.total || 0);
      } else {
        console.log('⚠️ No se recibieron datos de vehículos o fallo la petición');
        setVehicles([]);
        setTotalPages(1);
        setTotalVehicles(0);
      }

      // Load stations for the form
      const stationsResponse = await fetch('/api/v1/stations');
      if (stationsResponse.ok) {
        const stationsData = await stationsResponse.json();
        console.log('🏢 Datos de estaciones recibidos:', stationsData);
        if (stationsData.success && stationsData.data) {
          // El backend devuelve "stations" en vez de data directamente
          const stationsList = stationsData.data.stations || stationsData.data;
          console.log('🏢 Lista de estaciones:', stationsList);
          setStations(stationsList.map((s: any) => ({
            id: s.id,
            // El backend devuelve "name" (camelCase inglés), no "nombre"
            nombre: s.name || s.nombre
          })));
        }
      }
    } catch (error: any) {
      showError('Error', error.message || 'No se pudieron cargar los vehículos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
      showSuccess('Actualizado', 'Lista de vehículos actualizada');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateVehicle = () => {
    setSelectedVehicle(null);
    setFormMode('create');
    setIsFormModalOpen(true);
  };

  const handleEditVehicle = (vehicle: Transport) => {
    setSelectedVehicle(vehicle);
    setFormMode('edit');
    setIsFormModalOpen(true);
  };

  const handleSaveVehicle = async (data: VehicleFormData) => {
    try {
      if (formMode === 'create') {
        // Create new vehicle
        let response;
        if (data.tipo === 'bicycle') {
          response = await transportApiService.createBicycle({
            modelo: data.modelo,
            tarifa_hora: data.tarifa_hora,
            numero_marchas: data.numero_marchas!,
            tipo_freno: data.tipo_freno!,
            estacion_id: data.estacion_id
          });
          showSuccess('Bicicleta creada', 'La bicicleta se creó correctamente');
        } else {
          response = await transportApiService.createElectricScooter({
            modelo: data.modelo,
            tarifa_hora: data.tarifa_hora,
            velocidad_maxima: data.velocidad_maxima!,
            autonomia: data.autonomia!,
            nivel_bateria: data.nivel_bateria,
            estacion_id: data.estacion_id
          });
          showSuccess('Scooter creado', 'El scooter eléctrico se creó correctamente');
        }

        // Actualización optimista: agregar el nuevo vehículo a la lista sin recargar
        if (response.success && response.data) {
          setVehicles(prev => [response.data!, ...prev]);
          setTotalVehicles(prev => prev + 1);
        }
      } else if (selectedVehicle) {
        // Update existing vehicle - El backend espera camelCase inglés
        const updateData: any = {
          model: data.modelo,
          hourlyRate: data.tarifa_hora
        };

        console.log('📝 Actualizando vehículo con datos:', updateData);
        const response = await transportApiService.updateTransport(selectedVehicle.id, updateData);

        // Si la estación cambió, usar el endpoint específico de move
        const currentStationId = selectedVehicle.currentStationId || selectedVehicle.estacion_actual_id;
        const newStationId = data.estacion_id;

        if (newStationId && newStationId !== currentStationId) {
          console.log(`🚚 Moviendo vehículo de estación ${currentStationId} a ${newStationId}`);
          await transportApiService.moveTransportToStation(selectedVehicle.id, newStationId);
        }

        // Actualización optimista: actualizar el vehículo en la lista sin recargar
        if (response.success && response.data) {
          setVehicles(prev => prev.map(v =>
            v.id === selectedVehicle.id ? response.data! : v
          ));
        }

        showSuccess('Vehículo actualizado', 'Los cambios se guardaron correctamente');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleChangeStatus = async (vehicle: Transport, newStatus: 'available' | 'maintenance' | 'damaged') => {
    try {
      // Actualización optimista: actualizar el estado en la UI inmediatamente
      setVehicles(prev => prev.map(v =>
        v.id === vehicle.id ? { ...v, status: newStatus, estado: newStatus } : v
      ));

      await transportApiService.changeTransportStatus(vehicle.id, newStatus);
      showSuccess('Estado actualizado', `El vehículo ahora está en estado: ${getStatusText(newStatus)}`);
    } catch (error: any) {
      // Si falla, revertir el cambio
      await loadData();
      showError('Error', error.message || 'No se pudo cambiar el estado');
    }
  };

  const handleMoveToStation = async (vehicle: Transport) => {
    const stationId = prompt('Ingrese el ID de la estación destino:');
    if (!stationId) return;

    try {
      // Actualización optimista
      const newStationId = Number(stationId);
      setVehicles(prev => prev.map(v =>
        v.id === vehicle.id ? { ...v, currentStationId: newStationId, estacion_actual_id: newStationId } : v
      ));

      await transportApiService.moveTransportToStation(vehicle.id, newStationId);
      showSuccess('Vehículo movido', 'El vehículo se movió a la nueva estación');
    } catch (error: any) {
      // Si falla, revertir
      await loadData();
      showError('Error', error.message || 'No se pudo mover el vehículo');
    }
  };

  const handleUpdateBattery = async (vehicle: Transport) => {
    const batteryLevel = prompt('Ingrese el nivel de batería (0-100):');
    if (!batteryLevel) return;

    try {
      // Actualización optimista
      const newBatteryLevel = Number(batteryLevel);
      setVehicles(prev => prev.map(v =>
        v.id === vehicle.id ? {
          ...v,
          specifications: { ...v.specifications, batteryLevel: newBatteryLevel },
          nivel_bateria: newBatteryLevel
        } : v
      ));

      await transportApiService.updateBatteryLevel(vehicle.id, newBatteryLevel);
      showSuccess('Batería actualizada', `Nivel de batería: ${batteryLevel}%`);
    } catch (error: any) {
      // Si falla, revertir
      await loadData();
      showError('Error', error.message || 'No se pudo actualizar la batería');
    }
  };

  const handleDeleteVehicle = async (vehicle: Transport) => {
    if (!confirm(`¿Está seguro de eliminar el vehículo ${vehicle.model || vehicle.modelo}?`)) return;

    try {
      // Actualización optimista: eliminar de la lista inmediatamente
      setVehicles(prev => prev.filter(v => v.id !== vehicle.id));
      setTotalVehicles(prev => prev - 1);

      await transportApiService.deleteTransport(vehicle.id);
      showSuccess('Vehículo eliminado', 'El vehículo se eliminó correctamente');
    } catch (error: any) {
      // Si falla, recargar para restaurar
      await loadData();
      showError('Error', error.message || 'No se pudo eliminar el vehículo');
    }
  };

  const getTypeIcon = (type: string) => {
    const normalizedType = type?.toLowerCase();
    switch (normalizedType) {
      case 'electric_scooter':
      case 'electric-scooter':
        return <Zap className="h-4 w-4 mr-1" />;
      default:
        return <Bike className="h-4 w-4 mr-1" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const normalizedType = type?.toLowerCase();
    if (normalizedType === 'electric_scooter' || normalizedType === 'electric-scooter') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          <Zap className="h-3 w-3 mr-1" />
          Scooter Eléctrico
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
        <Bike className="h-3 w-3 mr-1" />
        Bicicleta
      </span>
    );
  };

  const getStatusText = (status: string): string => {
    const normalizedStatus = status?.toLowerCase();
    const statusMap: Record<string, string> = {
      available: 'Disponible',
      in_use: 'En uso',
      maintenance: 'Mantenimiento',
      damaged: 'Dañado',
      inactive: 'Inactivo'
    };
    return statusMap[normalizedStatus] || status;
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Disponible
          </span>
        );
      case 'in_use':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
            <Settings className="h-3 w-3 mr-1 animate-spin" />
            En Uso
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            <Wrench className="h-3 w-3 mr-1" />
            Mantenimiento
          </span>
        );
      case 'damaged':
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            {normalizedStatus === 'inactive' ? 'Inactivo' : 'Dañado'}
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
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
                <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
                  <Bike className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Gestión de Vehículos
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {totalVehicles} vehículos en total
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
              <Button onClick={handleCreateVehicle}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Vehículo
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="all">Todos</option>
                <option value="bicycle">Bicicletas</option>
                <option value="electric-scooter">Scooters Eléctricos</option>
              </select>
            </div>

            <div>
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
                <option value="available">Disponible</option>
                <option value="in_use">En Uso</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="damaged">Dañado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando vehículos...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <Bike className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No hay vehículos registrados</p>
            <Button onClick={handleCreateVehicle} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Vehículo
            </Button>
          </div>
        ) : (
          <>
            {/* Vehicles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Vehicle Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${
                        (vehicle.type || vehicle.tipo) === 'electric_scooter' || (vehicle.type || vehicle.tipo) === 'ELECTRIC_SCOOTER'
                          ? 'bg-yellow-100 dark:bg-yellow-900/20'
                          : 'bg-green-100 dark:bg-green-900/20'
                      }`}>
                        {getTypeIcon(vehicle.type || vehicle.tipo)}
                        <span className={`text-2xl ${
                          (vehicle.type || vehicle.tipo) === 'electric_scooter' || (vehicle.type || vehicle.tipo) === 'ELECTRIC_SCOOTER'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {(vehicle.type || vehicle.tipo) === 'electric_scooter' || (vehicle.type || vehicle.tipo) === 'ELECTRIC_SCOOTER' ? '⚡' : '🚲'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {vehicle.model || vehicle.modelo}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {vehicle.id}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(vehicle.status || vehicle.estado)}
                  </div>

                  {/* Vehicle Type Badge */}
                  <div className="mb-4">
                    {getTypeBadge(vehicle.type || vehicle.tipo)}
                  </div>

                  {/* Vehicle Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tarifa/hora:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(vehicle.hourlyRate || vehicle.tarifa_por_hora || 0)}
                      </span>
                    </div>

                    {(vehicle.currentStationId || vehicle.estacion_actual_id) && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          Estación:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ID {vehicle.currentStationId || vehicle.estacion_actual_id}
                        </span>
                      </div>
                    )}

                    {((vehicle.specifications?.batteryLevel !== undefined) || (vehicle.nivel_bateria !== undefined)) && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                          <Battery className="h-3 w-3 mr-1" />
                          Batería:
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                (vehicle.specifications?.batteryLevel || vehicle.nivel_bateria || 0) > 50
                                  ? 'bg-green-500'
                                  : (vehicle.specifications?.batteryLevel || vehicle.nivel_bateria || 0) > 20
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${vehicle.specifications?.batteryLevel || vehicle.nivel_bateria || 0}%` }}
                            />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {vehicle.specifications?.batteryLevel || vehicle.nivel_bateria || 0}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleEditVehicle(vehicle)}
                      className="flex-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4 inline mr-1" />
                      Editar
                    </button>
                    {(vehicle.status || vehicle.estado) !== 'in_use' && (vehicle.status || vehicle.estado) !== 'IN_USE' && (
                      <button
                        onClick={() => handleDeleteVehicle(vehicle)}
                        className="flex-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 inline mr-1" />
                        Eliminar
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
      <VehicleFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveVehicle}
        stations={stations}
        vehicle={selectedVehicle}
        mode={formMode}
      />
    </div>
  );
};
