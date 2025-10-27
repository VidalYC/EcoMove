// src/services/stripeService.ts
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

const STRIPE_PUBLIC_KEY = 'pk_test_51SF3AaF4yhK50E483ECf259z3Betcse0pTUhyTpxBvc9CUXt6NaANqqrTCMXNzxNCRBRYMwnL0dEDd4YlVWerr9f00Pk9KUomA';
const API_BASE_URL = 'http://localhost:4000/api/v1/payments';

export interface StripePaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface StripePaymentResult {
  success: boolean;
  paymentIntentId?: string;
  paymentMethodId?: string;
  error?: string;
  last4?: string;
  brand?: string;
}

class StripeService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  /**
   * Inicializar Stripe
   */
  async initialize(): Promise<Stripe | null> {
    try {
      if (!this.stripe) {
        console.log('🔧 Inicializando Stripe...');
        this.stripe = await loadStripe(STRIPE_PUBLIC_KEY);
        console.log('✅ Stripe inicializado correctamente');
      }
      return this.stripe;
    } catch (error) {
      console.error('❌ Error al inicializar Stripe:', error);
      return null;
    }
  }

  /**
   * Crear elementos de Stripe
   */
  async createElements(): Promise<StripeElements | null> {
    try {
      const stripe = await this.initialize();
      if (!stripe) return null;

      this.elements = stripe.elements();
      return this.elements;
    } catch (error) {
      console.error('Error al crear elementos de Stripe:', error);
      return null;
    }
  }

  /**
   * Crear elemento de tarjeta
   */
  async createCardElement(container: HTMLElement): Promise<StripeCardElement | null> {
    try {
      const elements = await this.createElements();
      if (!elements) return null;

      this.cardElement = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
              color: '#aab7c4',
            },
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          invalid: {
            color: '#9e2146',
            iconColor: '#9e2146'
          },
        },
        hidePostalCode: true,
      });

      this.cardElement.mount(container);
      return this.cardElement;
    } catch (error) {
      console.error('Error al crear elemento de tarjeta:', error);
      return null;
    }
  }

  /**
   * Crear Payment Intent en tu backend
   */
  async createPaymentIntent(amount: number, loanId?: string, installmentNumber?: number): Promise<StripePaymentIntent | null> {
    try {
      const token = localStorage.getItem('ecomove_token');
      
      if (!token) {
        console.error('❌ No hay token de autenticación');
        return null;
      }

      console.log('📝 Creando Payment Intent:', { amount, loanId, installmentNumber });
      
      const response = await fetch(`${API_BASE_URL}/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Math.round(amount),
          currency: 'cop',
          metadata: {
            loanId: loanId || '',
            installmentNumber: installmentNumber || ''
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.message || 'Error al crear Payment Intent');
      }

      const result = await response.json();
      console.log('✅ Payment Intent creado:', result.data.paymentIntentId);
      
      return {
        clientSecret: result.data.clientSecret,
        paymentIntentId: result.data.paymentIntentId,
        amount: amount,
        currency: 'cop'
      };
    } catch (error) {
      console.error('❌ Error al crear Payment Intent:', error);
      return null;
    }
  }

  /**
   * Confirmar pago con Stripe Elements
   */
  async confirmCardPayment(
    clientSecret: string,
    cardElement: StripeCardElement,
    cardholderName: string
  ): Promise<StripePaymentResult> {
    try {
      const stripe = await this.initialize();
      if (!stripe) {
        return { success: false, error: 'Stripe no inicializado' };
      }

      console.log('💳 Confirmando pago con Stripe...');

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName,
          },
        },
      });

      if (error) {
        console.error('❌ Error al confirmar pago:', error);
        return {
          success: false,
          error: error.message || 'Error al procesar el pago'
        };
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Pago confirmado exitosamente:', paymentIntent.id);
        
        // Extraer información de la tarjeta
        const paymentMethod = paymentIntent.payment_method;
        let last4, brand, paymentMethodId;
        
        if (typeof paymentMethod === 'string') {
          paymentMethodId = paymentMethod;
          // Los detalles de la tarjeta no están disponibles directamente
          last4 = undefined;
          brand = undefined;
        } else if (paymentMethod && 'card' in paymentMethod) {
          paymentMethodId = paymentMethod.id;
          last4 = paymentMethod.card?.last4;
          brand = paymentMethod.card?.brand;
        }

        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          paymentMethodId,
          last4,
          brand
        };
      }

      return {
        success: false,
        error: 'El pago no se completó correctamente'
      };
    } catch (error) {
      console.error('❌ Error al confirmar pago:', error);
      return {
        success: false,
        error: 'Error inesperado al procesar el pago'
      };
    }
  }

  /**
   * Crear método de pago sin procesarlo
   */
  async createPaymentMethod(
    cardElement: StripeCardElement,
    cardholderName: string
  ): Promise<StripePaymentResult> {
    try {
      const stripe = await this.initialize();
      if (!stripe) {
        return { success: false, error: 'Stripe no inicializado' };
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Error al crear método de pago'
        };
      }

      if (paymentMethod) {
        return {
          success: true,
          paymentMethodId: paymentMethod.id,
          last4: paymentMethod.card?.last4,
          brand: paymentMethod.card?.brand,
        };
      }

      return {
        success: false,
        error: 'No se pudo crear el método de pago'
      };
    } catch (error) {
      console.error('Error al crear método de pago:', error);
      return {
        success: false,
        error: 'Error inesperado'
      };
    }
  }

  /**
   * Procesar pago completo (crear Payment Intent + confirmar)
   */
  async processPayment(
    amount: number,
    cardElement: StripeCardElement,
    cardholderName: string,
    saveCard: boolean = false,
    loanId?: string,
    installmentNumber?: number
  ): Promise<StripePaymentResult> {
    try {
      console.log('🚀 Iniciando proceso de pago:', { amount, cardholderName, saveCard });

      // 1. Crear Payment Intent en el backend
      const paymentIntent = await this.createPaymentIntent(amount, loanId, installmentNumber);
      if (!paymentIntent) {
        return { success: false, error: 'Error al iniciar el pago' };
      }

      // 2. Confirmar pago con Stripe
      const result = await this.confirmCardPayment(
        paymentIntent.clientSecret,
        cardElement,
        cardholderName
      );

      if (!result.success) {
        return result;
      }

      // 3. Guardar método de pago en el backend si se requiere
      if (saveCard && result.paymentMethodId) {
        console.log('💾 Guardando método de pago...');
        await this.savePaymentMethodToBackend(result.paymentMethodId);
      }

      console.log('✅ Proceso de pago completado exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al procesar pago:', error);
      return {
        success: false,
        error: 'Error al procesar el pago'
      };
    }
  }

  /**
   * Guardar método de pago en el backend
   */
  private async savePaymentMethodToBackend(paymentMethodId: string): Promise<void> {
    try {
      const token = localStorage.getItem('ecomove_token');
      
      if (!token) {
        console.warn('⚠️ No hay token para guardar método de pago');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/save-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentMethodId })
      });

      if (!response.ok) {
        console.warn('⚠️ No se pudo guardar el método de pago en el backend');
      } else {
        console.log('✅ Método de pago guardado en el backend');
      }
    } catch (error) {
      console.error('❌ Error al guardar método de pago:', error);
    }
  }

  /**
   * Confirmar pago en el backend (opcional, para validación adicional)
   */
  async confirmPaymentInBackend(paymentIntentId: string, amount: number): Promise<boolean> {
    try {
      const token = localStorage.getItem('ecomove_token');
      
      if (!token) {
        console.warn('⚠️ No hay token para confirmar pago');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          paymentIntentId,
          amount
        })
      });

      if (!response.ok) {
        console.warn('⚠️ No se pudo confirmar el pago en el backend');
        return false;
      }

      const result = await response.json();
      console.log('✅ Pago confirmado en el backend:', result);
      return result.success;
    } catch (error) {
      console.error('❌ Error al confirmar pago en backend:', error);
      return false;
    }
  }

  /**
   * Limpiar elementos de Stripe
   */
  cleanup(): void {
    if (this.cardElement) {
      this.cardElement.destroy();
      this.cardElement = null;
    }
    this.elements = null;
  }

  /**
   * Validar disponibilidad de Stripe
   */
  isAvailable(): boolean {
    return this.stripe !== null;
  }

  /**
   * Formatear monto para Stripe (pesos colombianos usan valor entero)
   */
  formatAmountForStripe(amount: number): number {
    return Math.round(amount);
  }

  /**
   * Formatear monto desde Stripe
   */
  formatAmountFromStripe(amount: number): number {
    return amount;
  }
}

// Exportar instancia singleton
const stripeService = new StripeService();
export { stripeService };