// 💎 DOCUMENT NUMBER VALUE OBJECT
import { validateColombianDocument } from '../../shared/utils';

export class DocumentNumber {
  private readonly value: string;

  constructor(documentNumber: string) {
    const normalizedDocument = this.normalize(documentNumber);
    if (!this.isValid(normalizedDocument)) {
      throw new Error('Invalid Colombian document number');
    }
    this.value = normalizedDocument;
  }

  private normalize(document: string): string {
    return document.trim().replace(/\D/g, ''); // Remove non-digits
  }

  private isValid(document: string): boolean {
    return validateColombianDocument(document);
  }

  getValue(): string {
    return this.value;
  }

  getFormatted(): string {
    // Format with dots for display: 12.345.678
    return this.value.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
  }

  equals(other: DocumentNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static create(documentNumber: string): DocumentNumber {
    return new DocumentNumber(documentNumber);
  }
}