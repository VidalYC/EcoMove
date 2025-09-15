import { Request, Response } from 'express';
import { 
  CreateBicycleUseCase,
  CreateElectricScooterUseCase,
  GetTransportUseCase,
  GetAllTransportsUseCase,
  UpdateTransportUseCase,
  ChangeTransportStatusUseCase,
  MoveTransportToStationUseCase,
  FindAvailableTransportsUseCase,
  UpdateBatteryLevelUseCase,
  GetTransportStatsUseCase,
  DeleteTransportUseCase
} from '../../../core/use-cases/transport';
import { 
  CreateBicycleDto, 
  CreateElectricScooterDto, 
  UpdateTransportDto,
  TransportResponseDto 
} from '../../../shared/interfaces/transport-dtos';
import { Transport } from '../../../core/domain/entities/transport.entity';
import { Bicycle } from '../../../core/domain/entities/bicycle.entity';
import { ElectricScooter } from '../../../core/domain/entities/electric-scooter.entity';
import { TransportType, TransportStatus } from '../../../shared/enums/transport.enums';
import { TransportFilters } from '../../../core/domain/value-objects/transport-filters';
import { ApiResponse } from '../../../shared/interfaces/api-response';

export class TransportController {
  constructor(
    private readonly createBicycleUseCase: CreateBicycleUseCase,
    private readonly createElectricScooterUseCase: CreateElectricScooterUseCase,
    private readonly getTransportUseCase: GetTransportUseCase,
    private readonly getAllTransportsUseCase: GetAllTransportsUseCase,
    private readonly updateTransportUseCase: UpdateTransportUseCase,
    private readonly changeTransportStatusUseCase: ChangeTransportStatusUseCase,
    private readonly moveTransportToStationUseCase: MoveTransportToStationUseCase,
    private readonly findAvailableTransportsUseCase: FindAvailableTransportsUseCase,
    private readonly updateBatteryLevelUseCase: UpdateBatteryLevelUseCase,
    private readonly getTransportStatsUseCase: GetTransportStatsUseCase,
    private readonly deleteTransportUseCase: DeleteTransportUseCase
  ) {}

