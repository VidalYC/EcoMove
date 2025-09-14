import { Transport, TransportRepository, TransportFilters } from '../../domain/entities/transport.entity';

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