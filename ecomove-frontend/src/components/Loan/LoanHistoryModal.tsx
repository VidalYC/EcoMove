// src/components/Loan/LoanHistoryModal.tsx - SIN ICONOS
import React, { useState, useEffect } from 'react';
import { Button } from '../../components/UI/Button';
import { useNotifications } from '../../contexts/NotificationContext';
import { loanApiService, LoanWithDetails } from '../../services/loanApi.service';
import { motion, AnimatePresence } from 'framer-motion';

interface LoanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LoanFilters {
  status?: 'active' | 'completed' | 'cancelled' | 'overdue' | '';
  searchTerm?: string;
  paymentMethod?: 'credit_card' | 'debit_card' | 'cash' | 'wallet' | '';
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface LoanWithPayment extends LoanWithDetails {
  metodo_pago?: string;
  datos_pago?: {
    cardNumber?: string;
    cardType?: string;
    transactionId?: string;
    referenceNumber?: string;
    authorizationCode?: string;
    walletNumber?: string;
    walletType?: string;
    amountReceived?: number;
    change?: number;
    nearestStation?: string;
  };
}

export const LoanHistoryModal: React.FC<LoanHistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const { showSuccess, showError } = useNotifications();
  
  const [loans, setLoans] = useState<LoanWithPayment[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<LoanWithPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [filters, setFilters] = useState<LoanFilters>({
    status: '',
    searchTerm: '',
    paymentMethod: ''
  });
  
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 8
  });
  
  const [selectedLoan, setSelectedLoan] = useState<LoanWithPayment | null>(null);
  const [showLoanDetail, setShowLoanDetail] = useState(false);

  const loadLoanHistory = async (page: number = 1, isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      setIsRefreshing(isRefresh);

      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const response = await loanApiService.getUserLoanHistory(userId, page, pagination.itemsPerPage);
      
      if (response.success && response.data) {
        const uniqueLoans = response.data.prestamos || [];
        const seenIds = new Set();
        const filteredUniqueLoans = uniqueLoans.filter(loan => {
          if (seenIds.has(loan.id)) {
            return false;
          }
          seenIds.add(loan.id);
          return true;
        });

        setLoans(filteredUniqueLoans);
        setPagination({
          currentPage: response.data.pagina_actual || 1,
          totalPages: response.data.total_paginas || 1,
          totalItems: response.data.total || 0,
          itemsPerPage: pagination.itemsPerPage
        });

        if (isRefresh) {
          showSuccess('Actualizado', 'Historial actualizado');
        }
      } else {
        throw new Error(response.message || 'Error al cargar historial');
      }
    } catch (error: any) {
      console.error('Error loading loan history:', error);
      showError('Error', 'No se pudo cargar el historial');
      
      setLoans([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: pagination.itemsPerPage
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...loans];

    if (filters.status) {
      filtered = filtered.filter(loan => loan.estado === filters.status);
    }

    if (filters.paymentMethod) {
      filtered = filtered.filter(loan => loan.metodo_pago === filters.paymentMethod);
    }

    if (filters.searchTerm && filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(loan => 
        loan.transporte_tipo?.toLowerCase().includes(term) ||
        loan.transporte_modelo?.toLowerCase().includes(term) ||
        loan.estacion_origen_nombre?.toLowerCase().includes(term) ||
        loan.estacion_destino_nombre?.toLowerCase().includes(term) ||
        loan.codigo_prestamo?.toLowerCase().includes(term) ||
        loan.metodo_pago?.toLowerCase().includes(term)
      );
    }

    const seenIds = new Set();
    const uniqueFiltered = filtered.filter(loan => {
      if (seenIds.has(loan.id)) {
        return false;
      }
      seenIds.add(loan.id);
      return true;
    });

    setFilteredLoans(uniqueFiltered);
  };

  const handleFilterChange = (key: keyof LoanFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      searchTerm: '',
      paymentMethod: ''
    });
  };

  const getCurrentUserId = (): number | null => {
    try {
      const userString = localStorage.getItem('ecomove_user');
      if (!userString) return null;
      
      const user = JSON.parse(userString);
      return user.id || null;
    } catch {
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

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'overdue':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'active': return 'Activo';
      case 'cancelled': return 'Cancelado';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  const getPaymentText = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'credit_card': return 'Tarjeta de Crédito';
      case 'debit_card': return 'Tarjeta de Débito';
      case 'cash': return 'Efectivo';
      case 'wallet': return 'Billetera Digital';
      case 'bank_transfer': return 'Transferencia';
      default: return method || 'No especificado';
    }
  };

  const getPaymentColor = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'credit_card':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'debit_card':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'cash':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'wallet':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'bank_transfer':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatPaymentDetails = (loan: LoanWithPayment): string => {
    if (!loan.datos_pago) return '';
    
    const data = loan.datos_pago;
    
    switch (loan.metodo_pago?.toLowerCase()) {
      case 'credit_card':
      case 'debit_card':
        if (data.cardNumber) {
          return `**** ${data.cardNumber.slice(-4)}`;
        }
        if (data.authorizationCode) {
          return `Auth: ${data.authorizationCode}`;
        }
        break;
      case 'cash':
        if (data.nearestStation) {
          return `En ${data.nearestStation}`;
        }
        return 'Pago en estación';
      case 'wallet':
        if (data.walletNumber) {
          return `${data.walletNumber}`;
        }
        if (data.walletType) {
          return data.walletType;
        }
        break;
    }
    
    if (data.transactionId) {
      return `ID: ${data.transactionId}`;
    }
    if (data.referenceNumber) {
      return `Ref: ${data.referenceNumber}`;
    }
    
    return '';
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadLoanHistory(newPage);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoans([]);
      setFilteredLoans([]);
      setFilters({ status: '', searchTerm: '', paymentMethod: '' });
      loadLoanHistory(1);
    }
  }, [isOpen]);

  useEffect(() => {
    applyFilters();
  }, [loans, filters]);

  const hasActiveFilters = filters.status || (filters.searchTerm && filters.searchTerm.trim()) || filters.paymentMethod;
  const displayedLoans = hasActiveFilters ? filteredLoans : loans;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl mx-auto shadow-2xl border border-gray-200 dark:border-gray-700 my-8"
            style={{ maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Mi Historial de Préstamos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pagination.totalItems} préstamos realizados
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadLoanHistory(pagination.currentPage, true)}
                  disabled={isRefreshing}
                  className="flex items-center space-x-1"
                >
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Cargando historial...</p>
                </div>
              ) : (
                <>
                  {/* Filtros */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Buscar préstamos..."
                          value={filters.searchTerm}
                          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                          className="w-full pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Todos los estados</option>
                        <option value="active">Activo</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                        <option value="overdue">Vencido</option>
                      </select>

                      <select
                        value={filters.paymentMethod}
                        onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Todos los pagos</option>
                        <option value="credit_card">Tarjeta de Crédito</option>
                        <option value="debit_card">Tarjeta de Débito</option>
                        <option value="cash">Efectivo</option>
                        <option value="wallet">Billetera Digital</option>
                      </select>

                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="text-gray-600 dark:text-gray-400"
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Lista de préstamos */}
                  {displayedLoans.length > 0 ? (
                    <div className="space-y-3">
                      {displayedLoans.map((loan, index) => (
                        <motion.div
                          key={`${loan.id}-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                  {loan.transporte_tipo} - {loan.transporte_modelo}
                                </h4>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(loan.estado)}`}>
                                  {getStatusText(loan.estado)}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                                <span>{formatDate(loan.fecha_inicio)}</span>
                                <span>•</span>
                                <span className="truncate">{loan.estacion_origen_nombre || 'Origen no especificado'}</span>
                                {loan.duracion_real && (
                                  <>
                                    <span>•</span>
                                    <span>{formatDuration(loan.duracion_real)}</span>
                                  </>
                                )}
                              </div>
                              
                              {loan.metodo_pago && (
                                <div className="flex items-center space-x-2 mt-2">
                                  <div className="flex items-center space-x-1">
                                    <span className={`px-2 py-0.5 rounded text-xs ${getPaymentColor(loan.metodo_pago)}`}>
                                      {getPaymentText(loan.metodo_pago)}
                                    </span>
                                  </div>
                                  {formatPaymentDetails(loan) && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatPaymentDetails(loan)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-white">
                                {formatCurrency(loan.costo_total || 0)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                #{loan.codigo_prestamo}
                              </p>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedLoan(loan);
                                setShowLoanDetail(true);
                              }}
                              className="flex items-center space-x-1 px-2 py-1"
                            >
                              <span className="hidden sm:inline text-xs">Ver</span>
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {hasActiveFilters ? 'No se encontraron préstamos' : 'Aún no tienes préstamos'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {hasActiveFilters 
                          ? 'Intenta ajustar los filtros de búsqueda'
                          : '¡Realiza tu primer viaje con EcoMove!'
                        }
                      </p>
                    </div>
                  )}

                  {/* Paginación */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Página {pagination.currentPage} de {pagination.totalPages}
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Modal de detalle */}
          <AnimatePresence>
            {showLoanDetail && selectedLoan && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-60"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Detalle del Préstamo
                    </h3>
                    <button
                      onClick={() => setShowLoanDetail(false)}
                      className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Código:</span>
                      <span className="text-gray-900 dark:text-white font-mono">
                        {selectedLoan.codigo_prestamo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Vehículo:</span>
                      <span className="text-gray-900 dark:text-white">
                        {selectedLoan.transporte_tipo} - {selectedLoan.transporte_modelo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Estado:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedLoan.estado)}`}>
                        {getStatusText(selectedLoan.estado)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Origen:</span>
                      <span className="text-gray-900 dark:text-white">
                        {selectedLoan.estacion_origen_nombre || 'No especificada'}
                      </span>
                    </div>
                    {selectedLoan.estacion_destino_nombre && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Destino:</span>
                        <span className="text-gray-900 dark:text-white">
                          {selectedLoan.estacion_destino_nombre}
                        </span>
                      </div>
                    )}
                    
                    {selectedLoan.metodo_pago && (
                      <>
                        <div className="border-t pt-3 mt-3">
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Método de pago:</span>
                            <span className="text-gray-900 dark:text-white">
                              {getPaymentText(selectedLoan.metodo_pago)}
                            </span>
                          </div>
                          
                          {selectedLoan.datos_pago && (
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mt-2">
                              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Detalles del pago:
                              </h5>
                              <div className="space-y-1 text-xs">
                                {(selectedLoan.metodo_pago === 'credit_card' || selectedLoan.metodo_pago === 'debit_card') && (
                                  <>
                                    {selectedLoan.datos_pago.cardNumber && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Tarjeta:</span>
                                        <span className="text-gray-700 dark:text-gray-300 font-mono">
                                          **** **** **** {selectedLoan.datos_pago.cardNumber.slice(-4)}
                                        </span>
                                      </div>
                                    )}
                                    {selectedLoan.datos_pago.cardType && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Tipo:</span>
                                        <span className="text-gray-700 dark:text-gray-300 uppercase">
                                          {selectedLoan.datos_pago.cardType}
                                        </span>
                                      </div>
                                    )}
                                    {selectedLoan.datos_pago.authorizationCode && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Autorización:</span>
                                        <span className="text-gray-700 dark:text-gray-300 font-mono">
                                          {selectedLoan.datos_pago.authorizationCode}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {selectedLoan.metodo_pago === 'cash' && (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Ubicación:</span>
                                      <span className="text-gray-700 dark:text-gray-300">
                                        {selectedLoan.datos_pago.nearestStation || 'Estación física'}
                                      </span>
                                    </div>
                                    {selectedLoan.datos_pago.amountReceived && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Recibido:</span>
                                        <span className="text-gray-700 dark:text-gray-300">
                                          {formatCurrency(selectedLoan.datos_pago.amountReceived)}
                                        </span>
                                      </div>
                                    )}
                                    {selectedLoan.datos_pago.change && selectedLoan.datos_pago.change > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Cambio:</span>
                                        <span className="text-gray-700 dark:text-gray-300">
                                          {formatCurrency(selectedLoan.datos_pago.change)}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {selectedLoan.metodo_pago === 'wallet' && (
                                  <>
                                    {selectedLoan.datos_pago.walletNumber && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Número:</span>
                                        <span className="text-gray-700 dark:text-gray-300">
                                          {selectedLoan.datos_pago.walletNumber}
                                        </span>
                                      </div>
                                    )}
                                    {selectedLoan.datos_pago.walletType && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Proveedor:</span>
                                        <span className="text-gray-700 dark:text-gray-300">
                                          {selectedLoan.datos_pago.walletType}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {selectedLoan.datos_pago.transactionId && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">ID Transacción:</span>
                                    <span className="text-gray-700 dark:text-gray-300 font-mono">
                                      {selectedLoan.datos_pago.transactionId}
                                    </span>
                                  </div>
                                )}
                                {selectedLoan.datos_pago.referenceNumber && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Referencia:</span>
                                    <span className="text-gray-700 dark:text-gray-300 font-mono">
                                      {selectedLoan.datos_pago.referenceNumber}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    <div className="flex justify-between border-t pt-3 mt-3">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Total:</span>
                      <span className="text-gray-900 dark:text-white font-bold">
                        {formatCurrency(selectedLoan.costo_total || 0)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowLoanDetail(false)}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    Cerrar
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};