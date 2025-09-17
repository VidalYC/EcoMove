import { Transport} from '../../domain/entities/transport/transport.entity';
import { TransportRepository } from '../../domain/repositories/transport.repository';
import { TransportFilters } from '../../domain/value-objects/transport-filters';

export class GetAllTransportsUseCase {
  constructor(private readonly transportRepository: TransportRepository) {}

  async execute(
    page: number = 1, 
    limit: number = 10, 
    filters?: TransportFilters
  ): Promise<{
    transports: Transport[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    if (page <= 0) {
      throw new Error('La página debe ser mayor a 0');
    }

    if (limit <= 0 || limit > 100) {
      throw new Error('El límite debe estar entre 1 y 100');
    }

    return await this.transportRepository.findAll(page, limit, filters);
  }
}