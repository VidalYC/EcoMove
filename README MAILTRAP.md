# 📧 Sistema de Notificaciones por Email - EcoMove

Sistema completo de notificaciones por correo electrónico con plantillas HTML profesionales para la aplicación EcoMove.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Tipos de Emails](#tipos-de-emails)
- [Uso](#uso)
- [Desarrollo vs Producción](#desarrollo-vs-producción)
- [Troubleshooting](#troubleshooting)

---

## ✨ Características

- ✅ **5 tipos de notificaciones** por email
- 🎨 **Plantillas HTML profesionales** con diseño responsive
- 📱 **Compatible con todos los clientes** de correo
- 🔧 **Fácil configuración** con variables de entorno
- 🧪 **Modo desarrollo** con Mailtrap
- 🚀 **Listo para producción** con múltiples proveedores SMTP
- 🎭 **Modo simulación** sin configuración SMTP

---

## 📦 Requisitos Previos

- Node.js >= 14.x
- TypeScript
- Nodemailer (ya incluido)
- Cuenta de Mailtrap (para desarrollo) - **GRATIS**
- O cualquier proveedor SMTP (para producción)

---

## 🚀 Instalación

### 1. **Dependencias ya instaladas** ✅

El proyecto ya incluye todas las dependencias necesarias:

npm install  

npm install inversify reflect-metadata 
npm install nodemailer
npm install --save-dev @types/nodemailer

### En caso de fallo en la instalacion

### Eliminar node_modules y package-lock.json en PowerShell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

### Ahora instala las dependencias
npm install

### Instala las dependencias específicas que faltan
npm install inversify reflect-metadata
npm install nodemailer
npm install --save-dev @types/nodemailer

### Reinicia el servidor
npm run dev

### Paso 1: Reinicia el servidor TypeScript en VS Code

1. Presiona Ctrl + Shift + P
2. Escribe: TypeScript: Restart TS Server
3. Presiona Enter

### Paso 2: Recargar VS Code completamente
Si el error persiste:

1. Presiona Ctrl + Shift + P
2. Escribe: Developer: Reload Window
3. Presiona Enter

### Ya deberia de funcionar

### 2. **Archivos del sistema**

El sistema incluye los siguientes archivos:

```
ecomove-backend/
├── src/
│   ├── core/
│   │   ├── domain/
│   │   │   └── services/
│   │   │       └── notification.service.ts          # Interfaz
│   │   └── use-cases/
│   │       └── user/
│   │           └── update-user-profile.use-case.ts  # Implementación
│   ├── infrastructure/
│   │   └── services/
│   │       └── email-notification.service.ts        # Servicio de email
│   └── config/
│       └── container.ts                             # Inyección de dependencias
└── .env                                             # Configuración
```

---

## ⚙️ Configuración

### **Opción 1: Mailtrap (Recomendado para Desarrollo)**

#### Paso 1: Crear cuenta en Mailtrap

1. Ve a: https://mailtrap.io/signin
2. Regístrate gratis (puedes usar Google)
3. Crea un inbox

#### Paso 2: Obtener credenciales

1. En Mailtrap, ve a **"My Inbox"**
2. Selecciona **"SMTP Settings"**
3. En el dropdown elige **"Nodemailer"**
4. Copia `user` y `pass`

#### Paso 3: Configurar el  `.env` del backend

```properties

NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecomove
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=67e2e106f264e2b9890bd2c76cc4c8cb2457452489032536339b57ed0f86f1f50ebc8e4a3134c94343b1d3aa9f879be44abdc2186e68c22d1792d719bbd57b3c
JWT_EXPIRES_IN=24h
LOG_LEVEL=debug
STRIPE_SECRET_KEY=sk_test_51SF3AaF4yhK50E48fXC1UKloxEr3T0KCoZsNXvuzlpAHtd4D687qnZGTdLszQmFGZ7A4Cw6V98kBuadURno1psRD00T0YZcxRU
STRIPE_WEBHOOK_SECRET=whsec_530631f00a988edcfaabc60ffe2e872d45c543ccc5b2a9203b3bab1199d891da

# ============================================
# EMAIL CONFIGURATION - MAILTRAP (DEVELOPMENT)
# ============================================
NODE_ENV=development
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=tu_username_aqui        # ← Del paso 2
SMTP_PASSWORD=tu_password_aqui     # ← Del paso 2
SMTP_FROM_NAME=EcoMove
SMTP_FROM_EMAIL=noreply@ecomove.com
APP_URL=http://localhost:5173
```

### **Opción 2: Modo Simulación (Sin configuración)**

```properties
# Deja los campos vacíos o coméntalos
# SMTP_HOST=
# SMTP_USER=
# SMTP_PASSWORD=
```

### Ya Terminaste la configuracion

**Resultado:** Los emails se imprimirán en consola sin enviarse.

---

## 📧 Tipos de Emails

El sistema incluye 5 tipos de notificaciones:

### 1. **✅ Perfil Actualizado**

Se envía cuando un usuario actualiza su información personal.

**Disparador:** `updateUserProfileUseCase.execute()`

**Contenido:**
- Nombre del usuario
- Lista de cambios realizados (nombre, teléfono, etc.)
- Aviso de seguridad
- Botón para ver perfil

### 2. **🚴 Préstamo Iniciado**

Se envía cuando un usuario inicia un préstamo de transporte.

**Método:** `sendLoanStartedEmail()`

**Contenido:**
- Detalles del transporte
- Estación de inicio
- Hora de inicio
- Costo estimado
- Botón para ver detalles del préstamo

### 3. **✅ Préstamo Finalizado**

Se envía cuando un usuario finaliza un préstamo.

**Método:** `sendLoanEndedEmail()`

**Contenido:**
- Resumen completo del viaje
- Estaciones de inicio y fin
- Duración del viaje
- Costo total
- Impacto ambiental
- Botón para ver recibo

### 4. **💳 Confirmación de Pago**

Se envía cuando se procesa un pago exitosamente.

**Método:** `sendPaymentConfirmation()`

**Contenido:**
- ID de transacción
- Monto pagado
- Método de pago
- Fecha y hora
- Botón para ver recibo

### 5. **⏰ Recordatorio de Préstamo**

Se envía para recordar al usuario sobre préstamos activos.

**Método:** `sendLoanReminder()`

**Tipos de recordatorio:**
- `time`: Por tiempo transcurrido
- `battery`: Por batería baja
- `cost`: Por costo acumulado

**Contenido:**
- Información del préstamo activo
- Duración actual
- Mensaje personalizado según tipo
- Botón para ver estaciones cercanas

---

## 🔨 Uso

### **Desde un Use Case**

```typescript
// En cualquier use case
export class MiUseCase {
  constructor(
    private readonly notificationService: NotificationService
  ) {}

  async execute() {
    // ... lógica del caso de uso ...

    // Enviar email de perfil actualizado
    await this.notificationService.sendProfileUpdatedEmail(
      'usuario@email.com',
      'Nombre Usuario',
      {
        name: { old: 'Nombre Viejo', new: 'Nombre Nuevo' },
        phone: { old: '123456', new: '789012' }
      }
    );

    // Enviar email de préstamo iniciado
    await this.notificationService.sendLoanStartedEmail(
      'usuario@email.com',
      {
        userName: 'Nombre Usuario',
        loanId: 'LOAN-123',
        transportType: 'Bicicleta',
        transportCode: 'BIC-001',
        startStation: 'Estación Central',
        startTime: new Date(),
        estimatedCost: 5000
      }
    );

    // Enviar email de préstamo finalizado
    await this.notificationService.sendLoanEndedEmail(
      'usuario@email.com',
      {
        userName: 'Nombre Usuario',
        loanId: 'LOAN-123',
        transportType: 'Bicicleta',
        transportCode: 'BIC-001',
        startStation: 'Estación Central',
        endStation: 'Estación Norte',
        startTime: new Date('2024-01-01 10:00:00'),
        endTime: new Date('2024-01-01 11:30:00'),
        duration: '1 hora 30 minutos',
        totalCost: 7500,
        distance: 5.2
      }
    );

    // Enviar confirmación de pago
    await this.notificationService.sendPaymentConfirmation(
      'usuario@email.com',
      {
        userName: 'Nombre Usuario',
        loanId: 'LOAN-123',
        amount: 7500,
        paymentMethod: 'Tarjeta de crédito',
        transactionId: 'TXN-456',
        timestamp: new Date()
      }
    );

    // Enviar recordatorio
    await this.notificationService.sendLoanReminder(
      'usuario@email.com',
      {
        userName: 'Nombre Usuario',
        loanId: 'LOAN-123',
        transportType: 'Bicicleta',
        transportCode: 'BIC-001',
        startTime: new Date(),
        currentDuration: '2 horas',
        reminderType: 'time',
        message: 'Llevas 2 horas con el transporte alquilado'
      }
    );
  }
}
```

### **Inyección de Dependencias**

El servicio ya está configurado en el contenedor DI:

```typescript
// src/config/container.ts
private initializeServices(): void {
  // ...
  this.notificationService = new EmailNotificationService();
}

// Obtener el servicio
const notificationService = container.getNotificationService();
```

---

## 🔄 Desarrollo vs Producción

### **Modo Desarrollo (Mailtrap)**

**Ventajas:**
- ✅ Los emails NO llegan a usuarios reales
- ✅ Puedes ver todos los emails en un dashboard
- ✅ Prueba el HTML/CSS sin riesgo
- ✅ Gratis (100 emails/mes)
- ✅ Sin configuración compleja

**Configuración:**
```properties
NODE_ENV=development
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
```

**Ver emails:** https://mailtrap.io/inboxes

### **Modo Producción (SMTP Real)**

**Configuración:**
```properties
NODE_ENV=production
SMTP_HOST=smtp.tuproveedor.com
SMTP_PORT=587
SMTP_USER=tu_usuario
SMTP_PASSWORD=tu_password
```

**Proveedores recomendados:**

| Proveedor | Gratis/mes | Precio | Confiabilidad |
|-----------|------------|--------|---------------|
| SendGrid  | 100 emails | $19.95/mes (40k) | ⭐⭐⭐⭐⭐ |
| Mailgun   | 5000 emails | $35/mes (50k) | ⭐⭐⭐⭐⭐ |
| AWS SES   | 62,000 emails | $0.10/1000 | ⭐⭐⭐⭐⭐ |
| Gmail     | Limitado | Gratis | ⭐⭐⭐ |

### **Modo Simulación (Sin SMTP)**

Si no configuras SMTP, los emails se imprimen en consola:

```
📧 [SIMULATED EMAIL]
   To: usuario@email.com
   Subject: ✅ Perfil Actualizado - EcoMove
   (SMTP not configured - email simulation only)
```

---

## 🎨 Personalización

### **Cambiar colores del email**

Edita `email-notification.service.ts`:

```typescript
// Perfil actualizado (morado)
.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

// Préstamo iniciado (verde)
.header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }

// Recordatorio (naranja)
.header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
```

### **Agregar nuevos campos**

```typescript
// En la interfaz de detalles
loanDetails: {
  userName?: string;
  loanId: string;
  // ✅ Agregar nuevo campo
  promoCode?: string;
  // ...
}

// En el HTML
${loanDetails.promoCode ? `
  <div class="detail-row">
    <span><strong>Código Promocional:</strong></span>
    <span>${loanDetails.promoCode}</span>
  </div>
` : ''}
```

### **Cambiar idioma**

Todas las plantillas están en español. Para cambiar a inglés:

```typescript
const subject = '✅ Profile Updated - EcoMove';
// ...
<h1>✅ Profile Updated</h1>
<p>Hello <strong>${userName}</strong>,</p>
<p>Your profile has been successfully updated.</p>
```

---

## 🐛 Troubleshooting

### **Problema: Error "Invalid login" con Gmail**

**Causa:** Gmail requiere contraseñas de aplicación, no tu contraseña normal.

**Solución:**
1. Activa verificación en 2 pasos: https://myaccount.google.com/security
2. Crea contraseña de aplicación: https://myaccount.google.com/apppasswords
3. Usa esa contraseña de 16 dígitos en `SMTP_PASSWORD`

### **Problema: Email muestra "undefined"**

**Causa:** El objeto de cambios no tiene la estructura correcta.

**Solución:**
```typescript
// ❌ Incorrecto
const changes = ['Nombre actualizado'];

// ✅ Correcto
const changes = {
  name: { old: 'Viejo', new: 'Nuevo' }
};
```

### **Problema: No llegan emails en Mailtrap**

**Verificar:**
1. ✅ Credenciales correctas en `.env`
2. ✅ Servidor reiniciado después de cambiar `.env`
3. ✅ Consola muestra: `✅ Email sent successfully`
4. ✅ Revisar inbox correcto en Mailtrap

**Logs esperados:**
```
✅ Email service configured successfully
✅ Email sent successfully to usuario@email.com
```

### **Problema: Email institucional (@universidad.edu) no funciona**

**Causa:** Emails institucionales no permiten SMTP externo.

**Solución:**
- Usa Mailtrap para desarrollo
- Usa Gmail personal/SendGrid para producción
- Contacta al departamento de IT de tu institución

### **Problema: HTML no se renderiza correctamente**

**Causa:** Algunos clientes de correo tienen limitaciones CSS.

**Solución:** Las plantillas usan:
- ✅ CSS inline (máxima compatibilidad)
- ✅ Tablas para layout (compatibilidad con Outlook)
- ✅ Colores hexadecimales
- ✅ Sin JavaScript

### **Verificar conexión SMTP**

```typescript
// En consola de Node.js o crear endpoint temporal
const container = DIContainer.getInstance();
const emailService = container.getNotificationService();

// Verificar conexión
const isConnected = await emailService.verifyConnection();
console.log('SMTP Connected:', isConnected);
```

---

## 📊 Logs y Monitoreo

### **Logs de desarrollo**

```bash
# Email enviado exitosamente
✅ Email service configured successfully
✅ Email sent successfully to usuario@email.com

# SMTP no configurado (modo simulación)
⚠️  SMTP not configured - Email notifications will be simulated
📧 [SIMULATED EMAIL]
   To: usuario@email.com
   Subject: ✅ Perfil Actualizado - EcoMove

# Error al enviar
❌ Error sending email: Error: Invalid login
```

### **Logs de producción**

Recomendación: Integrar con servicio de logging:
- Winston (ya incluido en el proyecto)
- Sentry
- CloudWatch
- Datadog

---

## 🔐 Seguridad

### **Variables de entorno**

✅ **Nunca** commitear el `.env` al repositorio

```bash
# .gitignore
.env
.env.local
.env.production
```

### **Producción**

- ✅ Usar variables de entorno del servidor
- ✅ Rotar credenciales periódicamente
- ✅ Limitar permisos de API keys
- ✅ Monitorear tasa de envío
- ✅ Implementar rate limiting

---

## 📚 Referencias

- [Nodemailer Documentation](https://nodemailer.com/)
- [Mailtrap Documentation](https://mailtrap.io/docs/)
- [SendGrid SMTP](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Email HTML Best Practices](https://www.emailonacid.com/blog/article/email-development/email-development-best-practices-2/)

---

## 📄 Licencia

Este sistema de notificaciones es parte del proyecto EcoMove.

---

## 👥 Soporte

Para problemas o preguntas:
- Revisa la sección [Troubleshooting](#troubleshooting)
- Verifica logs del servidor
- Contacta al equipo de desarrollo

---

## ✅ Checklist de Instalación

- [ ] Crear cuenta en Mailtrap
- [ ] Obtener credenciales SMTP
- [ ] Configurar `.env` con credenciales
- [ ] Reiniciar servidor backend
- [ ] Probar actualización de perfil
- [ ] Verificar email en inbox de Mailtrap
- [ ] Configurar proveedor de producción (opcional)

---

**🎉 ¡Sistema de notificaciones listo para usar!**