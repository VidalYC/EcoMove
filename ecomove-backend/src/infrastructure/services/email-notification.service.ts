import { injectable } from 'inversify';
import nodemailer, { Transporter } from 'nodemailer';
import { NotificationService } from '../../core/domain/services/notification.service';

@injectable()
export class EmailNotificationService implements NotificationService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = this.initializeTransporter();
  }

  private initializeTransporter(): boolean {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.warn('⚠️  SMTP not configured - Email notifications will be simulated');
      return false;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      console.log('✅ Email service configured successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error);
      return false;
    }
  }

  async sendProfileUpdatedEmail(
    userEmail: string,
    userName: string,
    changes: Record<string, { old: string; new: string }>
  ): Promise<void> {
    const subject = '✅ Perfil Actualizado - EcoMove';
    const changesText = Object.entries(changes)
      .map(([field, { old, new: newValue }]) => {
        const fieldName = this.translateFieldName(field);
        return `• ${fieldName} actualizado: "${old}" → "${newValue}"`;
      })
      .join('\n');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .changes { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Perfil Actualizado</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Tu perfil en <strong>EcoMove</strong> ha sido actualizado exitosamente.</p>
            
            <div class="changes">
              <h3>📝 Cambios realizados:</h3>
              <pre style="font-family: Arial, sans-serif; white-space: pre-line;">${changesText}</pre>
            </div>

            <div class="warning">
              <strong>🔒 Aviso de Seguridad:</strong> Si no realizaste estos cambios, 
              por favor contacta inmediatamente a nuestro equipo de soporte.
            </div>

            <a href="${process.env.APP_URL || 'http://localhost:5173'}/profile" class="button">
              Ver Mi Perfil
            </a>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} EcoMove - Movilidad Sostenible</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Hola ${userName},

Tu perfil en EcoMove ha sido actualizado exitosamente.

Cambios realizados:
${changesText}

🔒 Aviso de Seguridad: Si no realizaste estos cambios, por favor contacta inmediatamente a nuestro equipo de soporte.

Ver mi perfil: ${process.env.APP_URL || 'http://localhost:5173'}/profile

---
Este es un correo automático, por favor no responder.
© ${new Date().getFullYear()} EcoMove - Movilidad Sostenible
    `.trim();

    await this.sendEmail(userEmail, subject, textContent, htmlContent);
  }

  async sendLoanStartedEmail(
    userEmail: string,
    loanDetails: {
      userName?: string;
      loanId: string;
      transportType: string;
      transportCode: string;
      startStation: string;
      startTime: Date;
      estimatedEndTime?: Date;
      estimatedCost?: number;
    }
  ): Promise<void> {
    const userName = loanDetails.userName || 'Usuario';
    const subject = '🚴 Préstamo Iniciado - EcoMove';
    const formattedStartTime = loanDetails.startTime.toLocaleString('es-ES');
    const formattedEndTime = loanDetails.estimatedEndTime?.toLocaleString('es-ES');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .info-box { background: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 15px; margin-top: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚴 ¡Préstamo Iniciado!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Tu préstamo ha sido iniciado exitosamente. Aquí están los detalles:</p>
            
            <div class="details">
              <h3>📋 Detalles del Préstamo</h3>
              <div class="detail-row">
                <span><strong>ID Préstamo:</strong></span>
                <span>${loanDetails.loanId}</span>
              </div>
              <div class="detail-row">
                <span><strong>Transporte:</strong></span>
                <span>${loanDetails.transportType} - ${loanDetails.transportCode}</span>
              </div>
              <div class="detail-row">
                <span><strong>Estación de Inicio:</strong></span>
                <span>${loanDetails.startStation}</span>
              </div>
              <div class="detail-row">
                <span><strong>Hora de Inicio:</strong></span>
                <span>${formattedStartTime}</span>
              </div>
              ${formattedEndTime ? `
              <div class="detail-row">
                <span><strong>Hora Estimada de Fin:</strong></span>
                <span>${formattedEndTime}</span>
              </div>
              ` : ''}
              ${loanDetails.estimatedCost ? `
              <div class="detail-row">
                <span><strong>Costo Estimado:</strong></span>
                <span>$${loanDetails.estimatedCost.toFixed(2)}</span>
              </div>
              ` : ''}
            </div>

            <div class="info-box">
              <strong>💡 Recuerda:</strong> Devuelve el transporte en cualquier estación disponible 
              para finalizar tu préstamo.
            </div>

            <a href="${process.env.APP_URL || 'http://localhost:5173'}/loans/${loanDetails.loanId}" class="button">
              Ver Detalles del Préstamo
            </a>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} EcoMove - Movilidad Sostenible</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Hola ${userName},

¡Tu préstamo ha sido iniciado exitosamente!

Detalles del Préstamo:
• ID Préstamo: ${loanDetails.loanId}
• Transporte: ${loanDetails.transportType} - ${loanDetails.transportCode}
• Estación de Inicio: ${loanDetails.startStation}
• Hora de Inicio: ${formattedStartTime}
${formattedEndTime ? `• Hora Estimada de Fin: ${formattedEndTime}` : ''}
${loanDetails.estimatedCost ? `• Costo Estimado: $${loanDetails.estimatedCost.toFixed(2)}` : ''}

💡 Recuerda: Devuelve el transporte en cualquier estación disponible para finalizar tu préstamo.

Ver detalles: ${process.env.APP_URL || 'http://localhost:5173'}/loans/${loanDetails.loanId}

---
Este es un correo automático, por favor no responder.
© ${new Date().getFullYear()} EcoMove - Movilidad Sostenible
    `.trim();

    await this.sendEmail(userEmail, subject, textContent, htmlContent);
  }

  async sendLoanEndedEmail(
    userEmail: string,
    loanSummary: {
      userName?: string;
      loanId: string;
      transportType: string;
      transportCode: string;
      startStation: string;
      endStation: string;
      startTime: Date;
      endTime: Date;
      duration: string;
      totalCost: number;
      distance?: number;
    }
  ): Promise<void> {
    const userName = loanSummary.userName || 'Usuario';
    const subject = '✅ Préstamo Finalizado - EcoMove';
    const formattedStartTime = loanSummary.startTime.toLocaleString('es-ES');
    const formattedEndTime = loanSummary.endTime.toLocaleString('es-ES');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .summary { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .total { background: #f0fdf4; padding: 15px; border-radius: 5px; margin-top: 20px; text-align: center; }
          .total-amount { font-size: 32px; font-weight: bold; color: #10b981; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .eco-impact { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin-top: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Préstamo Finalizado</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Tu préstamo ha sido finalizado exitosamente. Gracias por usar EcoMove.</p>
            
            <div class="summary">
              <h3>📊 Resumen del Viaje</h3>
              <div class="detail-row">
                <span><strong>ID Préstamo:</strong></span>
                <span>${loanSummary.loanId}</span>
              </div>
              <div class="detail-row">
                <span><strong>Transporte:</strong></span>
                <span>${loanSummary.transportType} - ${loanSummary.transportCode}</span>
              </div>
              <div class="detail-row">
                <span><strong>Estación de Inicio:</strong></span>
                <span>${loanSummary.startStation}</span>
              </div>
              <div class="detail-row">
                <span><strong>Estación de Fin:</strong></span>
                <span>${loanSummary.endStation}</span>
              </div>
              <div class="detail-row">
                <span><strong>Hora de Inicio:</strong></span>
                <span>${formattedStartTime}</span>
              </div>
              <div class="detail-row">
                <span><strong>Hora de Fin:</strong></span>
                <span>${formattedEndTime}</span>
              </div>
              <div class="detail-row">
                <span><strong>Duración:</strong></span>
                <span>${loanSummary.duration}</span>
              </div>
              ${loanSummary.distance ? `
              <div class="detail-row">
                <span><strong>Distancia:</strong></span>
                <span>${loanSummary.distance.toFixed(2)} km</span>
              </div>
              ` : ''}
            </div>

            <div class="total">
              <p style="margin: 0 0 10px 0; color: #666;">Costo Total</p>
              <div class="total-amount">$${loanSummary.totalCost.toFixed(2)}</div>
            </div>

            <div class="eco-impact">
              <strong>🌱 Impacto Ambiental:</strong> Gracias por elegir movilidad sostenible. 
              ¡Estás contribuyendo a un planeta más limpio!
            </div>

            <a href="${process.env.APP_URL || 'http://localhost:5173'}/loans/${loanSummary.loanId}" class="button">
              Ver Recibo Completo
            </a>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} EcoMove - Movilidad Sostenible</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Hola ${userName},

Tu préstamo ha sido finalizado exitosamente. Gracias por usar EcoMove.

Resumen del Viaje:
• ID Préstamo: ${loanSummary.loanId}
• Transporte: ${loanSummary.transportType} - ${loanSummary.transportCode}
• Estación de Inicio: ${loanSummary.startStation}
• Estación de Fin: ${loanSummary.endStation}
• Hora de Inicio: ${formattedStartTime}
• Hora de Fin: ${formattedEndTime}
• Duración: ${loanSummary.duration}
${loanSummary.distance ? `• Distancia: ${loanSummary.distance.toFixed(2)} km` : ''}

Costo Total: $${loanSummary.totalCost.toFixed(2)}

🌱 Impacto Ambiental: Gracias por elegir movilidad sostenible. ¡Estás contribuyendo a un planeta más limpio!

Ver recibo completo: ${process.env.APP_URL || 'http://localhost:5173'}/loans/${loanSummary.loanId}

---
Este es un correo automático, por favor no responder.
© ${new Date().getFullYear()} EcoMove - Movilidad Sostenible
    `.trim();

    await this.sendEmail(userEmail, subject, textContent, htmlContent);
  }

  async sendPaymentConfirmation(
    userEmail: string,
    paymentDetails: {
      userName?: string;
      loanId: string;
      amount: number;
      paymentMethod: string;
      transactionId: string;
      timestamp: Date;
    }
  ): Promise<void> {
    const userName = paymentDetails.userName || 'Usuario';
    const subject = '💳 Confirmación de Pago - EcoMove';
    const formattedTimestamp = paymentDetails.timestamp.toLocaleString('es-ES');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .payment-details { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .amount { background: #f0fdf4; padding: 15px; border-radius: 5px; margin-top: 20px; text-align: center; }
          .amount-value { font-size: 32px; font-weight: bold; color: #10b981; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Pago Confirmado</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Tu pago ha sido procesado exitosamente.</p>
            
            <div class="payment-details">
              <h3>📋 Detalles del Pago</h3>
              <div class="detail-row">
                <span><strong>ID Préstamo:</strong></span>
                <span>${paymentDetails.loanId}</span>
              </div>
              <div class="detail-row">
                <span><strong>ID Transacción:</strong></span>
                <span>${paymentDetails.transactionId}</span>
              </div>
              <div class="detail-row">
                <span><strong>Método de Pago:</strong></span>
                <span>${paymentDetails.paymentMethod}</span>
              </div>
              <div class="detail-row">
                <span><strong>Fecha y Hora:</strong></span>
                <span>${formattedTimestamp}</span>
              </div>
            </div>

            <div class="amount">
              <p style="margin: 0 0 10px 0; color: #666;">Monto Pagado</p>
              <div class="amount-value">$${paymentDetails.amount.toFixed(2)}</div>
            </div>

            <a href="${process.env.APP_URL || 'http://localhost:5173'}/loans/${paymentDetails.loanId}" class="button">
              Ver Recibo
            </a>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} EcoMove - Movilidad Sostenible</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Hola ${userName},

Tu pago ha sido procesado exitosamente.

Detalles del Pago:
• ID Préstamo: ${paymentDetails.loanId}
• ID Transacción: ${paymentDetails.transactionId}
• Método de Pago: ${paymentDetails.paymentMethod}
• Fecha y Hora: ${formattedTimestamp}

Monto Pagado: $${paymentDetails.amount.toFixed(2)}

Ver recibo: ${process.env.APP_URL || 'http://localhost:5173'}/loans/${paymentDetails.loanId}

---
Este es un correo automático, por favor no responder.
© ${new Date().getFullYear()} EcoMove - Movilidad Sostenible
    `.trim();

    await this.sendEmail(userEmail, subject, textContent, htmlContent);
  }

  async sendLoanReminder(
    userEmail: string,
    reminderInfo: {
      userName?: string;
      loanId: string;
      transportType: string;
      transportCode: string;
      startTime: Date;
      currentDuration: string;
      reminderType: 'time' | 'battery' | 'cost';
      message: string;
    }
  ): Promise<void> {
    const userName = reminderInfo.userName || 'Usuario';
    const subject = '⏰ Recordatorio de Préstamo - EcoMove';
    const formattedStartTime = reminderInfo.startTime.toLocaleString('es-ES');

    const reminderIcons: Record<string, string> = {
      time: '⏰',
      battery: '🔋',
      cost: '💰'
    };

    const icon = reminderIcons[reminderInfo.reminderType] || '⏰';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reminder-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${icon} Recordatorio de Préstamo</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            
            <div class="reminder-box">
              <h3>${icon} ${reminderInfo.message}</h3>
            </div>

            <div class="details">
              <h3>📋 Información del Préstamo Activo</h3>
              <div class="detail-row">
                <span><strong>ID Préstamo:</strong></span>
                <span>${reminderInfo.loanId}</span>
              </div>
              <div class="detail-row">
                <span><strong>Transporte:</strong></span>
                <span>${reminderInfo.transportType} - ${reminderInfo.transportCode}</span>
              </div>
              <div class="detail-row">
                <span><strong>Hora de Inicio:</strong></span>
                <span>${formattedStartTime}</span>
              </div>
              <div class="detail-row">
                <span><strong>Duración Actual:</strong></span>
                <span>${reminderInfo.currentDuration}</span>
              </div>
            </div>

            <p><strong>💡 Consejo:</strong> Encuentra la estación más cercana para devolver tu transporte.</p>

            <a href="${process.env.APP_URL || 'http://localhost:5173'}/stations" class="button">
              Ver Estaciones Cercanas
            </a>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} EcoMove - Movilidad Sostenible</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Hola ${userName},

${icon} ${reminderInfo.message}

Información del Préstamo Activo:
• ID Préstamo: ${reminderInfo.loanId}
• Transporte: ${reminderInfo.transportType} - ${reminderInfo.transportCode}
• Hora de Inicio: ${formattedStartTime}
• Duración Actual: ${reminderInfo.currentDuration}

💡 Consejo: Encuentra la estación más cercana para devolver tu transporte.

Ver estaciones cercanas: ${process.env.APP_URL || 'http://localhost:5173'}/stations

---
Este es un correo automático, por favor no responder.
© ${new Date().getFullYear()} EcoMove - Movilidad Sostenible
    `.trim();

    await this.sendEmail(userEmail, subject, textContent, htmlContent);
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string
  ): Promise<void> {
    if (!this.isConfigured || !this.transporter) {
      console.log('\n📧 [SIMULATED EMAIL]');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   (SMTP not configured - email simulation only)\n`);
      return;
    }

    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'EcoMove'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to}`);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      // No lanzar error para que la operación principal no falle
    }
  }

  private translateFieldName(field: string): string {
    const translations: Record<string, string> = {
      name: 'Nombre',
      phone: 'Teléfono',
      email: 'Correo electrónico',
      address: 'Dirección',
    };
    return translations[field] || field;
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }
}