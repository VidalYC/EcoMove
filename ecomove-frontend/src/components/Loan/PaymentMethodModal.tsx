// src/components/Loan/PaymentMethodModal.tsx - CORREGIDO CON PAYMENT INTENT
import React, { useState, useEffect, useRef } from 'react';
import { X, Banknote, CreditCard, MapPin, AlertCircle, CheckCircle2, Loader, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { stripeService } from '../../services/stripeService';
import { localStorageService, SavedCard } from '../../services/localStorageService';
import type { StripeCardElement } from '@stripe/stripe-js';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: PaymentData) => void;
  selectedMethod: 'cash' | 'stripe';
  amount: number;
  isProcessing?: boolean;
}

export interface PaymentData {
  method: 'cash' | 'stripe';
  nearestStation?: string;
  stripePaymentIntentId?: string;
  stripePaymentMethodId?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardholderName?: string;
  transactionId?: string;
  reference?: string;
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
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string>('');
  const [cardholderName, setCardholderName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string>('');
  const [useNewCard, setUseNewCard] = useState(true);
  const cardElementRef = useRef<HTMLDivElement>(null);
  const stripeCardElement = useRef<StripeCardElement | null>(null);

  useEffect(() => {
    if (isOpen && selectedMethod === 'stripe') {
      const cards = localStorageService.getSavedCards();
      setSavedCards(cards);
      
      if (cards.length > 0) {
        const defaultCard = cards.find(c => c.isDefault) || cards[0];
        setSelectedSavedCard(defaultCard.id);
        setUseNewCard(false);
      }
    }
  }, [isOpen, selectedMethod]);

  useEffect(() => {
    const initStripe = async () => {
      if (isOpen && selectedMethod === 'stripe' && useNewCard && cardElementRef.current) {
        setIsLoadingStripe(true);
        setStripeError('');
        
        try {
          await stripeService.initialize();
          stripeCardElement.current = await stripeService.createCardElement(cardElementRef.current);
          
          if (stripeCardElement.current) {
            stripeCardElement.current.on('change', (event) => {
              if (event.error) {
                setStripeError(event.error.message);
              } else {
                setStripeError('');
              }
            });
          }
        } catch (error) {
          setStripeError('Error al cargar Stripe. Por favor recarga la página.');
        } finally {
          setIsLoadingStripe(false);
        }
      }
    };

    initStripe();

    return () => {
      if (stripeCardElement.current) {
        stripeService.cleanup();
        stripeCardElement.current = null;
      }
    };
  }, [isOpen, selectedMethod, useNewCard]);

  useEffect(() => {
    if (isOpen) {
      setPaymentData({
        method: selectedMethod,
        ...(selectedMethod === 'cash' && { 
          nearestStation: 'Estación Zona Rosa - Carrera 13 # 85-32'
        })
      });
      setErrors({});
      setCardholderName('');
      setSaveCard(false);
      setStripeError('');
    }
  }, [isOpen, selectedMethod]);

  useEffect(() => {
    validateForm();
  }, [paymentData, cardholderName, selectedMethod, useNewCard, selectedSavedCard]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (selectedMethod === 'stripe') {
      if (useNewCard) {
        if (!cardholderName || cardholderName.trim().length < 3) {
          newErrors.cardholderName = 'Nombre del titular es requerido';
        }
      } else {
        if (!selectedSavedCard) {
          newErrors.savedCard = 'Selecciona una tarjeta';
        }
      }
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleConfirm = async () => {
    if (!isValid || isProcessing) return;

    if (selectedMethod === 'stripe') {
      await handleStripePayment();
    } else {
      onConfirm(paymentData);
    }
  };

  const handleStripePayment = async () => {
    const STRIPE_MIN_AMOUNT = 3000;
    
    if (amount < STRIPE_MIN_AMOUNT) {
      setStripeError(`El monto mínimo para pagos con tarjeta es ${formatCurrency(STRIPE_MIN_AMOUNT)}`);
      return;
    }

    setIsLoadingStripe(true);
    setStripeError('');

    try {
      if (useNewCard) {
        if (!stripeCardElement.current || !cardholderName) {
          setStripeError('Por favor completa todos los campos');
          setIsLoadingStripe(false);
          return;
        }

        // PASO 1: Crear Payment Intent en el backend
        console.log('📝 Creando Payment Intent en el backend...');
        const token = localStorage.getItem('ecomove_token');
        
        if (!token) {
          setStripeError('No hay autenticación. Por favor inicia sesión nuevamente.');
          setIsLoadingStripe(false);
          return;
        }

        const intentResponse = await fetch('http://localhost:4000/api/v1/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: Math.round(amount),
            currency: 'cop'
          })
        });

        if (!intentResponse.ok) {
          const errorData = await intentResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error creando Payment Intent en el backend');
        }

        const intentData = await intentResponse.json();
        const clientSecret = intentData.data.clientSecret;
        const paymentIntentId = intentData.data.paymentIntentId;

        console.log('✅ Payment Intent creado:', paymentIntentId);

        // PASO 2: Confirmar pago con Stripe Elements en el frontend
        console.log('💳 Confirmando pago con Stripe...');
        const result = await stripeService.processPayment(
          amount,
          stripeCardElement.current,
          cardholderName,
          saveCard
        );

        if (result.success) {
          console.log('✅ Pago confirmado en Stripe');

          // Guardar tarjeta si se solicitó
          if (saveCard && result.last4 && result.brand) {
            const cardData = {
              last4: result.last4,
              brand: result.brand,
              expiryMonth: '12',
              expiryYear: '25',
              cardholderName,
              isDefault: savedCards.length === 0,
              stripePaymentMethodId: result.paymentMethodId
            };
            
            localStorageService.saveCard(cardData);
            console.log('💾 Tarjeta guardada localmente');
          }

          // PASO 3: Enviar datos completos al modal parent
          const finalPaymentData: PaymentData = {
            method: 'stripe',
            stripePaymentIntentId: paymentIntentId,        // ✅ IMPORTANTE
            stripePaymentMethodId: result.paymentMethodId,
            cardLast4: result.last4,
            cardBrand: result.brand,
            cardholderName,
            transactionId: paymentIntentId                 // ✅ IMPORTANTE
          };

          console.log('📤 Enviando datos de pago completos:', finalPaymentData);
          onConfirm(finalPaymentData);
        } else {
          setStripeError(result.error || 'Error al procesar el pago con Stripe');
        }
      } else {
        // PARA TARJETA GUARDADA
        const card = savedCards.find(c => c.id === selectedSavedCard);
        if (!card) {
          setStripeError('Tarjeta no encontrada');
          setIsLoadingStripe(false);
          return;
        }

        // PASO 1: Crear Payment Intent para tarjeta guardada
        console.log('📝 Creando Payment Intent para tarjeta guardada...');
        const token = localStorage.getItem('ecomove_token');
        
        if (!token) {
          setStripeError('No hay autenticación. Por favor inicia sesión nuevamente.');
          setIsLoadingStripe(false);
          return;
        }

        const intentResponse = await fetch('http://localhost:4000/api/v1/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: Math.round(amount),
            currency: 'cop',
            paymentMethodId: card.stripePaymentMethodId
          })
        });

