import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { BusinessException } from '../../../shared/exceptions/business-exception';
import { AuthenticateUserDto } from './dtos/authenticate-user.dto';

export interface AuthenticationResult {
  user: User;
  token: string;
}

export interface TokenService {
  generateToken(user: User): string;
}

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService
  ) {}

  async execute(dto: AuthenticateUserDto): Promise<AuthenticationResult> {
    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(new Email(dto.email));
    if (!user) {
      throw new BusinessException('Invalid credentials');
    }

    // Verificar que esté activo
    if (!user.isActive()) {
      throw new BusinessException('User account is not active');
    }

    // Verificar contraseña
    const isValidPassword = await user.verifyPassword(dto.password);
    if (!isValidPassword) {
      throw new BusinessException('Invalid credentials');
    }

    // Generar token
    const token = this.tokenService.generateToken(user);

    return {
      user,
      token
    };
  }
}