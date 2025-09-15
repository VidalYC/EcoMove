import { Request, Response } from 'express';
import {
  CreateStationUseCase,
  GetStationUseCase,
  GetAllStationsUseCase,
  UpdateStationUseCase,
  FindNearbyStationsUseCase,
  GetStationAvailabilityUseCase,
  CalculateRouteUseCase,
  GetStationStatsUseCase,
  FindStationsWithTransportsUseCase,
  ActivateStationUseCase,
  DeactivateStationUseCase,
  GetOccupancyRankingUseCase
} from '../../../core/use-cases/station';
import { StationFilters } from '../../../core/domain/value-objects/station-filters';

export class StationController {
  constructor(
    private readonly createStationUseCase: CreateStationUseCase,
    private readonly getStationUseCase: GetStationUseCase,
    private readonly getAllStationsUseCase: GetAllStationsUseCase,
    private readonly updateStationUseCase: UpdateStationUseCase,
    private readonly findNearbyStationsUseCase: FindNearbyStationsUseCase,
    private readonly getStationAvailabilityUseCase: GetStationAvailabilityUseCase,
    private readonly calculateRouteUseCase: CalculateRouteUseCase,
    private readonly getStationStatsUseCase: GetStationStatsUseCase,
    private readonly findStationsWithTransportsUseCase: FindStationsWithTransportsUseCase,
    private readonly activateStationUseCase: ActivateStationUseCase,
    private readonly deactivateStationUseCase: DeactivateStationUseCase,
    private readonly getOccupancyRankingUseCase: GetOccupancyRankingUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, address, latitude, longitude, maxCapacity } = req.body;

      const station = await this.createStationUseCase.execute({
        name,
        address,
        coordinate: { latitude, longitude },
        maxCapacity
      });

      res.status(201).json({
        success: true,
        message: 'Estación creada exitosamente',
        data: station
      });

    } catch (error) {
      console.error('Error en create station:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear estación'
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stationId = parseInt(id);

      if (isNaN(stationId)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      const station = await this.getStationUseCase.execute(stationId);

      if (!station) {
        res.status(404).json({
          success: false,
          message: 'Estación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: station
      });

    } catch (error) {
      console.error('Error en getById station:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Construir filtros
      const filters = StationFilters.create({
        active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
        minCapacity: req.query.minCapacity ? parseInt(req.query.minCapacity as string) : undefined,
        maxCapacity: req.query.maxCapacity ? parseInt(req.query.maxCapacity as string) : undefined,
        latitude: req.query.latitude ? parseFloat(req.query.latitude as string) : undefined,
        longitude: req.query.longitude ? parseFloat(req.query.longitude as string) : undefined,
        radiusKm: req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : undefined
      });

      const result = await this.getAllStationsUseCase.execute(page, limit, filters);

      res.json({
        success: true,
        data: result.stations,
        pagination: {
          total: result.total,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          limit
        }
      });

    } catch (error) {
      console.error('Error en getAll stations:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stationId = parseInt(id);

      if (isNaN(stationId)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      const { name, address, latitude, longitude, maxCapacity } = req.body;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (address !== undefined) updates.address = address;
      if (maxCapacity !== undefined) updates.maxCapacity = maxCapacity;
      if (latitude !== undefined && longitude !== undefined) {
        updates.coordinate = { latitude, longitude };
      }

      const station = await this.updateStationUseCase.execute(stationId, updates);

      if (!station) {
        res.status(404).json({
          success: false,
          message: 'Estación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Estación actualizada exitosamente',
        data: station
      });

    } catch (error) {
      console.error('Error en update station:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar estación'
      });
    }
  }

  async findNearby(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, radius } = req.query;

      if (!latitude || !longitude || !radius) {
        res.status(400).json({
          success: false,
          message: 'Se requieren latitud, longitud y radio'
        });
        return;
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const radiusKm = parseFloat(radius as string);
      const limit = parseInt(req.query.limit as string) || 10;

      if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
        res.status(400).json({
          success: false,
          message: 'Coordenadas y radio deben ser números válidos'
        });
        return;
      }

      const stations = await this.findNearbyStationsUseCase.execute(
        { latitude: lat, longitude: lng },
        radiusKm,
        limit
      );

      res.json({
        success: true,
        data: stations,
        total: stations.length
      });

    } catch (error) {
      console.error('Error en findNearby stations:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error en búsqueda de estaciones cercanas'
      });
    }
  }

  async getAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stationId = parseInt(id);

      if (isNaN(stationId)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      const availability = await this.getStationAvailabilityUseCase.execute(stationId);

      if (!availability) {
        res.status(404).json({
          success: false,
          message: 'Estación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          station: availability.station,
          totalTransports: availability.totalTransports,
          availableTransports: availability.availableTransports,
          availabilityByType: availability.availabilityByType,
          occupancyPercentage: availability.occupancyPercentage,
          availableSpaces: availability.availableSpaces,
          isFull: availability.isFull,
          isEmpty: availability.isEmpty
        }
      });

    } catch (error) {
      console.error('Error en getAvailability station:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  async calculateRoute(req: Request, res: Response): Promise<void> {
    try {
      const { origin, destination } = req.query;

      if (!origin || !destination) {
        res.status(400).json({
          success: false,
          message: 'Se requieren IDs de estación origen y destino'
        });
        return;
      }

      const originId = parseInt(origin as string);
      const destinationId = parseInt(destination as string);

      if (isNaN(originId) || isNaN(destinationId)) {
        res.status(400).json({
          success: false,
          message: 'IDs de estación inválidos'
        });
        return;
      }

      const route = await this.calculateRouteUseCase.execute(originId, destinationId);

      if (!route) {
        res.status(404).json({
          success: false,
          message: 'No se pudo calcular la ruta entre las estaciones'
        });
        return;
      }

      res.json({
        success: true,
        data: route
      });

    } catch (error) {
      console.error('Error en calculateRoute:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al calcular ruta'
      });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.getStationStatsUseCase.execute();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error en getStats stations:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  async findWithTransports(req: Request, res: Response): Promise<void> {
    try {
      const transportType = req.query.type as string;

      const stations = await this.findStationsWithTransportsUseCase.execute(transportType);

      res.json({
        success: true,
        data: stations,
        total: stations.length
      });

    } catch (error) {
      console.error('Error en findWithTransports:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  async activate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stationId = parseInt(id);

      if (isNaN(stationId)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      const success = await this.activateStationUseCase.execute(stationId);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Estación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Estación activada exitosamente'
      });

    } catch (error) {
      console.error('Error en activate station:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stationId = parseInt(id);

      if (isNaN(stationId)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      const success = await this.deactivateStationUseCase.execute(stationId);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Estación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Estación desactivada exitosamente'
      });

    } catch (error) {
      console.error('Error en deactivate station:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  async getOccupancyRanking(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const ranking = await this.getOccupancyRankingUseCase.execute(limit);

      res.json({
        success: true,
        data: ranking
      });

    } catch (error) {
      console.error('Error en getOccupancyRanking:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}