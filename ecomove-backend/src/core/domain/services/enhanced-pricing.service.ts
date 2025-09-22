import { Transport } from "../entities/transport.entity";

export interface FareCalculation {
  baseFare: number;
  timeDiscount: number;
  taxes: number;
  totalCost: number;
  appliedDiscounts?: number;
  breakdown: {
    hourlyRate: number;
    duration: number;
    discountPercentage?: number;
    taxPercentage: number;
  };
}

export interface PricingService {
  calculateFare(transport: Transport, durationMinutes: number): Promise<FareCalculation>;
  calculateLateFee(transport: Transport, overdueMinutes: number): Promise<number>;
  calculateExtensionFare(transport: Transport, extensionMinutes: number): Promise<number>;
}