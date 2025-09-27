// src/components/Loan/PaymentMethodModal.tsx
import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, Banknote, DollarSign, Lock, Calendar, User, AlertCircle, CheckCircle2, MapPin, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: PaymentData) => void;
  selectedMethod: 'credit_card' | 'debit_card' | 'cash' | 'wallet';
  amount: number;
  isProcessing?: boolean;
}

export interface PaymentData {
  method: 'credit_card' | 'debit_card' | 'cash' | 'wallet';
  cardNumber?: string;
  cardName?: string;
  expiryDate?: string;
  cvv?: string;
  cashReceived?: number;
  change?: number;
  walletNumber?: string;
  walletPin?: string;
  reference?: string;
  nearestStation?: string;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedMethod,
  amount,
  isProcessing = false
}) => {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: selectedMethod
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  // Reset cuando cambia el método o se abre el modal
  useEffect(() => {
    if (isOpen) {
      setPaymentData({
        method: selectedMethod,
        ...(selectedMethod === 'cash' && { 
          cashReceived: amount,
          nearestStation: 'Estación Zona Rosa - Carrera 13 # 85-32'
        })
      });
      setErrors({});
    }
  }, [isOpen, selectedMethod, amount]);

  // Validación en tiempo real
  useEffect(() => {
    validateForm();
  }, [paymentData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    switch (selectedMethod) {
      case 'credit_card':
      case 'debit_card':
        if (!paymentData.cardNumber || paymentData.cardNumber.length < 16) {
          newErrors.cardNumber = 'Número de tarjeta inválido';
        }
        if (!paymentData.cardName || paymentData.cardName.trim().length < 3) {
          newErrors.cardName = 'Nombre en tarjeta es requerido';
        }
        if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
          newErrors.expiryDate = 'Fecha inválida (MM/AA)';
        }
        if (!paymentData.cvv || paymentData.cvv.length < 3 || paymentData.cvv.length > 4) {
          newErrors.cvv = 'CVV debe tener 3 o 4 dígitos';
        }
        break;

      case 'cash':
        // Para efectivo, solo validamos que el usuario confirme que irá a la estación
        break;

      case 'wallet':
        if (!paymentData.walletNumber || paymentData.walletNumber.length < 10) {
          newErrors.walletNumber = 'Número de billetera inválido';
        }
        if (!paymentData.walletPin || paymentData.walletPin.length !== 4) {
          newErrors.walletPin = 'PIN debe tener 4 dígitos';
        }
        break;
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  };

  const handleInputChange = (field: keyof PaymentData, value: string | number) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'cashReceived' && typeof value === 'number' && {
        change: Math.max(0, value - amount)
      })
    }));
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
  };

  const handleConfirm = () => {
    if (isValid && !isProcessing) {
      onConfirm(paymentData);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMethodInfo = () => {
    switch (selectedMethod) {
      case 'credit_card':
        return {
          title: 'Tarjeta de Crédito',
          icon: CreditCard,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900'
        };
      case 'debit_card':
        return {
          title: 'Tarjeta de Débito',
          icon: CreditCard,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900'
        };
      case 'cash':
        return {
          title: 'Efectivo',
          icon: Banknote,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900'
        };
      case 'wallet':
        return {
          title: 'Billetera Digital',
          icon: Smartphone,
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-100 dark:bg-purple-900'
        };
    }
  };

  const methodInfo = getMethodInfo();
  const IconComponent = methodInfo.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md mx-auto shadow-2xl border border-gray-200 dark:border-gray-700 my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`${methodInfo.bgColor} p-2 rounded-lg`}>
                  <IconComponent className={`h-5 w-5 ${methodInfo.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {methodInfo.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monto a pagar: {formatCurrency(amount)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Tarjetas de Crédito/Débito */}
              {(selectedMethod === 'credit_card' || selectedMethod === 'debit_card') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <CreditCard className="inline h-4 w-4 mr-1" />
                      Número de tarjeta
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      value={paymentData.cardNumber ? formatCardNumber(paymentData.cardNumber) : ''}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value.replace(/\s/g, ''))}
                      disabled={isProcessing}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 ${
                        errors.cardNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.cardNumber && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.cardNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="inline h-4 w-4 mr-1" />
                      Nombre en la tarjeta
                    </label>
                    <input
                      type="text"
                      placeholder="JUAN PÉREZ"
                      value={paymentData.cardName || ''}
                      onChange={(e) => handleInputChange('cardName', e.target.value.toUpperCase())}
                      disabled={isProcessing}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 ${
                        errors.cardName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.cardName && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.cardName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Vencimiento
                      </label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        maxLength={5}
                        value={paymentData.expiryDate || ''}
                        onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                        disabled={isProcessing}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 ${
                          errors.expiryDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors.expiryDate && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.expiryDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Lock className="inline h-4 w-4 mr-1" />
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength={4}
                        value={paymentData.cvv || ''}
                        onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                        disabled={isProcessing}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 ${
                          errors.cvv ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors.cvv && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.cvv}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Efectivo - Mejorado */}
              {selectedMethod === 'cash' && (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                          Pago en Efectivo
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          Debes dirigirte a la estación más cercana para realizar el pago en efectivo.
                        </p>
                        
                        <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Monto a pagar:
                            </span>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                          
                          <div className="border-t pt-2 mt-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              <MapPin className="inline h-3 w-3 mr-1" />
                              Estación más cercana:
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {paymentData.nearestStation}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-center">
                          <button
                            onClick={() => window.open('https://maps.google.com/maps?q=Estación+Zona+Rosa+Carrera+13+85+32+Bogotá', '_blank')}
                            className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                          >
                            <Navigation className="h-4 w-4" />
                            <span>Ver direcciones en Google Maps</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Importante
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      El préstamo se completará una vez que realices el pago en la estación. 
                      Lleva contigo el monto exacto o superior.
                    </p>
                  </div>
                </>
              )}

              {/* Billetera Digital */}
              {selectedMethod === 'wallet' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Smartphone className="inline h-4 w-4 mr-1" />
                      Número de billetera
                    </label>
                    <input
                      type="text"
                      placeholder="3001234567"
                      value={paymentData.walletNumber || ''}
                      onChange={(e) => handleInputChange('walletNumber', e.target.value.replace(/\D/g, ''))}
                      disabled={isProcessing}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 ${
                        errors.walletNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.walletNumber && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.walletNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Lock className="inline h-4 w-4 mr-1" />
                      PIN de confirmación
                    </label>
                    <input
                      type="password"
                      placeholder="1234"
                      maxLength={4}
                      value={paymentData.walletPin || ''}
                      onChange={(e) => handleInputChange('walletPin', e.target.value.replace(/\D/g, ''))}
                      disabled={isProcessing}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 ${
                        errors.walletPin ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.walletPin && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.walletPin}
                      </p>
                    )}
                  </div>
                </>
              )}



              {/* Referencia opcional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Referencia (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Número de transacción o referencia"
                  value={paymentData.reference || ''}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                  disabled={isProcessing}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValid || isProcessing}
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
                    <span>
                      {selectedMethod === 'cash' ? 'Confirmar - Pagar en Estación' : 
                       `Confirmar Pago - ${formatCurrency(amount)}`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};