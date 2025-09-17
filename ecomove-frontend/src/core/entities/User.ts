// 🏛️ USER ENTITY
import { BaseEntity, ID, UserRole, UserStatus } from '../../shared/types';
import { Email } from '../value-objects/Email';
import { DocumentNumber } from '../value-objects/DocumentNumber';
import { Phone } from '../value-objects/Phone';

export interface CreateUserData {
  name: string;
  email: string;
  documentNumber: string;
  phone: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
}

export class User implements BaseEntity {
  constructor(
    public readonly id: ID,
    public readonly name: string,
    public readonly email: Email,
    public readonly documentNumber: DocumentNumber,
    public readonly phone: Phone,
    public readonly role: UserRole,
    public readonly status: UserStatus,
    public readonly registrationDate: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Factory methods
  static create(userData: CreateUserData): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
    const now = new Date();
    
    return {
      name: userData.name.trim(),
      email: Email.create(userData.email),
      documentNumber: DocumentNumber.create(userData.documentNumber),
      phone: Phone.create(userData.phone),
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      registrationDate: now,
    };
  }

  static fromApi(data: any): User {
    return new User(
      data.id,
      data.name,
      Email.create(data.email),
      DocumentNumber.create(data.documentNumber),
      Phone.create(data.phone),
      data.role as UserRole,
      data.status as UserStatus,
      new Date(data.registrationDate),
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  // Business methods
  updateProfile(updates: UpdateUserData): Partial<User> {
    const updatedFields: Partial<User> = {
      updatedAt: new Date(),
    };

    if (updates.name !== undefined) {
      if (updates.name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }
      updatedFields.name = updates.name.trim();
    }

    if (updates.phone !== undefined) {
      updatedFields.phone = Phone.create(updates.phone);
    }

    return updatedFields;
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isSuspended(): boolean {
    return this.status === UserStatus.SUSPENDED;
  }

  canAdministrate(): boolean {
    return this.isActive() && this.isAdmin();
  }

  canRentTransport(): boolean {
    return this.isActive() && !this.isSuspended();
  }

  getDisplayName(): string {
    return this.name;
  }

  getEmailString(): string {
    return this.email.getValue();
  }

  getPhoneString(): string {
    return this.phone.getValue();
  }

  getDocumentString(): string {
    return this.documentNumber.getValue();
  }

  // Serialization
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      email: this.email.getValue(),
      documentNumber: this.documentNumber.getValue(),
      phone: this.phone.getValue(),
      role: this.role,
      status: this.status,
      registrationDate: this.registrationDate.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}