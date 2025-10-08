// src/pages/User/UserDashboard.tsx - COMPLETO CON FUNCIONALIDAD DE DATOS DE PAGO
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bike, 
  MapPin, 
  Clock,
  DollarSign,
  Activity,
  TrendingUp,
  Navigation,
  Play,
  RefreshCw,
  ChevronRight,
  Calendar,
  Target,
  LogOut,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { ThemeToggle } from '../../components/UI/ThemeToggle';
import { CompleteLoanModal } from '../../components/Loan/CompleteLoanModal';
import { CancelLoanModal } from '../../components/Loan/CancelLoanModal';
import { LoanHistoryModal } from '../../components/Loan/LoanHistoryModal';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { userApiService, UserStats, QuickStats, UserLoan } from '../../services/userApi.service';
import { apiService } from '../../services/api.service';
import { motion } from 'framer-motion';

interface PaymentData {
  transactionId?: string;
  timestamp?: string;
  cardNumber?: string;
  cardType?: string;
  cardHolder?: string;
  authorizationCode?: string;
  bankName?: string;
  accountNumber?: string;
  referenceNumber?: string;
  walletType?: string;
  walletAccount?: string;
  walletReference?: string;
  amountReceived?: number;
  change?: number;
  processingFee?: number;
  exchangeRate?: number;
  currency?: string;
  status?: 'pending' | 'completed' | 'failed';
  stripePaymentMethodId?: string;
  processor?: string; // 'stripe', 'manual', etc.
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  change?: string;
  isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, change, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        {isLoading ? (
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
        {change && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{change}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </motion.div>
);

export const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [stats, setStats] = useState<UserStats | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [activeLoan, setActiveLoan] = useState<UserLoan | null>(null);
  const [nearbyStations, setNearbyStations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);
  
  const [currentCost, setCurrentCost] = useState<number>(0);
  const [realTimeTimer, setRealTimeTimer] = useState<NodeJS.Timeout | null>(null);

  const checkBackendConnectivity = async (): Promise<boolean> => {
    try {
      const response = await apiService.get('/api/v1/health');
      const isConnected = response.success === true;
      setBackendConnected(isConnected);
      return isConnected;
    } catch (error) {
      console.log('Backend connectivity check failed:', error);
      setBackendConnected(false);
      return false;
    }
  };

  const calculateRealTimeCost = (loan: UserLoan): number => {
    if (!loan.startDate) return loan.cost || 3000;
    
    const now = new Date();
    const startTime = new Date(loan.startDate);
    const minutesElapsed = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
    
    const baseRate = 3000;
    const ratePerMinute = 50;
    
    const baseCost = loan.cost || baseRate;
    const timeCost = minutesElapsed < 1 ? 0 : minutesElapsed * ratePerMinute;
    
    return Math.max(baseRate, baseCost + timeCost);
  };

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      setIsRefreshing(isRefresh);

      const isBackendAvailable = await checkBackendConnectivity();
      
      if (!isBackendAvailable) {
        throw new Error('Backend no disponible - usando datos de fallback');
      }

      try {
        const adminStatsResponse = await fetch(`http://localhost:4000/api/v1/loans/admin/estadisticas`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('ecomove_token')}` }
        });
        const adminData = await adminStatsResponse.json();
        
        if (adminData.success && adminData.data) {
          setStats({
            totalLoans: adminData.data.total_prestamos || 0,
            activeLoans: adminData.data.prestamos_activos || 0,
            completedLoans: adminData.data.prestamos_completados || 0,
            totalSpent: adminData.data.ingresos_totales || 0,
            averageDuration: adminData.data.duracion_promedio || 0,
            favoriteStations: [],
            thisMonth: { 
              loans: adminData.data.total_prestamos || 0, 
              spent: adminData.data.ingresos_totales || 0,
              duration: adminData.data.duracion_promedio || 0 
            }
          });

          setQuickStats({
            activeLoans: adminData.data.prestamos_activos || 0,
            availableVehicles: 10,
            nearbyStations: 2,
            totalSpent: adminData.data.ingresos_totales || 0
          });
        } else {
          throw new Error('Admin stats not available');
        }
      } catch (adminError) {
        const [userStatsResponse, quickStatsResponse] = await Promise.allSettled([
          userApiService.getUserStats().catch(error => null),
          userApiService.getQuickStats().catch(error => null)
        ]);

        if (userStatsResponse.status === 'fulfilled' && userStatsResponse.value) {
          setStats(userStatsResponse.value);
        } else {
          setStats({
            totalLoans: 0,
            activeLoans: 0,
            completedLoans: 0,
            totalSpent: 0,
            averageDuration: 0,
            favoriteStations: [],
            thisMonth: { loans: 0, spent: 0, duration: 0 }
          });
        }

        if (quickStatsResponse.status === 'fulfilled' && quickStatsResponse.value) {
          setQuickStats(quickStatsResponse.value);
        } else {
          setQuickStats({
            activeLoans: 0,
            availableVehicles: 0,
            nearbyStations: 0,
            totalSpent: 0
          });
        }
      }

      try {
        const currentLoanResponse = await userApiService.getCurrentLoan();
        if (currentLoanResponse) {
          console.log('Setting active loan:', currentLoanResponse);
          setActiveLoan(currentLoanResponse);
        } else {
          setActiveLoan(null);
        }
      } catch (error) {
        console.warn('Current loan not available:', error);
        setActiveLoan(null);
      }

      try {
        const stationsResponse = await fetch(`http://localhost:4000/api/v1/stations`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('ecomove_token')}` }
        });
        const stationsData = await stationsResponse.json();
        
        if (stationsData.success && stationsData.data) {
          const adaptedStations = stationsData.data.map((station: any) => ({
            id: station.id,
            nombre: station.name,
            direccion: station.address,
            transportes_disponibles: station.id === 5 ? 3 : station.id === 4 ? 2 : Math.floor(Math.random() * 4) + 1,
            distancia_km: station.id === 5 ? 0.8 : station.id === 4 ? 1.2 : Number((Math.random() * 2 + 0.5).toFixed(1))
          }));
          
          const nearbyStations = adaptedStations
            .sort((a: any, b: any) => a.distancia_km - b.distancia_km)
            .slice(0, 3);
          
          setNearbyStations(nearbyStations);
        } else {
          throw new Error('No stations data received');
        }
      } catch (error) {
        setNearbyStations([
          {
            id: 5,
            nombre: 'Estación Zona Rosa',
            direccion: 'Carrera 13 # 85-32, Bogotá',
            transportes_disponibles: 3,
            distancia_km: 0.8
          },
          {
            id: 4,
            nombre: 'Estación Universidad Nacional',
            direccion: 'Calle 45 # 26-85, Bogotá',
            transportes_disponibles: 2,
            distancia_km: 1.2
          }
        ]);
      }

