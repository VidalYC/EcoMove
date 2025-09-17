// 🏛️ LOAN ENTITY
import { BaseEntity, ID, LoanStatus, PaymentMethod } from '../../shared/types';
import { Money } from '../value-objects/Money';
import { Duration } from '../value-objects/Duration';

export interface CreateLoanData {
  userId: ID;
  transportId: ID;
  originStationId: ID;
  paymentMethod: PaymentMethod;
}

export interface CompleteLoanData {
  destinationStationId: ID;
  endDate: Date;
}

export class Loan implements BaseEntity {
  constructor(
    public readonly id: ID,
    public readonly userId: ID,
    public readonly transportId: ID,
    public readonly originStationId: ID,
    public readonly destinationStationId: ID | null,
    public readonly startDate: Date,
    public readonly endDate: Date | null,
    public readonly totalCost: Money,
    public readonly status: LoanStatus,
    public readonly paymentMethod: PaymentMethod,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Factory methods
  static create(data: CreateLoanData): Omit<Loan, 'id' | 'createdAt' | 'updatedAt'> {
    const now = new Date();
    
    return {
      userId: data.userId,
      transportId: data.transportId,
      originStationId: data.originStationId,
      destinationStationId: null,
      startDate: now,
      endDate: null,
      totalCost: Money.zero(),
      status: LoanStatus.ACTIVE,
      paymentMethod: data.paymentMethod,
    };
  }

  static fromApi(data: any): Loan {
    return new Loan(
      data.id,
      data.userId,
      data.transportId,
      data.originStationId,
      data.destinationStationId,
      new Date(data.startDate),
      data.endDate ? new Date(data.endDate) : null,
      Money.create(data.totalCost || 0),
      data.status as LoanStatus,
      data.paymentMethod as PaymentMethod,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  // Business methods
  complete(data: CompleteLoanData, hourlyRate: Money): Partial<Loan> {
    if (!this.isActive()) {
      throw new Error('Only active loans can be completed');
    }

    if (data.endDate <= this.startDate) {
      throw new Error('End date must be after start date');
    }

    const duration = this.getDurationInMinutes(data.endDate);
    const cost = this.calculateTotalCost(duration, hourlyRate);

    return {
      destinationStationId: data.destinationStationId,
      endDate: data.endDate,
      totalCost: cost,
      status: LoanStatus.COMPLETED,
      updatedAt: new Date(),
    };
  }

  cancel(): Partial<Loan> {
    if (!this.isActive()) {
      throw new Error('Only active loans can be cancelled');
    }

    return {
      status: LoanStatus.CANCELLED,
      updatedAt: new Date(),
    };
  }

  extend(newEndDate: Date): Partial<Loan> {
    if (!this.isActive()) {
      throw new Error('Only active loans can be extended');
    }

    if (!this.endDate || newEndDate <= this.endDate) {
      throw new Error('Extension date must be after current end date');
    }

    return {
      endDate: newEndDate,
      updatedAt: new Date(),
    };
  }

  isActive(): boolean {
    return this.status === LoanStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this.status === LoanStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === LoanStatus.CANCELLED;
  }

  isOverdue(): boolean {
    return this.status === LoanStatus.OVERDUE;
  }

  getDurationInMinutes(endDate?: Date): number {
    const end = endDate || this.endDate || new Date();
    const duration = Duration.between(this.startDate, end);
    return duration.getMinutes();
  }

  getDuration(endDate?: Date): Duration {
    const minutes = this.getDurationInMinutes(endDate);
    return Duration.create(minutes);
  }

  calculateTotalCost(durationMinutes: number, hourlyRate: Money): Money {
    const hours = Math.ceil(durationMinutes / 60); // Round up to next hour
    return hourlyRate.multiply(hours);
  }

  getCurrentCost(hourlyRate: Money): Money {
    if (!this.isActive()) {
      return this.totalCost;
    }
    
    const currentDuration = this.getDurationInMinutes();
    return this.calculateTotalCost(currentDuration, hourlyRate);
  }

  getEstimatedCost(estimatedDurationMinutes: number, hourlyRate: Money): Money {
    return this.calculateTotalCost(estimatedDurationMinutes, hourlyRate);
  }

  getFormattedDuration(endDate?: Date): string {
    const duration = this.getDuration(endDate);
    return duration.format();
  }

  getStatusColor(): string {
    switch (this.status) {
      case LoanStatus.ACTIVE:
        return '#3b82f6'; // blue-500
      case LoanStatus.COMPLETED:
        return '#10b981'; // green-500
      case LoanStatus.CANCELLED:
        return '#6b7280'; // gray-500
      case LoanStatus.OVERDUE:
        return '#ef4444'; // red-500
      default:
        return '#6b7280';
    }
  }

  // Validation methods
  private validateDates(): void {
    if (this.endDate && this.endDate <= this.startDate) {
      throw new Error('End date must be after start date');
    }
  }

  // Serialization
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      userId: this.userId,
      transportId: this.transportId,
      originStationId: this.originStationId,
      destinationStationId: this.destinationStationId,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate?.toISOString() || null,
      totalCost: this.totalCost.getAmount(),
      status: this.status,
      paymentMethod: this.paymentMethod,
      durationMinutes: this.endDate ? this.getDurationInMinutes() : null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}