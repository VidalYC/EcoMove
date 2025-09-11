import { BaseException } from "./base-exception";

export class ValidationException extends BaseException {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  
  constructor(message: string, public readonly errors: string[] = []) {
    super(message);
  }
}