import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';
import { DocumentNumber } from '../value-objects/document-number.vo';

export interface UserRepository {
  save(user: User): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByDocument(document: DocumentNumber): Promise<User | null>;
  findAll(page: number, limit: number): Promise<{
    users: User[];
    total: number;
    totalPages: number;
    currentPage: number;
  }>;
  search(term: string, page: number, limit: number): Promise<{
    users: User[];
    total: number;
    totalPages: number;
    currentPage: number;
  }>;
  update(user: User): Promise<User>;
  delete(id: number): Promise<void>;
  exists(id: number): Promise<boolean>;
  getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    admins: number;
    newUsersThisMonth: number;
  }>;
}