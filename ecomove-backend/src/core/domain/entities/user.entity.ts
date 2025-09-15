import { Email } from '../value-objects/email.vo';
import { DocumentNumber } from '../value-objects/document-number.vo';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export class User {
  constructor(
    private id: number | null,
    private name: string,
    private email: Email,
    private documentNumber: DocumentNumber,
    private phone: string,
    private password: string,
    private role: UserRole = UserRole.USER,
    private status: UserStatus = UserStatus.ACTIVE,
    private registrationDate: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // ========== GETTERS ==========
  getId(): number | null {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): Email {
    return this.email;
  }

  getDocumentNumber(): DocumentNumber {
    return this.documentNumber;
  }

  getPhone(): string {
    return this.phone;
  }

  getPassword(): string {
    return this.password;
  }

  getRole(): UserRole {
    return this.role;
  }

  getStatus(): UserStatus {
    return this.status;
  }

  getRegistrationDate(): Date {
    return this.registrationDate;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // ========== MÉTODOS DE NEGOCIO ==========
  updateName(newName: string): void {
    if (!newName || newName.trim().length < 2) {
      throw new Error('El nombre debe tener al menos 2 caracteres');
    }
    this.name = newName.trim();
    this.markAsUpdated();
  }

  updatePhone(newPhone: string): void {
    if (!newPhone || newPhone.trim().length < 10) {
      throw new Error('El teléfono debe tener al menos 10 dígitos');
    }
    this.phone = newPhone.trim();
    this.markAsUpdated();
  }

  updateRole(newRole: string): void {
    if (!Object.values(UserRole).includes(newRole as UserRole)) {
      throw new Error('Rol inválido');
    }
    this.role = newRole as UserRole;
    this.markAsUpdated();
  }

  changePassword(newHashedPassword: string): void {
    if (!newHashedPassword) {
      throw new Error('La contraseña no puede estar vacía');
    }
    this.password = newHashedPassword;
    this.markAsUpdated();
  }

  activate(): void {
    this.status = UserStatus.ACTIVE;
    this.markAsUpdated();
  }

  deactivate(): void {
    this.status = UserStatus.INACTIVE;
    this.markAsUpdated();
  }

  suspend(): void {
    this.status = UserStatus.SUSPENDED;
    this.markAsUpdated();
  }

  // ========== VALIDACIONES DE ESTADO ==========
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isSuspended(): boolean {
    return this.status === UserStatus.SUSPENDED;
  }

  canPerformAction(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  canAdministrate(): boolean {
    return this.isActive() && this.isAdmin();
  }

  // ========== MÉTODOS AUXILIARES ==========
  setId(id: number): void {
    if (this.id !== null) {
      throw new Error('El ID ya ha sido establecido');
    }
    this.id = id;
  }

  markAsUpdated(): void {
    this.updatedAt = new Date();
  }

  // ========== MÉTODOS ESTÁTICOS ==========
  static create(
    name: string,
    email: string,
    documentNumber: string,
    phone: string,
    hashedPassword: string,
    role: UserRole = UserRole.USER
  ): User {
    const emailVO = new Email(email);
    const documentVO = new DocumentNumber(documentNumber);
    
    return new User(
      null,
      name,
      emailVO,
      documentVO,
      phone,
      hashedPassword,
      role,
      UserStatus.ACTIVE,
      new Date(),
      new Date()
    );
  }

  static fromDatabase(data: {
    id: number;
    name: string;
    email: string;
    document_number: string;
    phone: string;
    password: string;
    role: string;
    status: string;
    registration_date: Date;
    updated_at: Date;
  }): User {
    return new User(
      data.id,
      data.name,
      new Email(data.email),
      new DocumentNumber(data.document_number),
      data.phone,
      data.password,
      data.role as UserRole,
      data.status as UserStatus,
      data.registration_date,
      data.updated_at
    );
  }
}