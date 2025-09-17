// 🎯 FIND AVAILABLE TRANSPORTS USE CASE
import { TransportRepository, StationRepository } from '../../core/repositories';
import { Transport } from '../../core/entities/Transport';
import { Station } from '../../core/entities/Station';
import { Coordinate } from '../../core/value-objects/Coordinate';
import { ID, TransportType } from '../../shared/types';

export interface FindAvailableTransportsRequest {
  userLocation?: Coordinate;
  stationId?: ID;
  transportType?: TransportType;
  radiusKm?: number;
  maxResults?: number;
}

export interface TransportWithDistance extends Transport {
  distanceKm?: number;
  station?: Station;
}

export interface FindAvailableTransportsResponse {
  transports: TransportWithDistance[];
  totalFound: number;
  searchCenter?: Coordinate;
  searchRadius?: number;
}

export class FindAvailableTransportsUseCase {
  constructor(
    private transportRepository: TransportRepository,
    private stationRepository: StationRepository
  ) {}

  async execute(request: FindAvailableTransportsRequest): Promise<FindAvailableTransportsResponse> {
    this.validateRequest(request);

    try {
      let transports: Transport[] = [];

      if (request.stationId) {
        // Find transports at a specific station
        transports = await this.findTransportsAtStation(request.stationId);
      } else if (request.userLocation) {
        // Find transports near user location
        transports = await this.findTransportsNearLocation(request);
      } else {
        // Find all available transports
        transports = await this.findAllAvailableTransports();
      }

      // Filter by transport type if specified
      if (request.transportType) {
        transports = transports.filter(transport => transport.type === request.transportType);
      }

      // Calculate distances and add station info
      const transportsWithInfo = await this.enrichTransportsWithInfo(
        transports,
        request.userLocation
      );

      // Sort by distance if user location is provided
      if (request.userLocation) {
        transportsWithInfo.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      }

      // Limit results if specified
      const limitedResults = request.maxResults 
        ? transportsWithInfo.slice(0, request.maxResults)
        : transportsWithInfo;

      return {
        transports: limitedResults,
        totalFound: transportsWithInfo.length,
        searchCenter: request.userLocation,
        searchRadius: request.radiusKm,
      };
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  private validateRequest(request: FindAvailableTransportsRequest): void {
    if (request.radiusKm && request.radiusKm <= 0) {
      throw new Error('Search radius must be greater than 0');
    }

    if (request.maxResults && request.maxResults <= 0) {
      throw new Error('Max results must be greater than 0');
    }

    if (request.transportType && !Object.values(TransportType).includes(request.transportType)) {
      throw new Error('Invalid transport type');
    }
  }

  private async findTransportsAtStation(stationId: ID): Promise<Transport[]> {
    const transports = await this.transportRepository.findByStation(stationId);
    return transports.filter(transport => transport.isAvailable());
  }

  private async findTransportsNearLocation(request: FindAvailableTransportsRequest): Promise<Transport[]> {
    if (!request.userLocation) {
      throw new Error('User location is required');
    }

    const radiusKm = request.radiusKm || 5; // Default 5km radius
    
    const transports = await this.transportRepository.findNearby({
      center: request.userLocation,
      radiusKm,
      limit: request.maxResults,
    });

    return transports.filter(transport => transport.isAvailable());
  }

  private async findAllAvailableTransports(): Promise<Transport[]> {
    return await this.transportRepository.findAvailable();
  }

  private async enrichTransportsWithInfo(
    transports: Transport[],
    userLocation?: Coordinate
  ): Promise<TransportWithDistance[]> {
    const enrichedTransports: TransportWithDistance[] = [];

    for (const transport of transports) {
      const enriched = transport as TransportWithDistance;

      // Load station information
      try {
        const station = await this.stationRepository.findById(transport.currentStationId);
        if (station) {
          enriched.station = station;

          // Calculate distance if user location is provided
          if (userLocation) {
            enriched.distanceKm = station.distanceToCoordinate(userLocation);
          }
        }
      } catch (error) {
        console.warn(`Failed to load station ${transport.currentStationId}:`, error);
      }

      enrichedTransports.push(enriched);
    }

    return enrichedTransports;
  }

  private handleError(error: any): void {
    const errorCode = error.code;
    
    switch (errorCode) {
      case 'STATION_NOT_FOUND':
        throw new Error('The specified station was not found');
      case 'NO_TRANSPORTS_FOUND':
        throw new Error('No available transports found in the specified area');
      case 'LOCATION_SERVICE_ERROR':
        throw new Error('Unable to determine location. Please check your GPS settings.');
      case 'NETWORK_ERROR':
        throw new Error('Connection error. Please check your internet connection.');
      default:
        throw new Error('Unable to find available transports. Please try again.');
    }
  }
}