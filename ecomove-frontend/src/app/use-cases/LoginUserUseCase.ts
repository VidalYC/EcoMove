// 🎯 LOGIN USER USE CASE
import { AuthRepository, AuthTokens } from '../../core/repositories';
import { User } from '../../core/entities/User';
import { Email } from '../../core/value-objects/Email';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  user: User;
  tokens: AuthTokens;
}

export class LoginUserUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<LoginResult> {
    // Validate input
    this.validateCredentials(credentials);

    try {
      // Normalize email
      const email = Email.create(credentials.email);
      
      // Attempt login
      const result = await this.authRepository.login(
        email.getValue(),
        credentials.password
      );

      // Validate user can log in
      if (!result.user.isActive()) {
        throw new Error('Account is not active. Please contact support.');
      }

      if (result.user.isSuspended()) {
        throw new Error('Account is suspended. Please contact support.');
      }

      return result;
    } catch (error: any) {
      // Transform repository errors to business errors
      this.handleLoginError(error);
      throw error; // This line won't be reached due to handleLoginError throwing
    }
  }

  private validateCredentials(credentials: LoginCredentials): void {
    if (!credentials.email?.trim()) {
      throw new Error('Email is required');
    }

    if (!credentials.password?.trim()) {
      throw new Error('Password is required');
    }

    if (credentials.password.length < 6) {
      throw new Error('Password is too short');
    }

    // Validate email format
    try {
      Email.create(credentials.email);
    } catch {
      throw new Error('Invalid email format');
    }
  }

  private handleLoginError(error: any): void {
    const errorCode = error.code;
    
    switch (errorCode) {
      case 'INVALID_CREDENTIALS':
        throw new Error('Invalid email or password');
      case 'USER_NOT_FOUND':
        throw new Error('No account found with this email');
      case 'USER_INACTIVE':
        throw new Error('Account is not active');
      case 'USER_SUSPENDED':
        throw new Error('Account has been suspended');
      case 'TOO_MANY_ATTEMPTS':
        throw new Error('Too many login attempts. Please try again later.');
      case 'NETWORK_ERROR':
        throw new Error('Connection error. Please check your internet connection.');
      default:
        throw new Error('Login failed. Please try again.');
    }
  }
}