# Guía de Instalación - Integración con Stripe

## 📦 Paso 1: Instalar dependencias del Frontend

```bash
# En la carpeta de tu proyecto React
npm install @stripe/stripe-js @stripe/react-stripe-js
```

## 📦 Paso 2: Instalar dependencias del Backend

```bash
# En la carpeta de tu backend Node.js
npm install stripe
```

## 🔑 Paso 3: Obtener credenciales de Stripe

1. **Crear cuenta en Stripe:**
   - Ve a https://stripe.com
   - Crea una cuenta o inicia sesión
   - Activa el modo de prueba (Test Mode)

2. **Obtener API Keys:**
   - Ve a Developers → API Keys
   - Copia la **Publishable Key** (comienza con `pk_test_`)
   - Copia la **Secret Key** (comienza con `sk_test_`)

3. **Configurar Webhook (opcional pero recomendado):**
   - Ve a Developers → Webhooks
   - Click en "Add endpoint"
   - URL: `https://tu-dominio.com/api/v1/payments/webhook`
   - Selecciona eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copia el **Webhook Secret** (comienza con `whsec_`)

## ⚙️ Paso 4: Configurar variables de entorno

### Frontend (.env)
```env
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_TU_CLAVE_PUBLICA_AQUI
```

### Backend (.env)
```env
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_AQUI
```

### Stripe WEBHOOK_SECRET se consigue instalando STRIPE

https://github.com/stripe/stripe-cli/releases/tag/v1.31.0

descargar y extraer el zip, luego copiar la ruta a la variable de entorno (al computador, no al usuario)

tu-ruta\stripe_1.31.0_windows_x86_64

### Abrir CMD

EJECUTAR 

stripe login 

o

"tu ruta\stripe_1.31.0_windows_x86_64\stripe.exe" login

iniciar sesion y dar acceso

luego ejecutar este comando

stripe listen --forward-to localhost:4000/webhook

(reemplaza el puerto segun lo necesites)

una vez hecho eso podras ver tu WEBHOOK_SECRET

## 📝 Paso 5: Actualizar archivos

### 1. Actualizar `stripeService.ts`

Reemplaza la línea:
```typescript
const STRIPE_PUBLIC_KEY = 'pk_test_TU_CLAVE_PUBLICA_AQUI';
```

Por:
```typescript
const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY || '';
```

### 2. Agregar ruta en el backend (`server.js` o `app.js`)

```javascript
const paymentsRoutes = require('./routes/payments.routes');

// Middleware para webhook (DEBE IR ANTES del express.json())
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

// Otras rutas
app.use(express.json());
app.use('/api/v1/payments', paymentsRoutes);
```

### 3. Actualizar interfaz PaymentData en UserDashboard

En el archivo `UserDashboard.tsx`, actualiza la interfaz:

```typescript
interface PaymentData {
  method: 'cash' | 'stripe';
  // Efectivo
  nearestStation?: string;
  // Stripe
  stripePaymentIntentId?: string;
  stripePaymentMethodId?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardholderName?: string;
  // Común
  transactionId?: string;
  reference?: string;
}
```

## 🧪 Paso 6: Probar la integración

### Tarjetas de prueba de Stripe:

| Escenario | Número de tarjeta | Fecha | CVV | ZIP |
|-----------|------------------|-------|-----|-----|
| Pago exitoso | 4242 4242 4242 4242 | 12/34 | 123 | 12345 |
| Pago rechazado | 4000 0000 0000 0002 | 12/34 | 123 | 12345 |
| 3D Secure | 4000 0027 6000 3184 | 12/34 | 123 | 12345 |

### Flujo de prueba:

1. **Iniciar préstamo:**
   - Selecciona un vehículo
   - Inicia el préstamo

2. **Completar con Stripe:**
   - Click en "Completar Préstamo"
   - Selecciona estación de destino
   - Elige "Tarjeta (Stripe)"
   - Ingresa datos de tarjeta de prueba
   - Confirma el pago

3. **Verificar en Stripe Dashboard:**
   - Ve a Payments en tu dashboard de Stripe
   - Verifica que el pago aparezca

## 🔐 Seguridad - Consideraciones importantes

### ✅ Buenas prácticas:

1. **NUNCA** expongas las claves secretas en el frontend
2. **SIEMPRE** valida los pagos en el backend antes de confirmar préstamos
3. **USA** webhooks para confirmar pagos (más seguro que confiar solo en el frontend)
4. **IMPLEMENTA** validación de montos en el backend
5. **GUARDA** los Payment Intent IDs en tu base de datos

### ⚠️ Validación en el backend:

```javascript
// En el endpoint de completar préstamo
router.put('/loans/:id/completar', authenticateToken, async (req, res) => {
  const { metodo_pago, datos_pago } = req.body;
  
  // Si es Stripe, verificar el pago
  if (metodo_pago === 'stripe') {
    const { stripePaymentIntentId } = datos_pago;
    
    // Verificar con Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      stripePaymentIntentId
    );
    
    // Validar que el pago fue exitoso
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'El pago no se completó'
      });
    }
    
    // Validar el monto
    const expectedAmount = calculateLoanCost(loanId);
    if (paymentIntent.amount !== expectedAmount * 100) {
      return res.status(400).json({
        success: false,
        message: 'El monto del pago no coincide'
      });
    }
  }
  
  // Continuar con completar el préstamo...
});
```

## 📊 Monitoreo

1. **Dashboard de Stripe:**
   - Monitorea pagos en tiempo real
   - Revisa pagos fallidos
   - Gestiona reembolsos

2. **Logs del servidor:**
   - Registra todos los eventos de pago
   - Monitorea webhooks

3. **Base de datos:**
   - Guarda referencias de Payment Intents
   - Mantén registro de métodos de pago

## 🚀 Pasar a producción

Cuando estés listo para producción:

1. **Activar modo Live en Stripe**
2. **Obtener nuevas API Keys de producción**
3. **Actualizar variables de entorno**
4. **Configurar webhook en URL de producción**
5. **Probar con tarjetas reales**
6. **Implementar sistema de reembolsos**
7. **Configurar alertas de fraude**

## 📞 Soporte

- Documentación Stripe: https://stripe.com/docs
- API Reference: https://stripe.com/docs/api
- Dashboard: https://dashboard.stripe.com