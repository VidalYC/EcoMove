import { BaseEntity } from '../../../shared/interfaces/base-entity';
import { UserRole } from '../../../shared/enums/user-roles';
import { UserStatus } from '../../../shared/enums/user-status';
import { Email } from '../value-objects/email.vo';
import { DocumentNumber } from '../value-objects/document-number.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';
import { Password } from '../value-objects/password.vo';
import { BusinessException } from '../../../shared/exceptions/business-exception';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export interface UserProps {
  id?: number;
  name: string;
  email: Email;
  document: DocumentNumber;
  phone?: PhoneNumber;
  password: Password;
  role: UserRole;
  status: UserStatus;
  registrationDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User implements BaseEntity {
  private constructor(private props: UserProps) {
    this.validate();
  }

  // Factory methods
  static create(data: {
    name: string;
    email: string;
    document: string;
    phone?: string;
    password: string;
    role?: UserRole;
  }): User {
    return new User({
      name: data.name.trim(),
      email: new Email(data.email),
      document: new DocumentNumber(data.document),
      phone: data.phone ? new PhoneNumber(data.phone) : undefined,
      password: Password.fromHash(data.password), // Asumimos que ya está hasheado
      role: data.role || UserRole.USER,
      status: UserStatus.ACTIVE,
      registrationDate: new Date(),
    });
  }

  static fromPersistence(data: any): User {
    return new User({
      id: data.id,
      name: data.name || data.nombre,
      email: new Email(data.email || data.correo),
      document: new DocumentNumber(data.document || data.documento),
      phone: data.phone || data.telefono ? new PhoneNumber(data.phone || data.telefono) : undefined,
      password: Password.fromHash(data.password_hash),
      role: data.role as UserRole,
      status: data.status || data.estado as UserStatus,
      registrationDate: data.registration_date || data.fecha_registro,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  // Getters
  get id(): number | undefined {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get document(): DocumentNumber {
    return this.props.document;
  }

  get phone(): PhoneNumber | undefined {
    return this.props.phone;
  }

  get password(): Password {
    return this.props.password;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get registrationDate(): Date | undefined {
    return this.props.registrationDate;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // Business methods
  updateProfile(data: {
    name?: string;
    email?: string;
    phone?: string;
  }): void {
    if (data.name) {
      this.props.name = data.name.trim();
    }

    if (data.email) {
      this.props.email = new Email(data.email);
    }

    if (data.phone) {
      this.props.phone = new PhoneNumber(data.phone);
    }

    this.props.updatedAt = new Date();
  }

  async changePassword(newPassword: string): Promise<void> {
    this.props.password = await Password.create(newPassword);
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.props.status === UserStatus.ACTIVE) {
      throw new BusinessException('User is already active');
    }
    this.props.status = UserStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    if (this.props.status === UserStatus.INACTIVE) {
      throw new BusinessException('User is already inactive');
    }
    this.props.status = UserStatus.INACTIVE;
    this.props.updatedAt = new Date();
  }

  suspend(): void {
    if (this.props.status === UserStatus.SUSPENDED) {
      throw new BusinessException('User is already suspended');
    }
    this.props.status = UserStatus.SUSPENDED;
    this.props.updatedAt = new Date();
  }

  promoteToAdmin(): void {
    if (this.props.role === UserRole.ADMIN) {
      throw new BusinessException('User is already an admin');
    }
    this.props.role = UserRole.ADMIN;
    this.props.updatedAt = new Date();
  }

  demoteToUser(): void {
    if (this.props.role === UserRole.USER) {
      throw new BusinessException('User is already a regular user');
    }
    this.props.role = UserRole.USER;
    this.props.updatedAt = new Date();
  }

  isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  async verifyPassword(plainPassword: string): Promise<boolean> {
    return this.props.password.verify(plainPassword);
  }

  // Validation
  private validate(): void {
    if (!this.props.name || this.props.name.trim().length < 2) {
      throw new ValidationException('Name must be at least 2 characters long');
    }

    if (this.props.name.length > 100) {
      throw new ValidationException('Name cannot exceed 100 characters');
    }

    if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(this.props.name)) {
      throw new ValidationException('Name can only contain letters and spaces');
    }
  }

  // For persistence
  toPersistence(): any {
    return {
      id: this.props.id,
      nombre: this.props.name,
      correo: this.props.email.value,
      documento: this.props.document.value,
      telefono: this.props.phone?.value,
      password_hash: this.props.password.hash,
      role: this.props.role,
      estado: this.props.status,
      fecha_registro: this.props.registrationDate,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
    };
  }

  // For API responses (without sensitive data)
  toResponse(): any {
    return {
      id: this.props.id,
      name: this.props.name,
      email: this.props.email.value,
      document: this.props.document.value,
      phone: this.props.phone?.value,
      role: this.props.role,
      status: this.props.status,
      registrationDate: this.props.registrationDate,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}