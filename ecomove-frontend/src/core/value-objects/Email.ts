// 💎 EMAIL VALUE OBJECT
import { validateEmail } from '../../shared/utils';

export class Email {
  private readonly value: string;

  constructor(email: string) {
    const normalizedEmail = this.normalize(email);
    if (!this.isValid(normalizedEmail)) {
      throw new Error('Invalid email format');
    }
    this.value = normalizedEmail;
  }

  private normalize(email: string): string {
    return email.trim().toLowerCase();
  }

  private isValid(email: string): boolean {
    if (email.length > 255) return false;
    return validateEmail(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static create(email: string): Email {
    return new Email(email);
  }
}