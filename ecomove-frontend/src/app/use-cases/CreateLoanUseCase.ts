// 🎯 CREATE LOAN USE CASE
import { LoanRepository, TransportRepository, StationRepository } from '../../core/repositories';
import { Loan, CreateLoanData } from '../../core/entities/Loan';
import { Transport } from '../../core/entities/Transport';
import { Station } from '../../core/entities/Station';
import { User } from '../../core/entities/User';
import { ID, PaymentMethod } from '../../shared/types';

export interface CreateLoanRequest {
  userId: ID;
  transportId: ID;
  originStationId: ID;
  paymentMethod: PaymentMethod;
}

export interface CreateLoanContext {
  user: User;
  transport: Transport;
  originStation: Station;
}

export class CreateLoanUseCase {
  constructor(
    private loanRepository: LoanRepository,
    private transportRepository: TransportRepository,
    private stationRepository: StationRepository
  ) {}

  async execute(request: CreateLoanRequest): Promise<Loan> {
    // Validate input
    this.validateRequest(request);

    // Load context entities
    const context = await this.loadContext(request);

    // Validate business rules
    this.validateBusinessRules(context);

    // Create the loan
    const loanData: CreateLoanData = {
      userId: request.userId,
      transportId: request.transportId,
      originStationId: request.originStationId,
      paymentMethod: request.paymentMethod,
    };

    try {
      const loan = await this.loanRepository.create(loanData);
      return loan;
    } catch (error: any) {
      this.handleCreateLoanError(error);
      throw error;
    }
  }

  private validateRequest(request: CreateLoanRequest): void {
    if (!request.userId) {
      throw new Error('User ID is required');
    }

    if (!request.transportId) {
      throw new Error('Transport ID is required');
    }

    if (!request.originStationId) {
      throw new Error('Origin station ID is required');
    }

    if (!request.paymentMethod) {
      throw new Error('Payment method is required');
    }

    if (!Object.values(PaymentMethod).includes(request.paymentMethod)) {
      throw new Error('Invalid payment method');
    }
  }

  private async loadContext(request: CreateLoanRequest): Promise<CreateLoanContext> {
    // Load transport
    const transport = await this.transportRepository.findById(request.transportId);
    if (!transport) {
      throw new Error('Transport not found');
    }

    // Load origin station
    const originStation = await this.stationRepository.findById(request.originStationId);
    if (!originStation) {
      throw new Error('Origin station not found');
    }

    // For this use case, we assume the user is passed in the request
    // In a real implementation, you would load it from a user repository
    const user = { canRentTransport: () => true } as User; // Mock user

    return {
      user,
      transport,
      originStation,
    };
  }

  private validateBusinessRules(context: CreateLoanContext): void {
    const { user, transport, originStation } = context;

    // User validations
    if (!user.canRentTransport()) {
      throw new Error('User is not eligible to rent transports');
    }

    // Transport validations
    if (!transport.isAvailable()) {
      throw new Error('Transport is not available for rental');
    }

    if (!transport.canBeRented()) {
      throw new Error('Transport cannot be rented at this time');
    }

    // Station validations
    if (!originStation.isActive()) {
      throw new Error('Origin station is not active');
    }

    if (!originStation.canProvideTransport()) {
      throw new Error('Origin station cannot provide transports at this time');
    }

    // Transport must be at the origin station
    if (transport.currentStationId !== originStation.id) {
      throw new Error('Transport is not located at the specified origin station');
    }

    // Battery level check for electric transports
    if (transport.getBatteryPercentage() <= 10) {
      throw new Error('Transport battery level is too low for rental');
    }
  }

  private handleCreateLoanError(error: any): void {
    const errorCode = error.code;
    
    switch (errorCode) {
      case 'USER_HAS_ACTIVE_LOAN':
        throw new Error('You already have an active loan. Please complete it before starting a new one.');
      case 'TRANSPORT_NOT_AVAILABLE':
        throw new Error('This transport is no longer available');
      case 'STATION_NOT_ACTIVE':
        throw new Error('The selected station is not currently active');
      case 'INSUFFICIENT_BATTERY':
        throw new Error('Transport battery level is too low');
      case 'PAYMENT_METHOD_INVALID':
        throw new Error('Invalid payment method');
      case 'USER_NOT_ELIGIBLE':
        throw new Error('You are not eligible to rent transports');
      case 'NETWORK_ERROR':
        throw new Error('Connection error. Please try again.');
      default:
        throw new Error('Unable to create loan. Please try again.');
    }
  }
}