import { ValidationException } from "../../../shared/exceptions/validation-exception";
export class Cost {
  private readonly _value: number;

  constructor(value: number) {
    this.validate(value);
    this._value = Math.round(value * 100) / 100; // Redondear a 2 decimales
  }

  get value(): number {
    return this._value;
  }

  private validate(cost: number): void {
    if (cost == null || cost < 0) {
      throw new ValidationException('Cost cannot be negative');
    }
    
    if (cost > 1000000) { // Máximo 1 millón COP
      throw new ValidationException('Cost cannot exceed 1,000,000 COP');
    }
  }

  add(other: Cost): Cost {
    return new Cost(this._value + other._value);
  }

  multiply(factor: number): Cost {
    if (factor < 0) {
      throw new ValidationException('Multiplication factor cannot be negative');
    }
    return new Cost(this._value * factor);
  }

  equals(other: Cost): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return `$${this._value.toLocaleString('es-CO')} COP`;
  }
}