// backend/src/services/stripeService.ts - VERSIÓN FINAL CORREGIDA
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY no está configurada en las variables de entorno');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover', // Versión actual compatible
  typescript: true,
});

// Montos mínimos por moneda según Stripe
const MINIMUM_AMOUNTS: Record<string, number> = {
  'usd': 50,    // Dólar: mínimo $0.50 = 50 centavos
  'mxn': 1000,  // Peso mexicano: mínimo $10.00 = 1000 centavos
  'eur': 50,    // Euro: mínimo €0.50 = 50 centavos
  'cop': 3000,  // Peso colombiano: mínimo $3,000 COP
};

// Monedas que NO usan decimales (zero-decimal currencies)
const ZERO_DECIMAL_CURRENCIES = [
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 
  'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 
  'xof', 'xpf', 'cop'
];

// ⚠️ IMPORTANTE: COP puede no estar disponible en cuentas Stripe de prueba
// Tasa de conversión COP a USD (actualizar según tasa del día)
const COP_TO_USD_RATE = 0.00024; // 1 COP ≈ 0.00024 USD (4,166 COP ≈ 1 USD)

// Por defecto, usar USD si COP no está disponible
const DEFAULT_CURRENCY = 'usd';
const USE_COP_FALLBACK = true; // Cambiar a false para forzar USD siempre

