export interface PaymentService {
  processPayment(amount: number, currency: string, paymentMethodId: string): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
    error?: string;
  }>;
  
  refundPayment(transactionId: string, amount?: number): Promise<{
    success: boolean;
    refundId: string;
    message: string;
  }>;
}