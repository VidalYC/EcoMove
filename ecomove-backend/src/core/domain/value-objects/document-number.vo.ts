// src/core/domain/value-objects/document-number.vo.ts
export class DocumentNumber {
  private readonly value: string;

  constructor(documentNumber: string) {
    this.validate(documentNumber);
    this.value = documentNumber.trim();
  }

  private validate(documentNumber: string): void {
    if (!documentNumber) {
      throw new Error('Document number is required');
    }

    if (documentNumber.length < 8 || documentNumber.length > 15) {
      throw new Error('Document number must be between 8 and 15 characters');
    }

    if (!/^\d+$/.test(documentNumber)) {
      throw new Error('Document number must contain only numbers');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: DocumentNumber): boolean {
    return this.value === other.value;
  }
}