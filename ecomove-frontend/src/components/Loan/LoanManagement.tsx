// src/components/Loan/LoanManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Bike,
  DollarSign,
  PlayCircle,
  StopCircle,
  XCircle,
  Plus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Button } from '../UI/Button';
import { userApiService, UserLoan } from '../../services/userApi.service';

interface LoanManagementProps {
  onLoanUpdate?: () => void;
}

interface StationSelectorProps {
  isOpen: boolean;
  onSelect: (stationId: string) => void;
  onClose: () => void;
  title: string;
}

// Componente para seleccionar estación
const StationSelector: React.FC<StationSelectorProps> = ({ 
  isOpen, 
  onSelect, 
  onClose, 
  title 
}) => {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadStations();
    }
  }, [isOpen]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const nearbyStations = await userApiService.getNearbyStations();
      setStations(nearbyStations);
    } catch (error) {
      console.error('Error loading stations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Cargando estaciones...</p>
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-gray-500">No hay estaciones disponibles</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stations.map((station) => (
              <button
                key={station.id}
                onClick={() => onSelect(station.id.toString())}
                className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {station.nombre}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {station.direccion}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export const LoanManagement: React.FC<LoanManagementProps> = ({ onLoanUpdate }) => {
  const [activeLoan, setActiveLoan] = useState<UserLoan | null>(null);
  const [recentLoans, setRecentLoans] = useState<UserLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showStationSelector, setShowStationSelector] = useState(false);
  const [actionType, setActionType] = useState<'complete' | 'extend'>('complete');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const [currentLoan, userLoans] = await Promise.all([
        userApiService.getCurrentLoan(),
        userApiService.getUserLoans()
      ]);
      
      setActiveLoan(currentLoan);
      setRecentLoans(userLoans?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error loading loans:', error);
      setMessage({ type: 'error', text: 'Error al cargar los préstamos' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRequest = () => {
    setActionType('complete');
    setShowStationSelector(true);
  };

  const handleExtendRequest = async () => {
    if (!activeLoan) return;
    
    const minutes = prompt('¿Cuántos minutos adicionales necesitas? (Ej: 30)');
    if (!minutes || isNaN(parseInt(minutes))) return;

    try {
      setProcessing(true);
      await userApiService.extendLoan(activeLoan.id, parseInt(minutes));
      setMessage({ type: 'success', text: '¡Préstamo extendido exitosamente!' });
      await loadLoans();
      onLoanUpdate?.();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al extender el préstamo' });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelLoan = async () => {
    if (!activeLoan) return;
    
    if (!confirm('¿Estás seguro de que quieres cancelar este préstamo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setProcessing(true);
      await userApiService.cancelLoan(activeLoan.id);
      setMessage({ type: 'success', text: 'Préstamo cancelado exitosamente' });
      await loadLoans();
      onLoanUpdate?.();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al cancelar el préstamo' });
    } finally {
      setProcessing(false);
    }
  };

  const handleStationSelect = async (stationId: string) => {
    if (!activeLoan) return;

    try {
      setProcessing(true);
      setShowStationSelector(false);

      if (actionType === 'complete') {
        await userApiService.completeLoan(activeLoan.id, stationId);
        setMessage({ type: 'success', text: '¡Préstamo completado exitosamente!' });
      }

      await loadLoans();
      onLoanUpdate?.();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al procesar la solicitud' });
    } finally {
      setProcessing(false);
    }
  };

  const formatDuration = (startDate: string): string => {
    const start = new Date(startDate);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    }
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    
    const labels = {
      active: 'Activo',
      completed: 'Completado',
      cancelled: 'Cancelado'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-48"></div>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-32"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensajes de estado */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            )}
            <p className={message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Préstamo Activo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Préstamo Activo
          </h2>
          <Button
            onClick={loadLoans}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </Button>
        </div>

        {activeLoan ? (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <Bike className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {activeLoan.transportType} • {activeLoan.transportModel}
                  </h3>
                  <p className="text-green-100 text-sm">
                    ID: {activeLoan.id}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {formatDuration(activeLoan.startDate)}
                </div>
                <div className="text-green-100 text-sm">Duración</div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-green-100 text-sm">Estación de Origen</p>
                  <p className="font-medium">{activeLoan.originStation.name}</p>
                </div>
                <div>
                  <p className="text-green-100 text-sm">Costo Actual</p>
                  <p className="font-medium">{formatCurrency(activeLoan.cost)}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleCompleteRequest}
                disabled={processing}
                className="flex-1 bg-white text-green-600 hover:bg-gray-100"
                size="sm"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Completar Viaje
              </Button>
              <Button
                onClick={handleExtendRequest}
                disabled={processing}
                variant="outline"
                className="flex-1 border-white text-white hover:bg-white hover:text-green-600"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Extender Tiempo
              </Button>
              <Button
                onClick={handleCancelLoan}
                disabled={processing}
                variant="outline"
                className="border-red-200 text-red-100 hover:bg-red-500"
                size="sm"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            {processing && (
              <div className="mt-4 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Procesando...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bike className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No tienes préstamos activos
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              ¿Listo para tu próxima aventura? Encuentra un vehículo cerca de ti.
            </p>
            <Button
              onClick={() => window.location.href = '/user/rent'}
              className="bg-green-500 hover:bg-green-600"
            >
              <Bike className="h-4 w-4 mr-2" />
              Alquilar Vehículo
            </Button>
          </div>
        )}
      </div>

      {/* Historial Reciente */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Historial Reciente
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert('Historial completo próximamente')}
          >
            Ver Todo
          </Button>
        </div>

        {recentLoans.length > 0 ? (
          <div className="space-y-4">
            {recentLoans.map((loan) => (
              <div
                key={loan.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <Bike className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {loan.transportType} • {loan.transportModel}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(loan.startDate).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(loan.cost)}
                  </div>
                  <div className="mt-1">
                    {getStatusBadge(loan.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay préstamos recientes
            </p>
          </div>
        )}
      </div>

      {/* Selector de Estación Modal */}
      <StationSelector
        isOpen={showStationSelector}
        onSelect={handleStationSelect}
        onClose={() => setShowStationSelector(false)}
        title={
          actionType === 'complete' 
            ? 'Selecciona la estación donde devuelves el vehículo'
            : 'Selecciona una estación'
        }
      />
    </div>
  );
}