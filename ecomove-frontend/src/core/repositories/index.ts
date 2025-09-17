// 🏛️ REPOSITORY INTERFACES
import { User, CreateUserData, UpdateUserData } from '../entities/User';
import { Transport } from '../entities/Transport';
import { Station } from '../entities/Station';
import { Loan, CreateLoanData, CompleteLoanData } from '../entities/Loan';
import { ID, PaginatedResponse } from '../../shared/types';
import { Coordinate } from '../value-objects/Coordinate';

// Common query options
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FindNearbyOptions {
  center: Coordinate;
  radiusKm: number;
  limit?: number;
}

// User Repository
export interface UserRepository {
  create(userData: CreateUserData): Promise<User>;
  findById(id: ID): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByDocument(documentNumber: string): Promise<User | null>;
  update(id: ID, updates: UpdateUserData): Promise<User>;
  delete(id: ID): Promise<void>;
  findAll(options?: QueryOptions): Promise<PaginatedResponse<User>>;
}

// Transport Repository
export interface TransportRepository {
  findById(id: ID): Promise<Transport | null>;
  findAll(options?: QueryOptions): Promise<PaginatedResponse<Transport>>;
  findAvailable(stationId?: ID): Promise<Transport[]>;
  findByStation(stationId: ID): Promise<Transport[]>;
  updateStatus(id: ID, status: string): Promise<Transport>;
  findNearby(options: FindNearbyOptions): Promise<Transport[]>;
}

// Station Repository
export interface StationRepository {
  findById(id: ID): Promise<Station | null>;
  findAll(options?: QueryOptions): Promise<PaginatedResponse<Station>>;
  findNearby(options: FindNearbyOptions): Promise<Station[]>;
  findWithAvailableTransports(): Promise<Station[]>;
  findWithAvailableSpace(): Promise<Station[]>;
  updateTransportCount(id: ID, count: number): Promise<Station>;
}

// Loan Repository
export interface LoanRepository {
  create(loanData: CreateLoanData): Promise<Loan>;
  findById(id: ID): Promise<Loan | null>;
  findByUser(userId: ID, options?: QueryOptions): Promise<PaginatedResponse<Loan>>;
  findActiveByUser(userId: ID): Promise<Loan | null>;
  findAll(options?: QueryOptions): Promise<PaginatedResponse<Loan>>;
  complete(id: ID, data: CompleteLoanData): Promise<Loan>;
  cancel(id: ID): Promise<Loan>;
  update(id: ID, updates: Partial<Loan>): Promise<Loan>;
  findOverdue(): Promise<Loan[]>;
}

// Authentication Repository
export interface AuthRepository {
  login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }>;
  register(userData: CreateUserData): Promise<{ user: User; tokens: AuthTokens }>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  verifyToken(token: string): Promise<User>;
}

// Auth tokens interface
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}