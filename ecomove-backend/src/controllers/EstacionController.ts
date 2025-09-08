import { Request, Response } from 'express';
import { EstacionModel } from '../models/EstacionModel';
import { EstacionService } from '../services/EstacionService';
import { 
  IEstacionCreate, 
  IEstacionUpdate,
  IEstacionFiltros
} from '../types/Estacion';

// Interfaz para Request extendido
interface ExtendedRequest extends Request {
  user?: {
    id: number;
    correo: string;
    role: string;
  };
  targetEstacion?: any;
}

export class EstacionController {
  // Obtener todas las estaciones con filtros
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Construir filtros desde query params
      const filtros: IEstacionFiltros = {};
      
      if (req.query.activa !== undefined) {
        filtros.activa = req.query.activa === 'true';
      }
      
      if (req.query.capacidad_min) {
        filtros.capacidad_min = parseInt(req.query.capacidad_min as string);
      }
      
      if (req.query.capacidad_max) {
        filtros.capacidad_max = parseInt(req.query.capacidad_max as string);
      }

      const result = await EstacionService.findAll(page, limit, filtros);

      res.json({
        success: true,
        data: result.estaciones,
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

  // Obtener estación por ID
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const estacionId = parseInt(id);

      if (isNaN(estacionId)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      const estacion = await EstacionModel.findById(estacionId);
      if (!estacion) {
        res.status(404).json({
          success: false,
          message: 'Estación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: estacion
      });

    } catch (error) {
      console.error('Error en getById:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Crear nueva estación
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const estacionData: IEstacionCreate = req.body;

      const nuevaEstacion = await EstacionService.create(estacionData);

      res.status(201).json({
        success: true,
        message: 'Estación creada exitosamente',
        data: nuevaEstacion
      });

    } catch (error) {
      console.error('Error en create:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear estación'
      });
    }
  }

  // Actualizar estación
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const estacionId = parseInt(id);
      const updates: IEstacionUpdate = req.body;

      if (isNaN(estacionId)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      const estacionActualizada = await EstacionService.update(estacionId, updates);
      if (!estacionActualizada) {
        res.status(404).json({
          success: false,
          message: 'Estación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Estación actualizada exitosamente',
        data: estacionActualizada
      });

    } catch (error) {
      console.error('Error en update:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar estación'
      });
    }
  }

  // Activar estación
  static async activate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const estacionId = parseInt(id);

      if (isNaN(estacionId)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      const success = await EstacionService.activate(estacionId);
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
      console.error('Error en activate:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al activar estación'
      });
    }
  }

  // Desactivar estación
  static async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const estacionId = parseInt(id);

      if (isNaN(estacionId)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      const success = await EstacionService.deactivate(estacionId);
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
      console.error('Error en deactivate:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al desactivar estación'
      });
    }
  }

  // Buscar estaciones cercanas
  static async findNearby(req: Request, res: Response): Promise<void> {
    try {
      const { latitud, longitud } = req.query;
      const radio = parseFloat(req.query.radio as string) || 5;

      if (!latitud || !longitud) {
        res.status(400).json({
          success: false,
          message: 'Latitud y longitud son requeridas'
        });
        return;
      }

      const lat = parseFloat(latitud as string);
      const lng = parseFloat(longitud as string);

      if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({
          success: false,
          message: 'Coordenadas inválidas'
        });
        return;
      }

      const estaciones = await EstacionService.findNearby(lat, lng, radio);

      res.json({
        success: true,
        data: estaciones,
        total: estaciones.length
      });

    } catch (error) {
      console.error('Error en findNearby:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al buscar estaciones cercanas'
      });
    }
  }

  // Obtener disponibilidad de una estación
  static async getDisponibilidad(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const estacionId = parseInt(id);

      if (isNaN(estacionId)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      const disponibilidad = await EstacionService.getDisponibilidad(estacionId);
      if (!disponibilidad) {
        res.status(404).json({
          success: false,
          message: 'Estación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: disponibilidad
      });

    } catch (error) {
      console.error('Error en getDisponibilidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estaciones con transportes disponibles
  static async getWithAvailableTransports(req: Request, res: Response): Promise<void> {
    try {
      const tipo = req.query.tipo as string;

      const estaciones = await EstacionService.findWithAvailableTransports(tipo);

      res.json({
        success: true,
        data: estaciones,
        total: estaciones.length
      });

    } catch (error) {
      console.error('Error en getWithAvailableTransports:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener ranking de ocupación
  static async getRankingOcupacion(req: Request, res: Response): Promise<void> {
    try {
      const ranking = await EstacionService.getRankingOcupacion();

      res.json({
        success: true,
        data: ranking
      });

    } catch (error) {
      console.error('Error en getRankingOcupacion:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Calcular ruta entre estaciones
  static async calcularRuta(req: Request, res: Response): Promise<void> {
    try {
      const { origen, destino } = req.query;

      if (!origen || !destino) {
        res.status(400).json({
          success: false,
          message: 'IDs de estación origen y destino son requeridos'
        });
        return;
      }

      const origenId = parseInt(origen as string);
      const destinoId = parseInt(destino as string);

      if (isNaN(origenId) || isNaN(destinoId)) {
        res.status(400).json({
          success: false,
          message: 'IDs de estación inválidos'
        });
        return;
      }

      const ruta = await EstacionService.calcularRutaOptima(origenId, destinoId);

      res.json({
        success: true,
        data: ruta
      });

    } catch (error) {
      console.error('Error en calcularRuta:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al calcular ruta'
      });
    }
  }

  // Obtener estadísticas de estaciones
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await EstacionService.getStats();

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
}