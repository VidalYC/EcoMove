import { BaseException } from "./base-exception";

export class NotFoundException extends BaseException {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
}