import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordService } from '../../domain/services/password.service';
import { TokenService } from '../../domain/services/token.service';
import { Email } from '../../domain/value-objects/email.vo';
import { UnauthorizedException } from '../../../shared/exceptions/unauthorized-exception';

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
    private readonly tokenService: TokenService
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    // Buscar usuario por email
    const emailVO = new Email(request.correo);
    const user = await this.userRepository.findByEmail(emailVO);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar que el usuario esté activo
    if (!user.isActive()) {
      throw new UnauthorizedException('Usuario inactivo o suspendido');
    }

    // Verificar contraseña
    const isPasswordValid = await this.passwordService.compare(
      request.password,
      user.getPassword()
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar token
    const token = await this.tokenService.generate({
      userId: user.getId()!,
      email: user.getEmail().getValue(),
      role: user.getRole()
    });

    return {
      user,
      token
    };
  }
}