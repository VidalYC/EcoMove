// src/components/Loan/CancelLoanModal.tsx
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, XCircle, Clock, DollarSign, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CancelLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, additionalData: any) => void;
  currentLoan: {
    id: number;
    transportType: string;
    transportModel: string;
    currentCost: number;
    startDate: string;
  } | null;
  isProcessing?: boolean;
}

export const CancelLoanModal: React.FC<CancelLoanModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentLoan,
  isProcessing = false
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [understandsConsequences, setUnderstandsConsequences] = useState<boolean>(false);
  const [cancellationFee, setCancellationFee] = useState<number>(0);

  // Razones predefinidas para cancelación
  const cancellationReasons = [
    {
      value: 'technical-issue',
      label: 'Problema técnico con el vehículo',
      description: 'El vehículo no funciona correctamente',
      feeMultiplier: 0.2
    },
    {
      value: 'emergency',
      label: 'Emergencia personal',
      description: 'Situación urgente que impide continuar',
      feeMultiplier: 0.3
    },
    {
      value: 'weather',
      label: 'Condiciones climáticas adversas',
      description: 'Lluvia, tormenta u otros factores climáticos',
      feeMultiplier: 0.1
    },
    {
      value: 'station-issue',
      label: 'Problema con la estación',
      description: 'La estación de origen tiene problemas',
      feeMultiplier: 0.1
    },
    {
      value: 'changed-mind',
      label: 'Cambié de opinión',
      description: 'Ya no necesito el vehículo',
      feeMultiplier: 0.5
    },
    {
      value: 'other',
      label: 'Otra razón',
      description: 'Especifica tu motivo',
      feeMultiplier: 0.4
    }
  ];

  // Calcular duración y penalización
  const getLoanDuration = (): string => {
    if (!currentLoan?.startDate) return '0 min';
    
    const startTime = new Date(currentLoan.startDate).getTime();
    const currentTime = Date.now();
    const minutesElapsed = Math.floor((currentTime - startTime) / (1000 * 60));
    
    if (minutesElapsed < 60) {
      return `${minutesElapsed} min`;
    }
    
    const hours = Math.floor(minutesElapsed / 60);
    const mins = minutesElapsed % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Calcular tarifa de cancelación
  useEffect(() => {
    if (currentLoan && selectedReason) {
      const reason = cancellationReasons.find(r => r.value === selectedReason);
      if (reason) {
        const fee = currentLoan.currentCost * reason.feeMultiplier;
        setCancellationFee(Math.round(fee));
      }
    } else {
      setCancellationFee(0);
    }
  }, [currentLoan, selectedReason]);

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedReason('');
      setCustomReason('');
      setUnderstandsConsequences(false);
      setCancellationFee(0);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (isValidSubmission && !isProcessing) {
      const finalReason = selectedReason === 'other' ? customReason.trim() : 
        cancellationReasons.find(r => r.value === selectedReason)?.label || '';
      
      const additionalData = {
        reasonCode: selectedReason,
        reasonText: finalReason,
        cancellationFee,
        understoodConsequences: understandsConsequences,
        cancelledAt: new Date().toISOString(),
        loanDuration: getLoanDuration()
      };
      
      onConfirm(finalReason, additionalData);
    }
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

  const selectedReasonData = cancellationReasons.find(r => r.value === selectedReason);
  const isValidSubmission = selectedReason !== '' && 
    (selectedReason !== 'other' || customReason.trim() !== '') &&
    understandsConsequences;

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
                <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Cancelar Préstamo
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Esta acción no se puede deshacer
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
              {/* Advertencia importante */}
              <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700 dark:text-red-300">
                  <p className="font-medium">¡Atención! Cancelación de préstamo</p>
                  <p className="mt-1">
                    Al cancelar este préstamo se aplicará una tarifa de cancelación y 
                    deberás devolver el vehículo inmediatamente a una estación.
                  </p>
                </div>
              </div>

              {/* Información del préstamo actual */}
              {currentLoan && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Préstamo a cancelar
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Vehículo:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {currentLoan.transportType} - {currentLoan.transportModel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tiempo usado:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {getLoanDuration()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Costo acumulado:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatCurrency(currentLoan.currentCost)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Razón de cancelación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <AlertCircle className="inline h-4 w-4 mr-2" />
                  ¿Por qué quieres cancelar el préstamo?
                </label>
                
                <div className="space-y-2">
                  {cancellationReasons.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      onClick={() => setSelectedReason(reason.value)}
                      disabled={isProcessing}
                      className={`w-full p-3 text-left rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedReason === reason.value
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{reason.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {reason.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Tarifa: {(reason.feeMultiplier * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Campo personalizado para "otra razón" */}
                {selectedReason === 'other' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Especifica la razón
                    </label>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      disabled={isProcessing}
                      maxLength={150}
                      rows={3}
                      placeholder="Describe brevemente por qué necesitas cancelar..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                      {customReason.length}/150 caracteres
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen de costos */}
              {selectedReasonData && currentLoan && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Tarifa de cancelación:
                    </span>
                    <span className="text-lg font-bold text-orange-800 dark:text-orange-200">
                      {formatCurrency(cancellationFee)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-orange-600 dark:text-orange-400 space-y-1">
                    <p>• Costo base del préstamo: {formatCurrency(currentLoan.currentCost)}</p>
                    <p>• Penalización ({(selectedReasonData.feeMultiplier * 100).toFixed(0)}%): {formatCurrency(cancellationFee)}</p>
                    <div className="border-t border-orange-200 dark:border-orange-700 pt-1 mt-1">
                      <p className="font-medium">Total a pagar: {formatCurrency(cancellationFee)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmación de consecuencias */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Consecuencias de la cancelación:</p>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>• Se aplicará la tarifa de cancelación mostrada arriba</li>
                      <li>• Debes devolver el vehículo a una estación inmediatamente</li>
                      <li>• El préstamo se marcará como cancelado en tu historial</li>
                      <li>• No podrás reactivar este préstamo</li>
                    </ul>
                  </div>
                </div>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={understandsConsequences}
                    onChange={(e) => setUnderstandsConsequences(e.target.checked)}
                    disabled={isProcessing}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="text-sm">
                    <p className="text-gray-900 dark:text-white font-medium">
                      Entiendo las consecuencias
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                      He leído y comprendo que se aplicará una tarifa de cancelación 
                      y debo devolver el vehículo inmediatamente.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Mantener Préstamo
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValidSubmission || isProcessing}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 min-h-[42px]"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Cancelando...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>Cancelar Préstamo - {formatCurrency(cancellationFee)}</span>
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