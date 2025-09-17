export class ValidationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationException';
    
    // Mantener el stack trace correcto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationException);
    }
  }
}