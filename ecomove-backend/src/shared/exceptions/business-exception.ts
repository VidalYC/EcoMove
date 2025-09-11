import { BaseException } from "./base-exception";

export class BusinessException extends BaseException {
  readonly code = 'BUSINESS_ERROR';
  readonly statusCode = 400;
}