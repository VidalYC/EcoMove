import { StationRepository, Station, StationFilters } from '../../domain/entities/station.entity';

export class GetAllStationsUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(
    page: number = 1, 
    limit: number = 10, 
    filters?: StationFilters
  ): Promise<{
    stations: Station[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    return await this.stationRepository.findAll(page, limit, filters);
  }
}
