import { Station } from '../../domain/entities/station.entity';
import { Coordinate } from '../../../shared/interfaces/coordinate.interface';
import { StationRepository } from '../../domain/repositories/station.repository';

export class CreateStationUseCase {
  constructor(private readonly stationRepository: StationRepository) {}

  async execute(data: {
    name: string;
    address: string;
    coordinate: Coordinate;
    maxCapacity: number;
  }): Promise<Station> {
    // Validaciones de negocio
    if (data.maxCapacity <= 0) {
      throw new Error('La capacidad máxima debe ser mayor a 0');
    }

    if (data.maxCapacity > 100) {
      throw new Error('La capacidad máxima no puede exceder 100 transportes');
    }

    // Verificar que no exista una estación muy cercana (menos de 100m)
    const nearbyStations = await this.stationRepository.findNearby(
      data.coordinate, 
      0.1 // 100 metros
    );

    if (nearbyStations.length > 0) {
      throw new Error('Ya existe una estación muy cercana a esta ubicación');
    }

    return await this.stationRepository.create(data);
  }
}