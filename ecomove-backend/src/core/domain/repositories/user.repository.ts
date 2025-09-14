// src/core/domain/repositories/user.repository.ts
import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';
import { DocumentNumber } from '../value-objects/document-number.vo';

export interface PaginatedResponse<T> {
  users: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  admins: number;
  newUsersThisMonth: number;
}

export interface UserRepository {
  // CRUD básico
  save(user: User): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByDocument(document: DocumentNumber): Promise<User | null>;
  update(user: User): Promise<User>;
  delete(id: number): Promise<void>;
  exists(id: number): Promise<boolean>;

  // Consultas paginadas
  findAll(page: number, limit: number): Promise<PaginatedResponse<User>>;
  search(term: string, page: number, limit: number): Promise<PaginatedResponse<User>>;
  
  // Estadísticas
  getStats(): Promise<UserStats>;
}