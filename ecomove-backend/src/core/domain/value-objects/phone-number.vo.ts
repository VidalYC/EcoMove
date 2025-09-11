import { ValidationException } from "../../../shared/exceptions/validation-exception";

export class PhoneNumber {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = this.normalize(value);
  }

  get value(): string {
    return this._value;
  }

  private validate(phone: string): void {
    if (!phone || !phone.trim()) {
      throw new ValidationException('Phone number is required');
    }

    // Formato colombiano básico
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^(\+57)?[3][0-9]{9}$/.test(cleanPhone)) {
      throw new ValidationException('Invalid Colombian phone number format');
    }
  }

  private normalize(phone: string): string {
    let clean = phone.replace(/[\s\-\(\)]/g, '');
    if (!clean.startsWith('+57')) {
      clean = '+57' + clean;
    }
    return clean;
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}