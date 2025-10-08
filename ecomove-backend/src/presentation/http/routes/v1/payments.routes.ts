// backend/src/routes/api/v1/payments/payments.routes.ts - CORREGIDO
import { Router } from 'express';
import { AuthenticationMiddleware } from '../../middleware/authentication.middleware';
import { DIContainer } from '../../../../config/container';
import { stripeService } from '../../../../services/stripeService';

export class PaymentsRoutes {
  static create(): Router {
    const router = Router();
    const container = DIContainer.getInstance();
    const authMiddleware = container.getAuthMiddleware();

    // Health check
    router.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Módulo de pagos funcionando con Stripe real',
        timestamp: new Date().toISOString(),
        stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
        minimumAmounts: {
          COP: stripeService.getMinimumAmount('cop'),
          USD: stripeService.getMinimumAmount('usd'),
          MXN: stripeService.getMinimumAmount('mxn'),
        }
      });
    });

    // Crear Payment Intent REAL con Stripe
    router.post('/create-intent',
      authMiddleware.authenticate,
      async (req, res) => {
        try {
          const { amount, currency = 'cop', metadata } = req.body;
          const userId = (req as any).user?.id;

          // Validar que el monto sea un número válido
          if (!amount || isNaN(amount) || amount <= 0) {
            res.status(400).json({
              success: false,
              message: 'Monto inválido',
              code: 'INVALID_AMOUNT'
            });
            return;
          }

          // Validar monto mínimo antes de crear el Payment Intent
          const validation = stripeService.validateMinimumAmount(amount, currency);
          
          if (!validation.isValid) {
            console.warn(`⚠️ Monto inferior al mínimo:`);
            console.warn(`   Monto original: ${amount} ${currency.toUpperCase()}`);
            console.warn(`   Monto formateado: ${validation.formattedAmount}`);
            console.warn(`   Mínimo requerido: ${validation.minimum}`);
            
            res.status(400).json({
              success: false,
              message: validation.message,
              code: 'AMOUNT_TOO_SMALL',
              data: {
                originalAmount: amount,
                formattedAmount: validation.formattedAmount,
                minimum: validation.minimum,
                currency: currency.toUpperCase()
              }
            });
            return;
          }

          console.log(`💳 Creando Payment Intent REAL para usuario ${userId}`);
          console.log(`   Monto original: ${amount} ${currency.toUpperCase()}`);
          console.log(`   Monto formateado: ${validation.formattedAmount}`);
          console.log(`   Mínimo requerido: ${validation.minimum}`);

          // Crear Payment Intent (el servicio ya formatea el monto internamente)
          const paymentIntent = await stripeService.createPaymentIntent(
            amount, // Pasar el monto original, el servicio lo formatea
            currency,
            {
              userId: userId?.toString() || '',
              ...metadata
            }
          );

          console.log(`✅ Payment Intent creado en Stripe: ${paymentIntent.id}`);

          res.json({
            success: true,
            message: 'Payment Intent creado',
            data: {
              clientSecret: paymentIntent.client_secret,
              paymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              wasAdjusted: !validation.isValid,
              originalAmount: amount,
              adjustedAmount: validation.adjustedAmount
            }
          });
        } catch (error: any) {
          console.error('❌ Error creating payment intent:', error);
          
          // Proporcionar mensajes de error más específicos
          let errorMessage = 'Error al crear Payment Intent';
          let errorCode = 'PAYMENT_INTENT_ERROR';
          
          if (error.message.includes('amount_too_small') || error.message.includes('mínimo')) {
            errorMessage = error.message;
            errorCode = 'AMOUNT_TOO_SMALL';
          } else if (error.message.includes('currency')) {
            errorMessage = 'Moneda no soportada';
            errorCode = 'INVALID_CURRENCY';
          }

          res.status(500).json({
            success: false,
            message: errorMessage,
            code: errorCode,
            error: error.message
          });
        }
      }
    );

    // Guardar método de pago
    router.post('/save-method',
      authMiddleware.authenticate,
      async (req, res) => {
        try {
          const { paymentMethodId } = req.body;
          const userId = (req as any).user?.id;

          if (!paymentMethodId) {
            res.status(400).json({
              success: false,
              message: 'Payment Method ID es requerido',
              code: 'MISSING_PAYMENT_METHOD'
            });
            return;
          }

          console.log(`💾 Guardando método de pago para usuario ${userId}:`, paymentMethodId);

          // Aquí puedes guardar en tu base de datos
          // await paymentMethodRepository.save({ userId, paymentMethodId });

          res.json({
            success: true,
            message: 'Método de pago guardado',
            data: { paymentMethodId }
          });
        } catch (error: any) {
          console.error('Error saving payment method:', error);
          res.status(500).json({
            success: false,
            message: 'Error al guardar método de pago',
            code: 'SAVE_METHOD_ERROR',
            error: error.message
          });
        }
      }
    );

    // Confirmar pago (validar que se completó)
    router.post('/confirm-payment',
      authMiddleware.authenticate,
      async (req, res) => {
        try {
          const { paymentIntentId, amount } = req.body;
          const userId = (req as any).user?.id;

          if (!paymentIntentId) {
            res.status(400).json({
              success: false,
              message: 'Payment Intent ID es requerido',
              code: 'MISSING_PAYMENT_INTENT'
            });
            return;
          }

          console.log(`🔍 Validando pago para usuario ${userId}`);
          console.log(`   Payment Intent ID: ${paymentIntentId}`);

          // Obtener el Payment Intent de Stripe para validar
          const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);

          if (paymentIntent.status === 'succeeded') {
            console.log(`✅ Pago confirmado exitosamente`);
            console.log(`   Monto: ${paymentIntent.amount} ${paymentIntent.currency.toUpperCase()}`);

            res.json({
              success: true,
              message: 'Pago confirmado exitosamente',
              data: {
                status: paymentIntent.status,
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency
              }
            });
          } else {
            console.log(`⚠️ Pago en estado: ${paymentIntent.status}`);

            res.status(400).json({
              success: false,
              message: 'El pago no se ha completado',
              code: 'PAYMENT_NOT_COMPLETED',
              data: {
                status: paymentIntent.status
              }
            });
          }
        } catch (error: any) {
          console.error('Error confirming payment:', error);
          res.status(500).json({
            success: false,
            message: 'Error al confirmar pago',
            code: 'CONFIRM_PAYMENT_ERROR',
            error: error.message
          });
        }
      }
    );

    // Webhook de Stripe (para eventos en tiempo real)
    router.post('/webhook',
      async (req, res) => {
        const signature = req.headers['stripe-signature'] as string;

        try {
          const event = stripeService.constructWebhookEvent(
            req.body,
            signature
          );

          console.log(`📨 Webhook recibido: ${event.type}`);

          // Manejar eventos
          switch (event.type) {
            case 'payment_intent.succeeded':
              const paymentIntent = event.data.object as any;
              console.log('✅ Pago exitoso:', paymentIntent.id);
              console.log(`   Monto: ${paymentIntent.amount} ${paymentIntent.currency.toUpperCase()}`);
              // Actualizar tu base de datos aquí
              break;

            case 'payment_intent.payment_failed':
              const failedPayment = event.data.object as any;
              console.log('❌ Pago fallido:', failedPayment.id);
              console.log(`   Error: ${failedPayment.last_payment_error?.message}`);
              // Notificar al usuario
              break;

            case 'payment_intent.canceled':
              const canceledPayment = event.data.object as any;
              console.log('🚫 Pago cancelado:', canceledPayment.id);
              break;

            default:
              console.log(`ℹ️ Evento no manejado: ${event.type}`);
          }

          res.json({ received: true });
        } catch (error: any) {
          console.error('❌ Error en webhook:', error);
          res.status(400).json({ error: `Webhook error: ${error.message}` });
        }
      }
    );

    // Endpoint para validar monto antes de procesar
    router.post('/validate-amount',
      authMiddleware.authenticate,
      async (req, res) => {
        try {
          const { amount, currency = 'cop' } = req.body;

          const validation = stripeService.validateMinimumAmount(amount, currency);

          res.json({
            success: true,
            data: {
              isValid: validation.isValid,
              originalAmount: amount,
              adjustedAmount: validation.adjustedAmount,
              minimum: validation.minimum,
              currency: currency.toUpperCase(),
              message: validation.message
            }
          });
        } catch (error: any) {
          res.status(500).json({
            success: false,
            message: 'Error validando monto',
            error: error.message
          });
        }
      }
    );

    return router;
  }
}