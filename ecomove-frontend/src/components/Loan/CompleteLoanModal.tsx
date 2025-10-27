// src/components/Loan/CompleteLoanModal.tsx - CORREGIDO CON DEBUG
import React, { useState, useEffect } from 'react';
import { X, MapPin, DollarSign, CheckCircle2, AlertCircle, CreditCard, Banknote, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentMethodModal, PaymentData } from './PaymentMethodModal';

interface CompleteLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (destinationStationId: string, additionalData: {
    finalCost: number;
    paymentMethod: string;
    paymentData: PaymentData;
    comments?: string;
  }) => void;
  currentLoan: {
    id: number;
    transportType: string;
    transportModel: string;
    currentCost: number;
    startDate: string;
  } | null;
  availableStations: any[];
  isProcessing?: boolean;
}

export const CompleteLoanModal: React.FC<CompleteLoanModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentLoan,
  availableStations,
  isProcessing = false
}) => {
  const [destinationStationId, setDestinationStationId] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'stripe'>('stripe');
  const [comments, setComments] = useState<string>('');
  const [finalCost, setFinalCost] = useState<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen && currentLoan) {
      setDestinationStationId('');
      setSelectedPaymentMethod('stripe');
      setComments('');
      setFinalCost(currentLoan.currentCost);
      setPaymentData(null);
      setShowPaymentModal(false);
    }
  }, [isOpen, currentLoan]);

  // Calcular costo final basado en tiempo transcurrido
  useEffect(() => {
    if (currentLoan) {
      const now = new Date();
      const startTime = new Date(currentLoan.startDate);
      const minutesElapsed = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      
      const baseRate = 3000;
      const ratePerMinute = 50;
      const timeCost = minutesElapsed < 1 ? baseRate : baseRate + (minutesElapsed * ratePerMinute);
      const total = Math.max(baseRate, currentLoan.currentCost, timeCost);
      
      setFinalCost(Math.round(total));
    }
  }, [currentLoan]);

  const handlePaymentMethodSelect = (method: 'cash' | 'stripe') => {
    setSelectedPaymentMethod(method);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = (data: PaymentData) => {
    console.log('💳 Payment data received in CompleteLoanModal:', data);
    console.log('   stripePaymentIntentId:', data.stripePaymentIntentId);
    console.log('   transactionId:', data.transactionId);
    console.log('   method:', data.method);
    
    // Validar que tenemos el Payment Intent ID para Stripe
    if (data.method === 'stripe' && !data.stripePaymentIntentId) {
      console.error('❌ Missing stripePaymentIntentId in payment data!');
      alert('Error: No se recibió el Payment Intent ID de Stripe. Intenta de nuevo.');
      return;
    }
    
    setPaymentData(data);
    setShowPaymentModal(false);
  };

const handleCompleteConfirm = () => {
  if (!destinationStationId) {
    alert('Por favor selecciona una estación de destino');
    return;
  }
  
  if (!paymentData) {
    alert('Por favor configura el método de pago');
    return;
  }
  
  if (isProcessing) {
    return;
  }

  // DEBUG CRÍTICO: Verifica que paymentData tenga los datos correctos
  console.log('=== COMPLETELOANMODAL: ENVIANDO A USERDASHBOARD ===');
  console.log('paymentData completo:', JSON.stringify(paymentData, null, 2));
  console.log('paymentData.transactionId:', paymentData.transactionId);
  console.log('paymentData.stripePaymentIntentId:', paymentData.stripePaymentIntentId);
  console.log('selectedPaymentMethod:', selectedPaymentMethod);
  
  // Si es Stripe, verifica que tengamos el ID
  if (selectedPaymentMethod === 'stripe') {
    if (!paymentData.transactionId && !paymentData.stripePaymentIntentId) {
      console.error('❌ CRÍTICO: paymentData no tiene ni transactionId ni stripePaymentIntentId');
      alert('Error crítico: No se recibió el Payment Intent ID. Por favor intenta de nuevo.');
      return;
    }
    console.log('✅ Tiene Payment Intent ID:', paymentData.transactionId || paymentData.stripePaymentIntentId);
  }

  // Llamar a onConfirm con todos los datos
  console.log('📤 Llamando a onConfirm con datos:');
  console.log({
    destinationStationId,
    finalCost,
    paymentMethod: selectedPaymentMethod,
    paymentData,
    comments: comments.trim() || undefined
  });

  onConfirm(destinationStationId, {
    finalCost,
    paymentMethod: selectedPaymentMethod,
    paymentData,
    comments: comments.trim() || undefined
  });
};

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getElapsedTime = (): string => {
    if (!currentLoan?.startDate) return '0 min';
    
    const now = new Date();
    const startTime = new Date(currentLoan.startDate);
    const minutesElapsed = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
    
    if (minutesElapsed < 60) {
      return `${minutesElapsed} min`;
    }
    
    const hours = Math.floor(minutesElapsed / 60);
    const mins = minutesElapsed % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Tarjeta (Stripe)',
      icon: CreditCard,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      borderColor: 'border-blue-500',
      description: 'Pago seguro con tarjeta'
    },
    {
      id: 'cash',
      name: 'Efectivo',
      icon: Banknote,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
      borderColor: 'border-green-500',
      description: 'Pagar en estación'
    }
  ];

  const canComplete = destinationStationId && paymentData;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg mx-auto shadow-2xl border border-gray-200 dark:border-gray-700 my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Completar Préstamo
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Finaliza tu viaje y procesa el pago
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Current Loan Summary */}
              {currentLoan && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Resumen del préstamo
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Vehículo:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {currentLoan.transportType} - {currentLoan.transportModel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tiempo de uso:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {getElapsedTime()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Iniciado:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {new Date(currentLoan.startDate).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Costo total:</span>
                      <span className="text-gray-900 dark:text-white font-bold text-lg">
                        {formatCurrency(finalCost)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Destination Station */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <MapPin className="inline h-4 w-4 mr-2" />
                  Estación de destino
                </label>
                <select
                  value={destinationStationId}
                  onChange={(e) => setDestinationStationId(e.target.value)}
                  disabled={isProcessing}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50"
                >
                  <option value="">Selecciona una estación</option>
                  {availableStations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.nombre} - {station.direccion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <DollarSign className="inline h-4 w-4 mr-2" />
                  Método de pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    const isSelected = selectedPaymentMethod === method.id;
                    const hasPaymentData = paymentData?.method === method.id;
                    
                    return (
                      <button
                        key={method.id}
                        onClick={() => handlePaymentMethodSelect(method.id as 'cash' | 'stripe')}
                        disabled={isProcessing}
                        className={`relative p-4 text-sm font-medium rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          isSelected
                            ? `${method.borderColor} ${method.bgColor} ${method.color}`
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <IconComponent className="h-6 w-6" />
                          <span className="text-center">{method.name}</span>
                          <span className="text-xs opacity-75">{method.description}</span>
                        </div>
                        {hasPaymentData && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {paymentData && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                        Método de pago configurado
                      </span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {paymentMethods.find(m => m.id === paymentData.method)?.name} - 
                      {paymentData.method === 'cash' && 
                        ` Pago en estación: ${formatCurrency(finalCost)}`}
                      {paymentData.method === 'stripe' && paymentData.cardLast4 &&
                        ` **** ${paymentData.cardLast4} (${paymentData.cardBrand})`}
                    </p>
                    {paymentData.stripePaymentIntentId && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-mono">
                        ID: {paymentData.stripePaymentIntentId.substring(0, 20)}...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MessageSquare className="inline h-4 w-4 mr-2" />
                  Comentarios (opcional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Agrega comentarios sobre el viaje..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 resize-none"
                />
              </div>

              {/* Final Cost Summary */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-emerald-700 dark:text-emerald-300">
                    <DollarSign className="inline h-5 w-5 mr-1" />
                    Total a pagar:
                  </span>
                  <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                    {formatCurrency(finalCost)}
                  </span>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                  Este monto incluye el tiempo de uso transcurrido hasta el momento
                </p>
              </div>

              {/* Validation Message */}
              {!canComplete && (
                <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    <p className="font-medium">Campos requeridos:</p>
                    <ul className="mt-1 text-xs">
                      {!destinationStationId && <li>• Selecciona una estación de destino</li>}
                      {!paymentData && <li>• Configura el método de pago</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteConfirm}
                disabled={!canComplete || isProcessing}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 min-h-[42px]"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Completar Préstamo - {formatCurrency(finalCost)}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Payment Method Modal */}
          <PaymentMethodModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onConfirm={handlePaymentConfirm}
            selectedMethod={selectedPaymentMethod}
            amount={finalCost}
            isProcessing={false}
          />
        </div>
      )}
    </AnimatePresence>
  );
};