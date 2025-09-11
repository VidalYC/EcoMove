import * as bcrypt from 'bcryptjs';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export class Password {
  private readonly _hashedValue: string;

  private constructor(hashedValue: string) {
    this._hashedValue = hashedValue;
  }

  static async create(plainPassword: string): Promise<Password> {
    this.validatePlainPassword(plainPassword);
    const hashed = await bcrypt.hash(plainPassword, 12);
    return new Password(hashed);
  }

  static fromHash(hashedValue: string): Password {
    if (!hashedValue) {
      throw new ValidationException('Hashed password cannot be empty');
    }
    return new Password(hashedValue);
  }

  async verify(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this._hashedValue);
  }

  get hash(): string {
    return this._hashedValue;
  }

  private static validatePlainPassword(password: string): void {
    if (!password) {
      throw new ValidationException('Password is required');
    }

    if (password.length < 8) {
      throw new ValidationException('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new ValidationException('Password must contain at least 1 lowercase, 1 uppercase and 1 number');
    }
  }
}