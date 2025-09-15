import { Coordinate } from '../../../shared/interfaces/coordinate.interface';

export class StationFilters {
  constructor(
    public readonly active?: boolean,
    public readonly minCapacity?: number,
    public readonly maxCapacity?: number,
    public readonly nearLocation?: {
      coordinate: Coordinate;
      radiusKm: number;
    }
  ) {}

  static create(data: {
    active?: boolean;
    minCapacity?: number;
    maxCapacity?: number;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
  }): StationFilters {
    let nearLocation;
    if (data.latitude !== undefined && data.longitude !== undefined && data.radiusKm !== undefined) {
      nearLocation = {
        coordinate: { latitude: data.latitude, longitude: data.longitude },
        radiusKm: data.radiusKm
      };
    }

    return new StationFilters(
      data.active,
      data.minCapacity,
      data.maxCapacity,
      nearLocation
    );
  }

  hasFilters(): boolean {
    return !!(this.active !== undefined || this.minCapacity || this.maxCapacity || this.nearLocation);
  }
}