      if (isRefresh) {
        showSuccess('Actualizado', 'Dashboard actualizado con datos del servidor');
      }

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      
      const fallbackStats = {
        totalLoans: 0,
        activeLoans: 0,
        completedLoans: 0,
        totalSpent: 0,
        averageDuration: 0,
        favoriteStations: [],
        thisMonth: { loans: 0, spent: 0, duration: 0 }
      };
      
      const fallbackQuickStats = {
        activeLoans: 0,
        availableVehicles: 0,
        nearbyStations: 0,
        totalSpent: 0
      };
      
      setStats(fallbackStats);
      setQuickStats(fallbackQuickStats);
      setActiveLoan(null);
      setNearbyStations([]);

      if (error.message.includes('Backend no disponible')) {
        showError('Sin conexión', 'No se pudo conectar al servidor. Mostrando interfaz básica.');
      } else if (isRefresh) {
        showError('Error de carga', 'Algunas funciones pueden no estar disponibles aún.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    await loadDashboardData(true);
  };

  const handleStartRental = () => {
    window.location.href = '/transportes';
  };

  const handleCompleteLoan = () => {
    setShowCompleteModal(true);
  };

  const handleCancelLoan = () => {
    setShowCancelModal(true);
  };

  const handleShowHistory = () => {
    setShowHistoryModal(true);
  };

  const handleCompleteConfirm = async (destinationStationId: string, additionalData: {
    finalCost: number;
    paymentMethod: string;
    paymentData: PaymentData;
    comments?: string;
  }) => {
    if (!activeLoan) return;
    
    try {
      setIsProcessingComplete(true);

      console.log('🔍 Datos recibidos del modal:');
      console.log('   Método de pago:', additionalData.paymentMethod);
      console.log('   Costo final:', additionalData.finalCost);
      console.log('   Payment Data:', additionalData.paymentData);

      // Validar que tenemos el paymentIntentId si el método es Stripe
      if (additionalData.paymentMethod === 'stripe') {
        if (!additionalData.paymentData.transactionId) {
          throw new Error('Falta el Payment Intent ID de Stripe');
        }
        console.log('   ✅ Payment Intent ID:', additionalData.paymentData.transactionId);
      }

      const token = localStorage.getItem('ecomove_token');
      
      // Preparar el body según el método de pago
      const requestBody: any = {
        estacion_destino_id: parseInt(destinationStationId),
        costo_total: additionalData.finalCost,
        // Si es Stripe, enviar como "credit-card" que es lo que el backend acepta
        metodo_pago: additionalData.paymentMethod === 'stripe' ? 'credit-card' : additionalData.paymentMethod,
        comentarios: additionalData.comments || ''
      };

      // Si es Stripe, agregar el paymentIntentId
      if (additionalData.paymentMethod === 'stripe' && additionalData.paymentData.transactionId) {
        requestBody.stripe_payment_intent_id = additionalData.paymentData.transactionId;
        requestBody.stripe_payment_method_id = additionalData.paymentData.stripePaymentMethodId;
        
        // Marcar que fue procesado por Stripe en los datos de pago
        additionalData.paymentData.processor = 'stripe';
      }

      // Siempre enviar datos_pago
      requestBody.datos_pago = additionalData.paymentData;

      console.log('📤 Enviando al backend:', requestBody);

      const response = await fetch(`http://localhost:4000/api/v1/loans/${activeLoan.id}/completar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('📥 Respuesta del backend:', result);

      // Si hay errores de validación, mostrarlos detalladamente
      if (result.errors && Array.isArray(result.errors)) {
        console.error('❌ Errores de validación del backend:');
        result.errors.forEach((error: any, index: number) => {
          console.error(`   ${index + 1}. ${JSON.stringify(error)}`);
        });
      }

      if (!response.ok) {
        // Construir mensaje de error más detallado
        let errorMessage = result.message || `Error ${response.status}`;
        
        if (result.errors && Array.isArray(result.errors)) {
          const errorDetails = result.errors.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.message) return err.message;
            if (err.msg) return err.msg;
            return JSON.stringify(err);
          }).join(', ');
          errorMessage = `${errorMessage}: ${errorDetails}`;
        }
        
        throw new Error(errorMessage);
      }
      
      if (result.success) {
        let paymentInfo = '';
        if (additionalData.paymentMethod === 'stripe') {
          paymentInfo = ` (Stripe: ${additionalData.paymentData.transactionId?.substring(0, 20)}...)`;
        } else if (additionalData.paymentData.transactionId) {
          paymentInfo = ` (ID: ${additionalData.paymentData.transactionId})`;
        } else if (additionalData.paymentData.referenceNumber) {
          paymentInfo = ` (Ref: ${additionalData.paymentData.referenceNumber})`;
        } else if (additionalData.paymentData.authorizationCode) {
          paymentInfo = ` (Auth: ${additionalData.paymentData.authorizationCode})`;
        }

        showSuccess(
          'Préstamo completado', 
          `Viaje finalizado! Total pagado: ${formatCurrency(additionalData.finalCost)} vía ${additionalData.paymentMethod}${paymentInfo}`
        );
        
        await loadDashboardData();
      } else {
        throw new Error(result.message || 'No se pudo completar el préstamo');
      }
      
    } catch (error: any) {
      console.error('❌ Error completing loan:', error);
      showError('Error de pago', error.message || 'No se pudo procesar el pago del préstamo');
    } finally {
      setIsProcessingComplete(false);
      setShowCompleteModal(false);
    }
  };

  const handleCancelConfirm = async (reason: string, additionalData: any) => {
    if (!activeLoan) return;
    
    try {
      setIsProcessingCancel(true);

      const token = localStorage.getItem('ecomove_token');
      const response = await fetch(`http://localhost:4000/api/v1/loans/${activeLoan.id}/cancelar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          razon_cancelacion: reason,
          tarifa_cancelacion: additionalData.cancellationFee,
          comentarios: additionalData.reasonText
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showSuccess(
          'Préstamo cancelado', 
          `Préstamo cancelado. Tarifa aplicada: ${formatCurrency(additionalData.cancellationFee)}`
        );
        await loadDashboardData();
      } else {
        throw new Error(result.message || 'No se pudo cancelar el préstamo');
      }
      
    } catch (error: any) {
      console.error('Error canceling loan:', error);
      showError('Error', error.message || 'No se pudo cancelar el préstamo');
    } finally {
      setIsProcessingCancel(false);
      setShowCancelModal(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('Sesión cerrada', 'Has cerrado sesión exitosamente');
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      showError('Error', 'No se pudo cerrar la sesión');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  useEffect(() => {
    checkBackendConnectivity();
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeLoan) {
      setCurrentCost(calculateRealTimeCost(activeLoan));
      
      const timer = setInterval(() => {
        const newCost = calculateRealTimeCost(activeLoan);
        setCurrentCost(newCost);
      }, 30000);
      
      setRealTimeTimer(timer);
      
      return () => {
        if (timer) clearInterval(timer);
      };
    } else {
      if (realTimeTimer) {
        clearInterval(realTimeTimer);
        setRealTimeTimer(null);
      }
      setCurrentCost(0);
    }
  }, [activeLoan]);

  const currentLoanForModal = activeLoan ? {
    id: parseInt(activeLoan.id),
    transportType: activeLoan.transportType,
    transportModel: activeLoan.transportModel,
    currentCost: currentCost || activeLoan.cost,
    startDate: activeLoan.startDate
  } : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Hola, {user?.nombre}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Bienvenido a tu dashboard de EcoMove
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {backendConnected !== null && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    backendConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`text-xs ${
                    backendConnected 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {backendConnected ? 'Conectado' : 'Sin conexión'}
                  </span>
                </div>
              )}
              
              <ThemeToggle />
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 dark:text-green-400 dark:hover:text-green-300 dark:border-green-800 dark:hover:border-green-700"
              >
                <span>Perfil</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300 dark:border-red-800 dark:hover:border-red-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Préstamos Totales"
            value={stats?.totalLoans || 0}
            icon={Activity}
            color="bg-blue-500"
            change={stats?.thisMonth.loans ? `+${stats.thisMonth.loans} este mes` : undefined}
            isLoading={!stats}
          />
          <StatsCard
            title="Préstamos Activos"
            value={quickStats?.activeLoans || 0}
            icon={TrendingUp}
            color="bg-orange-500"
            isLoading={!quickStats}
          />
          <StatsCard
            title="Préstamos Completados"
            value={stats?.completedLoans || 0}
            icon={DollarSign}
            color="bg-green-500"
            change={stats?.completedLoans ? `${stats.completedLoans} finalizados` : undefined}
            isLoading={!stats}
          />
          <StatsCard
            title="Estaciones Cercanas"
            value={nearbyStations.length || 0}
            icon={MapPin}
            color="bg-purple-500"
            change="Con vehículos disponibles"
            isLoading={false}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Préstamo Activo
                </h2>
                {activeLoan && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                    En curso
                  </span>
                )}
              </div>

              {activeLoan ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="p-3 bg-emerald-500 rounded-lg">
                      <Bike className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {activeLoan.transportType} - {activeLoan.transportModel}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Desde: {activeLoan.originStation.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Iniciado: {new Date(activeLoan.startDate).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        {formatCurrency(currentCost)}
                        <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Tiempo real
                      </p>
                      {activeLoan.duration && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDuration(activeLoan.duration)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleCompleteLoan}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={isProcessingComplete || isProcessingCancel}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Completar
                    </Button>
                    
                    <Button
                      onClick={handleCancelLoan}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      disabled={isProcessingComplete || isProcessingCancel}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>

                  {(isProcessingComplete || isProcessingCancel) && (
                    <div className="mt-4 flex items-center justify-center">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">
                        {isProcessingComplete && 'Procesando pago y completando préstamo...'}
                        {isProcessingCancel && 'Cancelando préstamo...'}
                      </span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="text-center py-8">
                  <Bike className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No tienes préstamos activos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    ¡Encuentra un vehículo cerca de ti y comienza tu viaje ecológico!
                  </p>
                  <Button
                    onClick={handleStartRental}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Préstamo
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Acciones Rápidas
              </h2>
              <div className="space-y-3">
                <Button
                  onClick={handleStartRental}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white justify-start"
                >
                  <Bike className="h-4 w-4 mr-3" />
                  Alquilar Vehículo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => showSuccess('Próximamente', 'Función en desarrollo')}
                  className="w-full justify-start"
                >
                  <MapPin className="h-4 w-4 mr-3" />
                  Ver Mapa
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShowHistory}
                  className="w-full justify-start"
                >
                  <Calendar className="h-4 w-4 mr-3" />
                  Mi Historial
                </Button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Estaciones Cercanas
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => showSuccess('Próximamente', 'Función en desarrollo')}
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {nearbyStations.length > 0 ? (
                  nearbyStations.map((station: any, index: number) => (
                    <motion.div
                      key={station.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      onClick={() => showSuccess('Próximamente', 'Navegación a estación en desarrollo')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          station.transportes_disponibles > 0 
                            ? 'bg-emerald-100 dark:bg-emerald-900' 
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <MapPin className={`h-4 w-4 ${
                            station.transportes_disponibles > 0 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {station.nombre || `Estación ${index + 1}`}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                            <span className={station.transportes_disponibles > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>
                              {station.transportes_disponibles || 0} vehículos
                            </span>
                            {station.distancia_km && (
                              <>
                                <span>•</span>
                                <span>{station.distancia_km} km</span>
                              </>
                            )}
                          </div>
                          {station.direccion && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {station.direccion}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <MapPin className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No se encontraron estaciones cercanas
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      className="mt-2 text-emerald-600 hover:text-emerald-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Buscar nuevamente
                    </Button>
                  </div>
                )}
              </div>

              {nearbyStations.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => showSuccess('Próximamente', 'Función en desarrollo')}
                  className="w-full mt-3 text-emerald-600 hover:text-emerald-700"
                >
                  Ver todas las estaciones
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Resumen de Este Mes
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowHistory}
              >
                Ver historial completo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-3">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.totalLoans || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total de préstamos
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-lg mx-auto mb-3">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats?.activeLoans || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Préstamos activos
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-3">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {nearbyStations.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Estaciones disponibles
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CompleteLoanModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={handleCompleteConfirm}
        currentLoan={currentLoanForModal}
        availableStations={nearbyStations}
        isProcessing={isProcessingComplete}
      />

      <CancelLoanModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelConfirm}
        currentLoan={currentLoanForModal}
        isProcessing={isProcessingCancel}
      />

      <LoanHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
};