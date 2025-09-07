import { Request, Response } from 'express';
import { TransporteModel } from '../models/TransporteModel';
import { TransporteService } from '../services/TransporteService';
import { 
  IBicicletaCreate, 
  IPatinetaElectricaCreate,
  ITransporteUpdate,
  TipoTransporte,
  EstadoTransporte,
  ITransporteFiltros
} from '../types/Transporte';

// Interfaz para Request extendido
interface ExtendedRequest extends Request {
  user?: {
    id: number;
    correo: string;
    role: string;
  };
}

export class TransporteController {
  // Obtener todos los transportes con filtros
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Construir filtros desde query params
      const filtros: ITransporteFiltros = {};
      
      if (req.query.tipo) {
        filtros.tipo = req.query.tipo as TipoTransporte;
      }
      
      if (req.query.estado) {
        filtros.estado = req.query.estado as EstadoTransporte;
      }
      
      if (req.query.estacion_id) {
        filtros.estacion_id = parseInt(req.query.estacion_id as string);
      }
      
      if (req.query.tarifa_min) {
        filtros.tarifa_min = parseFloat(req.query.tarifa_min as string);
      }
      
      if (req.query.tarifa_max) {
        filtros.tarifa_max = parseFloat(req.query.tarifa_max as string);
      }

      const result = await TransporteService.findAll(page, limit, filtros);

      res.json({
        success: true,
        data: result.transportes,
        pagination: {
          total: result.total,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          limit
        }
      });

    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener transporte por ID
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transporteId = parseInt(id);

      if (isNaN(transporteId)) {
        res.status(400).json({
          success: false,
          message: 'ID de transporte inválido'
        });
        return;
      }

      const transporte = await TransporteModel.findByIdComplete(transporteId);
      if (!transporte) {
        res.status(404).json({
          success: false,
          message: 'Transporte no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: transporte
      });

    } catch (error) {
      console.error('Error en getById:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Crear bicicleta
  static async createBicicleta(req: Request, res: Response): Promise<void> {
    try {
      const bicicletaData: IBicicletaCreate = {
        tipo: TipoTransporte.BICICLETA,
        ...req.body
      };

      const nuevaBicicleta = await TransporteService.createBicicleta(bicicletaData);

      res.status(201).json({
        success: true,
        message: 'Bicicleta creada exitosamente',
        data: nuevaBicicleta
      });

    } catch (error) {
      console.error('Error en createBicicleta:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear bicicleta'
      });
    }
  }

  // Crear patineta eléctrica
  static async createPatinetaElectrica(req: Request, res: Response): Promise<void> {
    try {
      const patinetaData: IPatinetaElectricaCreate = {
        tipo: TipoTransporte.PATINETA_ELECTRICA,
        ...req.body
      };

      const nuevaPatineta = await TransporteService.createPatinetaElectrica(patinetaData);

      res.status(201).json({
        success: true,
        message: 'Patineta eléctrica creada exitosamente',
        data: nuevaPatineta
      });

    } catch (error) {
      console.error('Error en createPatinetaElectrica:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear patineta eléctrica'
      });
    }
  }

  // Actualizar transporte
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transporteId = parseInt(id);
      const updates: ITransporteUpdate = req.body;

      if (isNaN(transporteId)) {
        res.status(400).json({
          success: false,
          message: 'ID de transporte inválido'
        });
        return;
      }

      const transporteActualizado = await TransporteService.update(transporteId, updates);
      if (!transporteActualizado) {
        res.status(404).json({
          success: false,
          message: 'Transporte no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Transporte actualizado exitosamente',
        data: transporteActualizado
      });

    } catch (error) {
      console.error('Error en update:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar transporte'
      });
    }
  }

  // Cambiar estado de transporte
  static async cambiarEstado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const transporteId = parseInt(id);

      if (isNaN(transporteId)) {
        res.status(400).json({
          success: false,
          message: 'ID de transporte inválido'
        });
        return;
      }

      if (!Object.values(EstadoTransporte).includes(estado)) {
        res.status(400).json({
          success: false,
          message: 'Estado de transporte inválido'
        });
        return;
      }

      const success = await TransporteService.cambiarEstado(transporteId, estado);
      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Transporte no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: `Estado cambiado a ${estado} exitosamente`
      });

    } catch (error) {
      console.error('Error en cambiarEstado:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al cambiar estado'
      });
    }
  }

  // Obtener transportes por estación
  static async getByEstacion(req: Request, res: Response): Promise<void> {
    try {
      const { estacionId } = req.params;
      const estacion = parseInt(estacionId);
      const soloDisponibles = req.query.disponibles === 'true';

      if (isNaN(estacion)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      let transportes;
      if (soloDisponibles) {
        transportes = await TransporteModel.findDisponiblesByEstacion(estacion);
      } else {
        transportes = await TransporteModel.findByEstacion(estacion);
      }

      res.json({
        success: true,
        data: transportes,
        total: transportes.length
      });

    } catch (error) {
      console.error('Error en getByEstacion:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Buscar transportes disponibles para préstamo
  static async buscarDisponibles(req: Request, res: Response): Promise<void> {
    try {
      const { estacionId } = req.params;
      const estacion = parseInt(estacionId);
      const tipo = req.query.tipo as TipoTransporte;

      if (isNaN(estacion)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      const transportes = await TransporteService.buscarDisponibles(estacion, tipo);

      res.json({
        success: true,
        data: transportes,
        total: transportes.length
      });

    } catch (error) {
      console.error('Error en buscarDisponibles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Mover transporte a otra estación
  static async moverAEstacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nuevaEstacionId } = req.body;
      const transporteId = parseInt(id);

      if (isNaN(transporteId) || isNaN(nuevaEstacionId)) {
        res.status(400).json({
          success: false,
          message: 'IDs inválidos'
        });
        return;
      }

      const success = await TransporteService.moverAEstacion(transporteId, nuevaEstacionId);
      if (!success) {
        res.status(400).json({
          success: false,
          message: 'No se pudo mover el transporte'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Transporte movido exitosamente'
      });

    } catch (error) {
      console.error('Error en moverAEstacion:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al mover transporte'
      });
    }
  }

  // Obtener estadísticas de transportes
  static async getStats(req: Request, res: Response): Promise<void> {
        try {
            console.log('🔍 EJECUTANDO TransporteController.getStats()');
            const stats = await TransporteService.getStats();
            console.log('📊 Stats recibidas del Service:', stats);

            res.json({
            success: true,
            data: stats
            });

        } catch (error) {
            console.error('Error en getStats:', error);
            res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
            });
        }
    }

  // Verificar mantenimiento de transporte
  static async verificarMantenimiento(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transporteId = parseInt(id);

      if (isNaN(transporteId)) {
        res.status(400).json({
          success: false,
          message: 'ID de transporte inválido'
        });
        return;
      }

      const necesitaMantenimiento = await TransporteService.verificarMantenimiento(transporteId);

      res.json({
        success: true,
        data: {
          transporte_id: transporteId,
          necesita_mantenimiento: necesitaMantenimiento,
          mensaje: necesitaMantenimiento 
            ? 'Transporte marcado para mantenimiento' 
            : 'Transporte en buen estado'
        }
      });

    } catch (error) {
      console.error('Error en verificarMantenimiento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}