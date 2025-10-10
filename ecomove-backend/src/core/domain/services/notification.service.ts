// src/core/domain/services/notification.service.ts

export interface LoanCancellationInfo {
  userName: string;
  loanId: string;
  transportType: string;
  transportCode: string;
  startTime: Date;
  duration: string;
  cancellationFee: number;
  cancellationReason: string;
}

export interface LoanStartedInfo {
  userName: string;
  loanId: string;
  transportType: string;
  transportCode: string;
  startStation: string;
  startTime: Date;
  estimatedEndTime?: Date;
  estimatedCost: number;
}

export interface LoanEndedInfo {
  userName: string;
  loanId: string;
  transportType: string;
  transportCode: string;
  startStation: string;
  endStation: string;
  startTime: Date;
  endTime: Date;
  duration: string;
  totalCost: number;
}

export interface PaymentConfirmationInfo {
  userName: string;
  loanId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  timestamp: Date;
}

export interface LoanReminderInfo {
  userName: string;
  loanId: string;
  transportType: string;
  transportCode: string;
  startTime: Date;
  currentDuration: string;
  reminderType: 'time' | 'cost';
  message: string;
}

export interface ProfileUpdateInfo {
  userName: string;
  updatedFields: string[];
  timestamp: Date;
}

export interface NotificationService {
  // Préstamos
  sendLoanStartedEmail(to: string, info: LoanStartedInfo): Promise<void>;
  sendLoanEndedEmail(to: string, info: LoanEndedInfo): Promise<void>;
  sendLoanCancellationEmail(to: string, info: LoanCancellationInfo): Promise<void>;
  sendLoanReminder(to: string, info: LoanReminderInfo): Promise<void>;
  
  // Pagos
  sendPaymentConfirmation(to: string, info: PaymentConfirmationInfo): Promise<void>;
  
  // Perfil
  sendProfileUpdateConfirmation(to: string, info: ProfileUpdateInfo): Promise<void>;
}