        if (!intentResponse.ok) {
          const errorData = await intentResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error creando Payment Intent');
        }

        const intentData = await intentResponse.json();
        const paymentIntentId = intentData.data.paymentIntentId;

        console.log('✅ Payment Intent creado para tarjeta guardada:', paymentIntentId);

        // PASO 2: Enviar datos completos
        const finalPaymentData: PaymentData = {
          method: 'stripe',
          stripePaymentMethodId: card.stripePaymentMethodId,
          stripePaymentIntentId: paymentIntentId,         // ✅ IMPORTANTE
          cardLast4: card.last4,
          cardBrand: card.brand,
          cardholderName: card.cardholderName,
          transactionId: paymentIntentId                  // ✅ IMPORTANTE
        };

        console.log('📤 Enviando datos de tarjeta guardada:', finalPaymentData);
        onConfirm(finalPaymentData);
      }
    } catch (error: any) {
      console.error('❌ Error en pago Stripe:', error);
      setStripeError(error.message || 'Error al procesar el pago');
    } finally {
      setIsLoadingStripe(false);
    }
  };

  const getMethodInfo = () => {
    switch (selectedMethod) {
      case 'cash':
        return {
          title: 'Pago en Efectivo',
          icon: Banknote,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900'
        };
      case 'stripe':
        return {
          title: 'Pago con Tarjeta (Stripe)',
          icon: CreditCard,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900'
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
                    Total: {formatCurrency(amount)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isProcessing || isLoadingStripe}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
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
                    </p>
                  </div>
                </>
              )}

              {selectedMethod === 'stripe' && (
                <>
                  {amount < 3000 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Monto inferior al mínimo
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        El monto mínimo para pagos con tarjeta es {formatCurrency(3000)}. 
                        Tu préstamo será ajustado automáticamente.
                      </p>
                    </div>
                  )}

                  {savedCards.length > 0 && (
                    <div className="flex space-x-2 mb-4">
                      <button
                        onClick={() => setUseNewCard(false)}
                        className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                          !useNewCard
                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300'
                            : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <CreditCard className="inline h-4 w-4 mr-2" />
                        Tarjeta guardada
                      </button>
                      <button
                        onClick={() => setUseNewCard(true)}
                        className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                          useNewCard
                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300'
                            : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Plus className="inline h-4 w-4 mr-2" />
                        Nueva tarjeta
                      </button>
                    </div>
                  )}

                  {!useNewCard && savedCards.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selecciona una tarjeta
                      </label>
                      {savedCards.map((card) => {
                        const isExpired = localStorageService.isCardExpired(card);
                        return (
                          <button
                            key={card.id}
                            onClick={() => !isExpired && setSelectedSavedCard(card.id)}
                            disabled={isExpired}
                            className={`w-full p-3 rounded-lg border transition-all text-left ${
                              selectedSavedCard === card.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            } ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <CreditCard className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {card.brand.toUpperCase()} •••• {card.last4}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {card.cardholderName} • {card.expiryMonth}/{card.expiryYear}
                                  </p>
                                </div>
                              </div>
                              {card.isDefault && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                                  Por defecto
                                </span>
                              )}
                              {isExpired && (
                                <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded">
                                  Expirada
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {useNewCard && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nombre del titular
                        </label>
                        <input
                          type="text"
                          placeholder="Juan Pérez"
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                          disabled={isProcessing || isLoadingStripe}
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 ${
                            errors.cardholderName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                        {errors.cardholderName && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {errors.cardholderName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <CreditCard className="inline h-4 w-4 mr-1" />
                          Información de la tarjeta
                        </label>
                        
                        {isLoadingStripe ? (
                          <div className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                            <Loader className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Cargando Stripe...</span>
                          </div>
                        ) : (
                          <div
                            ref={cardElementRef}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 min-h-[44px]"
                          />
                        )}
                        
                        {stripeError && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {stripeError}
                          </p>
                        )}
                      </div>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          disabled={isProcessing || isLoadingStripe}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Guardar esta tarjeta para futuros pagos
                        </span>
                      </label>
                    </>
                  )}

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Pago seguro procesado por Stripe. Tus datos están encriptados.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <button
                onClick={onClose}
                disabled={isProcessing || isLoadingStripe}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValid || isProcessing || isLoadingStripe}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 min-h-[42px]"
              >
                {(isProcessing || isLoadingStripe) ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {selectedMethod === 'cash' ? 'Confirmar - Pagar en Estación' : 
                       `Pagar ${formatCurrency(amount)}`}
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