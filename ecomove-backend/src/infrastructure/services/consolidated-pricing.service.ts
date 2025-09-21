import { PricingService, FareCalculation } from '../../core/domain/services/enhanced-pricing.service';
import { Transport } from '../../core/domain/entities/transport.entity';

export class ConsolidatedPricingService implements PricingService {
  private readonly TAX_RATE = 0.19; // 19% IVA
  private readonly LONG_RENTAL_THRESHOLD = 120; // 2 horas
  private readonly LONG_RENTAL_DISCOUNT = 0.1; // 10% descuento
  private readonly LATE_FEE_MULTIPLIER = 1.5; // 50% recargo
  private readonly EXTENSION_FEE_MULTIPLIER = 1.2; // 20% recargo

  async calculateFare(transport: Transport, durationMinutes: number): Promise<FareCalculation> {
    if (durationMinutes <= 0) {
      throw new Error('La duración debe ser mayor a 0 minutos');
    }

    const hours = durationMinutes / 60;
    const baseFare = transport.hourlyRate * hours;
    
    // Calcular descuentos por tiempo
    let timeDiscount = 0;
    const discountPercentage = durationMinutes > this.LONG_RENTAL_THRESHOLD ? this.LONG_RENTAL_DISCOUNT : 0;
    if (discountPercentage > 0) {
      timeDiscount = baseFare * discountPercentage;
    }

    const subtotal = baseFare - timeDiscount;
    const taxes = subtotal * this.TAX_RATE;
    const totalCost = Math.round((subtotal + taxes) * 100) / 100;

    return {
      baseFare,
      timeDiscount,
      taxes,
      totalCost,
      appliedDiscounts: timeDiscount,
      breakdown: {
        hourlyRate: transport.hourlyRate,
        duration: durationMinutes,
        discountPercentage: discountPercentage > 0 ? discountPercentage * 100 : undefined,
        taxPercentage: this.TAX_RATE * 100
      }
    };
  }

  async calculateLateFee(transport: Transport, overdueMinutes: number): Promise<number> {
    const baseFare = transport.hourlyRate * (overdueMinutes / 60);
    return Math.round(baseFare * this.LATE_FEE_MULTIPLIER * 100) / 100;
  }

  async calculateExtensionFare(transport: Transport, extensionMinutes: number): Promise<number> {
    const baseFare = transport.hourlyRate * (extensionMinutes / 60);
    return Math.round(baseFare * this.EXTENSION_FEE_MULTIPLIER * 100) / 100;
  }
}