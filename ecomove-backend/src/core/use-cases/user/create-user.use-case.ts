import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { DocumentNumber } from '../../domain/value-objects/document-number.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { UserRole } from '../../../shared/enums/user-roles';
import { BusinessException } from '../../../shared/exceptions/business-exception';
import { CreateUserDto } from './dtos/create-user.dto';

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(dto: CreateUserDto): Promise<User> {
    // Validar que no exista usuario con el mismo email
    const existingEmail = await this.userRepository.findByEmail(new Email(dto.email));
    if (existingEmail) {
      throw new BusinessException('A user with this email already exists');
    }

    // Validar que no exista usuario con el mismo documento
    const existingDocument = await this.userRepository.findByDocument(new DocumentNumber(dto.document));
    if (existingDocument) {
      throw new BusinessException('A user with this document already exists');
    }

    // Crear contraseña hasheada
    const hashedPassword = await Password.create(dto.password);

    // Crear usuario
    const user = User.create({
      name: dto.name,
      email: dto.email,
      document: dto.document,
      phone: dto.phone,
      password: hashedPassword.hash,
      role: dto.role ? dto.role as UserRole : UserRole.USER,
    });

    // Guardar en repositorio
    return await this.userRepository.save(user);
  }
}