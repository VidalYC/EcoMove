export interface NotificationService {
  sendLoanStartedEmail(userEmail: string, loanDetails: any): Promise<void>;
  sendLoanEndedEmail(userEmail: string, loanDetails: any): Promise<void>;
  sendPaymentConfirmation(userEmail: string, paymentDetails: any): Promise<void>;
  sendLoanReminder(userEmail: string, loanDetails: any): Promise<void>;
}