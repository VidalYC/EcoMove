import { PricingService } from '../../core/domain/services/pricing.service';

export class DefaultPricingService implements PricingService {
  private readonly pricingRules = {
    bicycle: {
      baseRate: 1.0,
      perMinuteRate: 0.1,
      currency: 'USD'
    },
    scooter: {
      baseRate: 2.0,
      perMinuteRate: 0.15,
      currency: 'USD'
    },
    electric_scooter: {
      baseRate: 3.0,
      perMinuteRate: 0.25,
      currency: 'USD'
    },
    default: {
      baseRate: 1.5,
      perMinuteRate: 0.12,
      currency: 'USD'
    }
  };

  async calculateLoanCost(durationInMinutes: number, transportType: string): Promise<number> {
    const pricing = this.pricingRules[transportType as keyof typeof this.pricingRules] || this.pricingRules.default;
    return pricing.baseRate + (durationInMinutes * pricing.perMinuteRate);
  }

  async calculateLateFee(durationInMinutes: number, transportType: string): Promise<number> {
    // Late fee is 50% of the regular cost for overtime
    const regularCost = await this.calculateLoanCost(durationInMinutes, transportType);
    return regularCost * 0.5;
  }

  async calculateOverdueCost(params: {
    transportType: string;
    plannedDurationMinutes: number;
    actualDurationMinutes: number;
    overdueMinutes: number;
  }): Promise<{ totalCost: number }> {
    const pricing = this.pricingRules[params.transportType as keyof typeof this.pricingRules] || this.pricingRules.default;
    // Penalty rate is double the regular rate for overdue time
    const penaltyRate = pricing.perMinuteRate * 2;
    const overdueCost = params.overdueMinutes * penaltyRate;
    return { totalCost: overdueCost };
  }

  async getBasePricing(transportType: string): Promise<{
    baseRate: number;
    perMinuteRate: number;
    currency: string;
  }> {
    return this.pricingRules[transportType as keyof typeof this.pricingRules] || this.pricingRules.default;
  }
}