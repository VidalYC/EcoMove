import { ValidationException } from "../../../shared/exceptions/validation-exception";

export class Email {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value.toLowerCase().trim();
  }

  get value(): string {
    return this._value;
  }

  private validate(email: string): void {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    
    if (!email || !email.trim()) {
      throw new ValidationException('Email is required');
    }
    
    if (!emailRegex.test(email)) {
      throw new ValidationException('Invalid email format');
    }

    if (email.length > 255) {
      throw new ValidationException('Email cannot exceed 255 characters');
    }
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}