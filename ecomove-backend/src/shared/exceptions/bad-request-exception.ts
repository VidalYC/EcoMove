// src/shared/exceptions/bad-request-exception.ts

export class BadRequestException extends Error {
  public readonly statusCode: number = 400;

  constructor(message: string) {
    super(message);
    this.name = 'BadRequestException';
    Object.setPrototypeOf(this, BadRequestException.prototype);
  }
}