export interface PricingService {
  calculateLoanCost(durationInMinutes: number, transportType: string): Promise<number>;
  calculateLateFee(durationInMinutes: number, transportType: string): Promise<number>;
  getBasePricing(transportType: string): Promise<{
    baseRate: number;
    perMinuteRate: number;
    currency: string;
  }>;
}