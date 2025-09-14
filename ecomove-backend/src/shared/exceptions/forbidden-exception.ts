export class ForbiddenException extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenException';
  }
}