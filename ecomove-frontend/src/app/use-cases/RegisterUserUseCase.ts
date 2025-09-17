// 🎯 REGISTER USER USE CASE
import { AuthRepository, AuthTokens } from '../../core/repositories';
import { User, CreateUserData } from '../../core/entities/User';
import { Email } from '../../core/value-objects/Email';
import { DocumentNumber } from '../../core/value-objects/DocumentNumber';
import { Phone } from '../../core/value-objects/Phone';
import { VALIDATION_RULES } from '../../shared/constants';

export interface RegisterData extends CreateUserData {}

export interface RegisterResult {
  user: User;
  tokens: AuthTokens;
}

export class RegisterUserUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(userData: RegisterData): Promise<RegisterResult> {
    // Validate all input data
    this.validateUserData(userData);

    try {
      // Create user through repository
      const result = await this.authRepository.register(userData);

      return result;
    } catch (error: any) {
      // Transform repository errors to business errors
      this.handleRegistrationError(error);
      throw error;
    }
  }

  private validateUserData(userData: RegisterData): void {
    // Name validation
    if (!userData.name?.trim()) {
      throw new Error('Name is required');
    }

    if (userData.name.trim().length < VALIDATION_RULES.NAME_MIN_LENGTH) {
      throw new Error(`Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters long`);
    }

    if (userData.name.trim().length > VALIDATION_RULES.NAME_MAX_LENGTH) {
      throw new Error(`Name must be less than ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`);
    }

    // Email validation
    if (!userData.email?.trim()) {
      throw new Error('Email is required');
    }

    try {
      Email.create(userData.email);
    } catch {
      throw new Error('Invalid email format');
    }

    // Document number validation
    if (!userData.documentNumber?.trim()) {
      throw new Error('Document number is required');
    }

    try {
      DocumentNumber.create(userData.documentNumber);
    } catch {
      throw new Error('Invalid Colombian document number');
    }

    // Phone validation
    if (!userData.phone?.trim()) {
      throw new Error('Phone number is required');
    }

    try {
      Phone.create(userData.phone);
    } catch {
      throw new Error('Invalid Colombian phone number format');
    }

    // Password validation
    if (!userData.password?.trim()) {
      throw new Error('Password is required');
    }

    if (userData.password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`);
    }

    if (!this.isPasswordStrong(userData.password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
  }

  private isPasswordStrong(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers;
  }

  private handleRegistrationError(error: any): void {
    const errorCode = error.code;
    
    switch (errorCode) {
      case 'EMAIL_ALREADY_EXISTS':
        throw new Error('An account with this email already exists');
      case 'DOCUMENT_ALREADY_EXISTS':
        throw new Error('An account with this document number already exists');
      case 'PHONE_ALREADY_EXISTS':
        throw new Error('An account with this phone number already exists');
      case 'INVALID_EMAIL':
        throw new Error('Invalid email format');
      case 'INVALID_DOCUMENT':
        throw new Error('Invalid document number');
      case 'INVALID_PHONE':
        throw new Error('Invalid phone number');
      case 'WEAK_PASSWORD':
        throw new Error('Password does not meet security requirements');
      case 'NETWORK_ERROR':
        throw new Error('Connection error. Please check your internet connection.');
      default:
        throw new Error('Registration failed. Please try again.');
    }
  }
}