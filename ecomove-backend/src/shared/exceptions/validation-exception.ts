export class ValidationException extends Error {
  constructor(message: string = 'Validation failed') {
    super(message);
    this.name = 'ValidationException';
  }
}