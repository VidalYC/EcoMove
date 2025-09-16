import { Loan } from '../entities/loan.entity';
import { LoanStatus } from '../../../shared/enums/loan.enums';
import { PaymentMethod } from '../../../shared/enums/payment.enums';

export interface PaginatedLoanResponse<T> {
  loans: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface LoanStats {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  cancelledLoans: number;
  totalRevenue: number;
  averageDuration: number;
  mostUsedTransportType: string;
}

export interface LoanFilters {
  userId?: number;
  transportId?: number;
  originStationId?: number;
  destinationStationId?: number;
  status?: LoanStatus;
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: PaymentMethod;
  page?: number;
  limit?: number;
}

export interface LoanWithDetails {
  id: number;
  userId: number;
  transportId: number;
  originStationId: number;
  destinationStationId: number | null;
  startDate: Date;
  endDate: Date | null;
  estimatedDuration: number | null;
  totalCost: number | null;
  status: LoanStatus;
  paymentMethod: PaymentMethod | null;
  createdAt: Date;
  updatedAt: Date;
  // Detalles adicionales
  userName?: string;
  userEmail?: string;
  userDocument?: string;
  transportType?: string;
  transportModel?: string;
  originStationName?: string;
  destinationStationName?: string;
}

export interface UserLoanHistory {
  loans: LoanWithDetails[];
  total: number;
  totalPages: number;
  currentPage: number;
  userStats: {
    totalLoans: number;
    totalTimeUsed: number; // en minutos
    totalSpent: number;
    favoriteTransport: string;
  };
}

export interface LoanRepository {
  // CRUD básico
  save(loan: Loan): Promise<Loan>;
  findById(id: number): Promise<Loan | null>;
  update(loan: Loan): Promise<Loan>;
  delete(id: number): Promise<void>;
  exists(id: number): Promise<boolean>;

  // Consultas específicas de préstamos
  findActiveByUserId(userId: number): Promise<Loan | null>;
  findByUserId(userId: number, page: number, limit: number): Promise<PaginatedLoanResponse<Loan>>;
  findByTransportId(transportId: number): Promise<Loan[]>;
  findByStatus(status: LoanStatus, page: number, limit: number): Promise<PaginatedLoanResponse<Loan>>;
  findByFilters(filters: LoanFilters): Promise<PaginatedLoanResponse<LoanWithDetails>>;
  
  // Consultas con detalles (JOINs)
  findByIdWithDetails(id: number): Promise<LoanWithDetails | null>;
  findUserLoanHistory(userId: number, page: number, limit: number): Promise<UserLoanHistory>;
  
  // Estadísticas y reportes
  getStats(): Promise<LoanStats>;
  findByDateRange(startDate: Date, endDate: Date): Promise<LoanWithDetails[]>;
  getMostUsedTransports(startDate: Date, endDate: Date, limit: number): Promise<any[]>;
  getMostActiveStations(startDate: Date, endDate: Date, limit: number): Promise<any[]>;
  
  // Validaciones de negocio
  hasActiveLoans(userId: number): Promise<boolean>;
  countActiveLoans(): Promise<number>;
  
  // Consultas de administración
  findOverdueLoans(): Promise<LoanWithDetails[]>;
  findLoansByRevenue(minRevenue: number): Promise<LoanWithDetails[]>;
}