export const stripeService = {
  /**
   * Determinar si una moneda es zero-decimal
   */
  isZeroDecimalCurrency(currency: string): boolean {
    return ZERO_DECIMAL_CURRENCIES.includes(currency.toLowerCase());
  },

  /**
   * Convertir monto a la unidad correcta para Stripe
   */
  formatAmountForStripe(amount: number, currency: string): number {
    const normalizedCurrency = currency.toLowerCase();
    
    // Si es zero-decimal (como COP), enviar el valor directo
    if (this.isZeroDecimalCurrency(normalizedCurrency)) {
      return Math.round(amount);
    }
    
    // Si usa decimales, multiplicar por 100 para convertir a centavos
    return Math.round(amount * 100);
  },

  /**
   * Crear un Payment Intent real de Stripe
   */
  async createPaymentIntent(
    amount: number, 
    currency: string = 'cop', 
    metadata?: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    try {
      let normalizedCurrency = currency.toLowerCase();
      let finalAmount = amount;
      
      // ⚠️ Si es COP, intentar primero con COP, si falla usar USD
      if (normalizedCurrency === 'cop') {
        console.log('⚠️ Advertencia: COP puede no estar disponible en tu cuenta Stripe.');
        console.log('   Intentando crear Payment Intent con COP...');
        
        try {
          return await this._createStripePaymentIntent(amount, 'cop', metadata);
        } catch (copError: any) {
          if (copError.code === 'currency_not_supported' || copError.message.includes('convert')) {
            console.log('❌ COP no soportado. Convirtiendo a USD...');
            normalizedCurrency = 'usd';
            finalAmount = Math.round(amount * COP_TO_USD_RATE * 100); // COP a centavos USD
            
            return await this._createStripePaymentIntent(
              finalAmount / 100, // Convertir de centavos a dólares
              'usd',
              {
                ...metadata,
                originalCurrency: 'COP',
                originalAmount: amount.toString(),
                conversionRate: COP_TO_USD_RATE.toString()
              }
            );
          }
          throw copError;
        }
      }
      
      return await this._createStripePaymentIntent(finalAmount, normalizedCurrency, metadata);
    } catch (error: any) {
      console.error('❌ Error creando Payment Intent:', error);
      throw error;
    }
  },

  /**
   * Método interno para crear Payment Intent en Stripe
   */
  async _createStripePaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    const normalizedCurrency = currency.toLowerCase();
    
    // Formatear el monto correctamente según el tipo de moneda
    const formattedAmount = this.formatAmountForStripe(amount, normalizedCurrency);
    const minimumAmount = MINIMUM_AMOUNTS[normalizedCurrency] || 50;

    console.log('💳 Creando Payment Intent:');
    console.log(`   Moneda: ${normalizedCurrency.toUpperCase()}`);
    console.log(`   Es zero-decimal: ${this.isZeroDecimalCurrency(normalizedCurrency)}`);
    console.log(`   Monto original: ${amount}`);
    console.log(`   Monto formateado para Stripe: ${formattedAmount}`);
    console.log(`   Monto mínimo requerido: ${minimumAmount}`);

    // Validar que el monto formateado sea suficiente
    if (formattedAmount < minimumAmount) {
      throw new Error(
        `El monto ${amount} ${normalizedCurrency.toUpperCase()} (${formattedAmount} en formato Stripe) ` +
        `es inferior al mínimo permitido de ${minimumAmount}`
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: formattedAmount,
      currency: normalizedCurrency,
      metadata: {
        originalAmount: amount.toString(),
        formattedAmount: formattedAmount.toString(),
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    console.log(`✅ Payment Intent creado exitosamente!`);
    console.log(`   ID: ${paymentIntent.id}`);
    console.log(`   Estado: ${paymentIntent.status}`);
    console.log(`   Monto en Stripe: ${paymentIntent.amount} ${paymentIntent.currency.toUpperCase()}`);

    return paymentIntent;
  },

  /**
   * Obtener un Payment Intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error: any) {
      console.error('Error obteniendo Payment Intent:', error);
      throw new Error(`Error de Stripe: ${error.message}`);
    }
  },

  /**
   * Confirmar Payment Intent (si es necesario)
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const params: Stripe.PaymentIntentConfirmParams = {};
      
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        params
      );

      console.log(`✅ Payment Intent confirmado: ${paymentIntent.id}`);
      console.log(`   Estado: ${paymentIntent.status}`);

      return paymentIntent;
    } catch (error: any) {
      console.error('Error confirmando Payment Intent:', error);
      throw new Error(`Error de Stripe: ${error.message}`);
    }
  },

  /**
   * Adjuntar método de pago a un cliente
   */
  async attachPaymentMethod(
    paymentMethodId: string, 
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      return paymentMethod;
    } catch (error: any) {
      console.error('Error adjuntando Payment Method:', error);
      throw new Error(`Error de Stripe: ${error.message}`);
    }
  },

  /**
   * Crear cliente de Stripe
   */
  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: metadata || {},
      });

      console.log(`✅ Cliente Stripe creado: ${customer.id}`);
      return customer;
    } catch (error: any) {
      console.error('Error creando cliente:', error);
      throw new Error(`Error de Stripe: ${error.message}`);
    }
  },

  /**
   * Validar webhook de Stripe
   */
  constructWebhookEvent(
    payload: string | Buffer, 
    signature: string
  ): Stripe.Event {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET no configurado');
      }

      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      return event;
    } catch (error: any) {
      console.error('Error validando webhook:', error);
      throw new Error(`Webhook inválido: ${error.message}`);
    }
  },

  /**
   * Validar monto mínimo para una moneda
   */
  validateMinimumAmount(amount: number, currency: string = 'cop'): {
    isValid: boolean;
    formattedAmount: number;
    adjustedAmount: number;
    minimum: number;
    message?: string;
  } {
    const normalizedCurrency = currency.toLowerCase();
    const formattedAmount = this.formatAmountForStripe(amount, normalizedCurrency);
    const minimum = MINIMUM_AMOUNTS[normalizedCurrency] || 50;
    const adjustedAmount = Math.max(formattedAmount, minimum);

    if (formattedAmount < minimum) {
      return {
        isValid: false,
        formattedAmount,
        adjustedAmount,
        minimum,
        message: `El monto ${amount} ${normalizedCurrency.toUpperCase()} (${formattedAmount} formateado) es inferior al mínimo de ${minimum}`
      };
    }

    return {
      isValid: true,
      formattedAmount,
      adjustedAmount: formattedAmount,
      minimum
    };
  },

  /**
   * Obtener monto mínimo para una moneda
   */
  getMinimumAmount(currency: string = 'cop'): number {
    return MINIMUM_AMOUNTS[currency.toLowerCase()] || 50;
  }
};

export default stripe;