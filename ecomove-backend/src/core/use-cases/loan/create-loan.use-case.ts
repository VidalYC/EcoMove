import { Loan } from '../../domain/entities/loan.entity';
import { LoanRepository } from '../../domain/repositories/loan.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { TransportRepository } from '../../domain/repositories/transport.repository';
import { StationRepository } from '../../domain/repositories/station.repository';
import { TransportStatus } from '../../../shared/enums/transport.enums';
import { ValidationException } from '../../../shared/exceptions/validation-exception';

export interface CreateLoanRequest {
  userId: number;
  transportId: number;
  originStationId: number;
  estimatedDuration?: number;
}

export class CreateLoanUseCase {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly userRepository: UserRepository,
    private readonly transportRepository: TransportRepository,
    private readonly stationRepository: StationRepository
  ) {}

  async execute(request: CreateLoanRequest): Promise<Loan> {
    // Validar que el usuario existe y está activo
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new ValidationException('Usuario no encontrado');
    }
    if (!user.isActive()) {
      throw new ValidationException('Usuario no está activo');
    }

    // Validar que el usuario no tenga préstamos activos
    const hasActiveLoans = await this.loanRepository.hasActiveLoans(request.userId);
    if (hasActiveLoans) {
      throw new ValidationException('El usuario ya tiene un préstamo activo');
    }

    // Validar que el transporte existe y está disponible (usando herencia)
    const transport = await this.loanRepository.findTransportWithInheritance(request.transportId);
    if (!transport) {
      throw new ValidationException('Transporte no encontrado');
    }
    if (transport.estado !== 'available') {
      throw new ValidationException('Transporte no está disponible');
    }

    // Validar que la estación de origen existe
    const originStation = await this.stationRepository.findById(request.originStationId);
    if (!originStation) {
      throw new ValidationException('Estación de origen no encontrada');
    }

    // Validar que el transporte está en la estación de origen
    if (transport.current_station_id !== request.originStationId) {
      throw new ValidationException('El transporte no está en la estación de origen especificada');
    }

    // Crear el préstamo
    const loan = Loan.create(
      request.userId,
      request.transportId,
      request.originStationId,
      request.estimatedDuration
    );

    // Guardar el préstamo
    const savedLoan = await this.loanRepository.save(loan);

    // Cambiar estado del transporte a 'in_use'
    await this.transportRepository.update(transport.id, { status: TransportStatus.IN_USE });

    return savedLoan;
  }
}