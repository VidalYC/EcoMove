import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordService } from '../../domain/services/password.service';
import { TokenService } from '../../domain/services/token.service';
import { Email } from '../../domain/value-objects/email.vo';
import { UnauthorizedException } from '../../../shared/exceptions/unauthorized-exception';
import { LoggerService } from '../../../infrastructure/services/winston-logger.service';

export interface LoginUserRequest {
  correo: string;
  password: string;
}

export interface LoginUserResponse {
  user: User;
  token: string;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly logger: LoggerService
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    const startTime = Date.now();
    
    this.logger.info('User login attempt', {
      email: request.correo,
      timestamp: new Date().toISOString()
    });

    try {
      // Buscar usuario por email
      const emailVO = new Email(request.correo);
      const user = await this.userRepository.findByEmail(emailVO);
      
      if (!user) {
        this.logger.warn('Login failed - user not found', {
          email: request.correo,
          duration: `${Date.now() - startTime}ms`
        });
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Verificar que el usuario esté activo
      if (!user.isActive()) {
        this.logger.warn('Login failed - user inactive', {
          userId: user.getId(),
          email: request.correo,
          status: user.getStatus(),
          duration: `${Date.now() - startTime}ms`
        });
        throw new UnauthorizedException('Usuario inactivo o suspendido');
      }

      // Verificar contraseña
      const isPasswordValid = await this.passwordService.compare(
        request.password,
        user.getPassword()
      );

      if (!isPasswordValid) {
        this.logger.warn('Login failed - invalid password', {
          userId: user.getId(),
          email: request.correo,
          duration: `${Date.now() - startTime}ms`
        });
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Generar token
      const token = await this.tokenService.generate({
        userId: user.getId()!,
        email: user.getEmail().getValue(),
        role: user.getRole()
      });

      this.logger.info('User login successful', {
        userId: user.getId(),
        email: request.correo,
        role: user.getRole(),
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      });

      return {
        user,
        token
      };

    } catch (error) {
      this.logger.error('User login error', {
        email: request.correo,
        error: (error as Error).message,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}