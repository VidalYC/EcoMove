// src/infrastructure/services/bcrypt-password.service.ts
import bcrypt from 'bcryptjs';
import { PasswordService } from '../../core/domain/services/password.service';

export class BcryptPasswordService implements PasswordService {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateTemporary(): string {
    return Math.random().toString(36).slice(-8);
  }
}