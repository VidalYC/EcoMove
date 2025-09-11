import { ValidationException } from "../../../shared/exceptions/validation-exception";

export class DocumentNumber {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }

  private validate(document: string): void {
    if (!document || !document.trim()) {
      throw new ValidationException('Document number is required');
    }

    const cleanDocument = document.trim();
    
    if (!/^\d{7,12}$/.test(cleanDocument)) {
      throw new ValidationException('Document must be between 7 and 12 digits');
    }
  }

  equals(other: DocumentNumber): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}