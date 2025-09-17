// 💎 PHONE VALUE OBJECT
import { validateColombiianPhone } from '../../shared/utils';

export class Phone {
  private readonly value: string;

  constructor(phone: string) {
    const normalizedPhone = this.normalize(phone);
    if (!this.isValid(normalizedPhone)) {
      throw new Error('Invalid Colombian phone number');
    }
    this.value = normalizedPhone;
  }

  private normalize(phone: string): string {
    let normalized = phone.trim().replace(/\D/g, '');
    
    // Remove country code if present
    if (normalized.startsWith('57') && normalized.length === 12) {
      normalized = normalized.substring(2);
    }
    
    return normalized;
  }

  private isValid(phone: string): boolean {
    return validateColombiianPhone(phone);
  }

  getValue(): string {
    return this.value;
  }

  getInternational(): string {
    return `+57 ${this.value}`;
  }

  getFormatted(): string {
    // Format as: 300 123 4567
    return this.value.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }

  equals(other: Phone): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static create(phone: string): Phone {
    return new Phone(phone);
  }
}