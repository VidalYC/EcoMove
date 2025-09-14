export class NotFoundException extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundException';
  }
}