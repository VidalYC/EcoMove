import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordService } from '../../domain/services/password.service';
import { TokenService } from '../../domain/services/token.service';
import { Email } from '../../domain/value-objects/email.vo';
import { DocumentNumber } from '../../domain/value-objects/document-number.vo';
import { ValidationException } from '../../../shared/exceptions/validation-exception';
import { LoggerService } from '../../../infrastructure/services/winston-logger.service';


export interface RegisterUserRequest {
  nombre: string;
  correo: string;
  documento: string;
  telefono: string;
  password: string;
}

export interface RegisterUserResponse {
  user: User;
  token: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly logger: LoggerService
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    const startTime = Date.now();
    
    this.logger.info('User registration started', {
      email: request.correo,
      document: request.documento.substring(0, 4) + '****',
      timestamp: new Date().toISOString()
    });

    try {
      // Validar que el email no exista
      const emailVO = new Email(request.correo);
      const existingUserByEmail = await this.userRepository.findByEmail(emailVO);
      if (existingUserByEmail) {
        this.logger.warn('Registration failed - email already exists', {
          email: request.correo,
          duration: `${Date.now() - startTime}ms`
        });
        throw new ValidationException('El correo electrónico ya está registrado');
      }

      // Validar que el documento no exista
      const documentVO = new DocumentNumber(request.documento);
      const existingUserByDocument = await this.userRepository.findByDocument(documentVO);
      if (existingUserByDocument) {
        this.logger.warn('Registration failed - document already exists', {
          document: request.documento.substring(0, 4) + '****',
          duration: `${Date.now() - startTime}ms`
        });
        throw new ValidationException('El documento ya está registrado');
      }

      // Hash de la contraseña
      const hashedPassword = await this.passwordService.hash(request.password);

      // Crear usuario
      const user = User.create(
        request.nombre,
        request.correo,
        request.documento,
        request.telefono,
        hashedPassword
      );

      // Guardar usuario
      const savedUser = await this.userRepository.save(user);

      // Generar token
      const token = await this.tokenService.generate({
        userId: savedUser.getId()!,
        email: savedUser.getEmail().getValue(),
        role: savedUser.getRole()
      });

      this.logger.info('User registration successful', {
        userId: savedUser.getId(),
        email: request.correo,
        role: savedUser.getRole(),
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      });

      return {
        user: savedUser,
        token
      };

    } catch (error) {
      this.logger.error('User registration failed', {
        email: request.correo,
        error: (error as Error).message,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}