import { ValidationException } from "../../../shared/exceptions/validation-exception";

export class LoanDuration {
  private readonly _value: number; // en minutos

  constructor(value: number) {
    this.validate(value);
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  get hours(): number {
    return Math.floor(this._value / 60);
  }

  get minutes(): number {
    return this._value % 60;
  }

  private validate(duration: number): void {
    if (duration == null || duration <= 0) {
      throw new ValidationException('Loan duration must be positive');
    }
    
    if (duration < 15) {
      throw new ValidationException('Minimum loan duration is 15 minutes');
    }
    
    if (duration > 1440) { // 24 horas
      throw new ValidationException('Maximum loan duration is 24 hours');
    }
  }

  equals(other: LoanDuration): boolean {
    return this._value === other._value;
  }

  toString(): string {
    if (this.hours > 0) {
      return `${this.hours}h ${this.minutes}m`;
    }
    return `${this.minutes}m`;
  }
}
