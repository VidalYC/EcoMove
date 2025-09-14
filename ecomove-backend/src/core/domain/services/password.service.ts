// src/core/domain/services/password.service.ts
export interface PasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hashedPassword: string): Promise<boolean>;
  generateTemporary(): string;
}