  // Create Bicycle
  async createBicycle(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateBicycleDto = req.body;
      const bicycle = await this.createBicycleUseCase.execute(dto);
      
      const response: ApiResponse<TransportResponseDto> = {
        success: true,
        message: 'Bicicleta creada exitosamente',
        data: this.mapTransportToDto(bicycle)
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al crear bicicleta'
      };
      res.status(400).json(response);
    }
  }

  // Create Electric Scooter
  async createElectricScooter(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateElectricScooterDto = req.body;
      const scooter = await this.createElectricScooterUseCase.execute(dto);
      
      const response: ApiResponse<TransportResponseDto> = {
        success: true,
        message: 'Patineta eléctrica creada exitosamente',
        data: this.mapTransportToDto(scooter)
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al crear patineta eléctrica'
      };
      res.status(400).json(response);
    }
  }

  // Get All Transports with filters and pagination
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Build filters from query parameters
      const filters = TransportFilters.create({
        type: req.query.type as string,
        status: req.query.status as string,
        stationId: req.query.stationId ? parseInt(req.query.stationId as string) : undefined,
        minRate: req.query.minRate ? parseFloat(req.query.minRate as string) : undefined,
        maxRate: req.query.maxRate ? parseFloat(req.query.maxRate as string) : undefined
      });

      const result = await this.getAllTransportsUseCase.execute(page, limit, filters);

      const response: ApiResponse<{
        transports: TransportResponseDto[];
        pagination: {
          total: number;
          totalPages: number;
          currentPage: number;
          limit: number;
        };
      }> = {
        success: true,
        message: 'Transportes obtenidos exitosamente',
        data: {
          transports: result.transports.map(transport => this.mapTransportToDto(transport)),
          pagination: {
            total: result.total,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            limit
          }
        }
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al obtener transportes'
      };
      res.status(400).json(response);
    }
  }

  // Get Transport by ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const transport = await this.getTransportUseCase.execute(id);

      if (!transport) {
        const response: ApiResponse = {
          success: false,
          message: 'Transporte no encontrado'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<TransportResponseDto> = {
        success: true,
        message: 'Transporte obtenido exitosamente',
        data: this.mapTransportToDto(transport)
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al obtener transporte'
      };
      res.status(400).json(response);
    }
  }

  // Update Transport
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateTransportDto = req.body;
      
      const transport = await this.updateTransportUseCase.execute(id, dto);

      if (!transport) {
        const response: ApiResponse = {
          success: false,
          message: 'Transporte no encontrado'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<TransportResponseDto> = {
        success: true,
        message: 'Transporte actualizado exitosamente',
        data: this.mapTransportToDto(transport)
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al actualizar transporte'
      };
      res.status(400).json(response);
    }
  }

  // Change Transport Status
  async changeStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!Object.values(TransportStatus).includes(status)) {
        const response: ApiResponse = {
          success: false,
          message: `Estado inválido. Debe ser uno de: ${Object.values(TransportStatus).join(', ')}`
        };
        res.status(400).json(response);
        return;
      }

      const success = await this.changeTransportStatusUseCase.execute(id, status);

      if (!success) {
        const response: ApiResponse = {
          success: false,
          message: 'Error al cambiar estado del transporte'
        };
        res.status(500).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: `Estado del transporte cambiado a ${status} exitosamente`
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al cambiar estado'
      };
      res.status(400).json(response);
    }
  }

  // Move Transport to Station
  async moveToStation(req: Request, res: Response): Promise<void> {
    try {
      const transportId = parseInt(req.params.id);
      const { stationId } = req.body;

      if (!stationId || isNaN(parseInt(stationId))) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de estación requerido y válido'
        };
        res.status(400).json(response);
        return;
      }

      const success = await this.moveTransportToStationUseCase.execute(transportId, parseInt(stationId));

      if (!success) {
        const response: ApiResponse = {
          success: false,
          message: 'Error al mover transporte a la estación'
        };
        res.status(500).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Transporte movido exitosamente a la nueva estación'
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al mover transporte'
      };
      res.status(400).json(response);
    }
  }

  // Find Available Transports by Station
  async findAvailableByStation(req: Request, res: Response): Promise<void> {
    try {
      const stationId = parseInt(req.query.stationId as string);
      const type = req.query.type as TransportType;

      if (!stationId || isNaN(stationId)) {
        const response: ApiResponse = {
          success: false,
          message: 'ID de estación requerido y válido'
        };
        res.status(400).json(response);
        return;
      }

      const transports = await this.findAvailableTransportsUseCase.execute(stationId, type);

      const response: ApiResponse<TransportResponseDto[]> = {
        success: true,
        message: 'Transportes disponibles obtenidos exitosamente',
        data: transports.map(transport => this.mapTransportToDto(transport))
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al buscar transportes disponibles'
      };
      res.status(400).json(response);
    }
  }

  // Update Battery Level (for electric scooters)
  async updateBatteryLevel(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { batteryLevel } = req.body;

      if (batteryLevel === undefined || isNaN(parseInt(batteryLevel))) {
        const response: ApiResponse = {
          success: false,
          message: 'Nivel de batería requerido y válido'
        };
        res.status(400).json(response);
        return;
      }

      const success = await this.updateBatteryLevelUseCase.execute(id, parseInt(batteryLevel));

      if (!success) {
        const response: ApiResponse = {
          success: false,
          message: 'Error al actualizar nivel de batería'
        };
        res.status(500).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Nivel de batería actualizado exitosamente'
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al actualizar batería'
      };
      res.status(400).json(response);
    }
  }

  // Get Transport Statistics
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.getTransportStatsUseCase.execute();

      const response: ApiResponse<typeof stats> = {
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: stats
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al obtener estadísticas'
      };
      res.status(500).json(response);
    }
  }

  // Delete Transport
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const success = await this.deleteTransportUseCase.execute(id);

      if (!success) {
        const response: ApiResponse = {
          success: false,
          message: 'Transporte no encontrado'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Transporte eliminado exitosamente'
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: (error as Error).message || 'Error al eliminar transporte'
      };
      res.status(400).json(response);
    }
  }

  // Helper method to map domain entities to DTOs
  private mapTransportToDto(transport: Transport): TransportResponseDto {
    const baseDto: TransportResponseDto = {
      id: transport.id,
      type: transport.type,
      model: transport.model,
      status: transport.status,
      currentStationId: transport.currentStationId,
      hourlyRate: transport.hourlyRate,
      acquisitionDate: transport.acquisitionDate.toISOString(),
      createdAt: transport.createdAt.toISOString(),
      updatedAt: transport.updatedAt.toISOString()
    };

    // Add specific specifications based on transport type
    if (transport instanceof Bicycle) {
      baseDto.specifications = transport.getSpecifications();
    } else if (transport instanceof ElectricScooter) {
      baseDto.specifications = transport.getSpecifications();
    }

    return baseDto;
  }
}