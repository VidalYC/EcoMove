import { Request, Response } from 'express';
import { PrestamoService } from '../services/PrestamoService';
import { IPrestamoCreate, EstadoPrestamo, MetodoPago } from '../types/Prestamo';

export class PrestamoController {

  /**
   * Iniciar un nuevo préstamo
   * POST /api/v1/prestamos
   */
  static async iniciarPrestamo(req: Request, res: Response): Promise<void> {
    try {
      const { usuario_id, transporte_id, estacion_origen_id, duracion_estimada }: IPrestamoCreate = req.body;

      // Validaciones básicas
      if (!usuario_id || !transporte_id || !estacion_origen_id) {
        res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios: usuario_id, transporte_id, estacion_origen_id'
        });
        return;
      }

      if (typeof usuario_id !== 'number' || typeof transporte_id !== 'number' || typeof estacion_origen_id !== 'number') {
        res.status(400).json({
          success: false,
          message: 'Los IDs deben ser números válidos'
        });
        return;
      }

      const prestamoData: IPrestamoCreate = {
        usuario_id,
        transporte_id,
        estacion_origen_id,
        duracion_estimada: duracion_estimada || 120 // 2 horas por defecto
      };

      const resultado = await PrestamoService.iniciarPrestamo(prestamoData);

      if (resultado.success) {
        res.status(201).json({
          success: true,
          message: 'Préstamo iniciado exitosamente',
          data: resultado.prestamo
        });
      } else {
        res.status(400).json({
          success: false,
          message: resultado.error
        });
      }

    } catch (error) {
      console.error('Error en iniciarPrestamo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Finalizar un préstamo
   * PUT /api/v1/prestamos/:id/finalizar
   */
  static async finalizarPrestamo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { estacion_destino_id, metodo_pago } = req.body;
      const prestamoId = parseInt(id);

      if (isNaN(prestamoId)) {
        res.status(400).json({
          success: false,
          message: 'ID de préstamo inválido'
        });
        return;
      }

      if (!estacion_destino_id) {
        res.status(400).json({
          success: false,
          message: 'estacion_destino_id es obligatorio'
        });
        return;
      }

      if (typeof estacion_destino_id !== 'number') {
        res.status(400).json({
          success: false,
          message: 'estacion_destino_id debe ser un número válido'
        });
        return;
      }

      // Validar método de pago si se proporciona
      if (metodo_pago && !Object.values(MetodoPago).includes(metodo_pago)) {
        res.status(400).json({
          success: false,
          message: 'Método de pago inválido'
        });
        return;
      }

      const resultado = await PrestamoService.finalizarPrestamo(
        prestamoId,
        estacion_destino_id,
        metodo_pago || MetodoPago.EFECTIVO
      );

      if (resultado.success) {
        res.json({
          success: true,
          message: 'Préstamo finalizado exitosamente',
          data: {
            prestamo: resultado.prestamo,
            calculo_tarifa: resultado.calculo
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: resultado.error
        });
      }

    } catch (error) {
      console.error('Error en finalizarPrestamo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Cancelar un préstamo
   * PUT /api/v1/prestamos/:id/cancelar
   */
  static async cancelarPrestamo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { razon } = req.body;
      const prestamoId = parseInt(id);

      if (isNaN(prestamoId)) {
        res.status(400).json({
          success: false,
          message: 'ID de préstamo inválido'
        });
        return;
      }

      const resultado = await PrestamoService.cancelarPrestamo(prestamoId, razon);

      if (resultado.success) {
        res.json({
          success: true,
          message: 'Préstamo cancelado exitosamente',
          data: resultado.prestamo
        });
      } else {
        res.status(400).json({
          success: false,
          message: resultado.error
        });
      }

    } catch (error) {
      console.error('Error en cancelarPrestamo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Extender tiempo de un préstamo
   * PUT /api/v1/prestamos/:id/extender
   */
  static async extenderPrestamo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { minutos_adicionales } = req.body;
      const prestamoId = parseInt(id);

      if (isNaN(prestamoId)) {
        res.status(400).json({
          success: false,
          message: 'ID de préstamo inválido'
        });
        return;
      }

      if (!minutos_adicionales || typeof minutos_adicionales !== 'number' || minutos_adicionales <= 0) {
        res.status(400).json({
          success: false,
          message: 'minutos_adicionales debe ser un número positivo'
        });
        return;
      }

      if (minutos_adicionales > 480) { // Máximo 8 horas adicionales
        res.status(400).json({
          success: false,
          message: 'No se pueden agregar más de 480 minutos (8 horas)'
        });
        return;
      }

      const resultado = await PrestamoService.extenderPrestamo(prestamoId, minutos_adicionales);

      if (resultado.success) {
        res.json({
          success: true,
          message: `Préstamo extendido por ${minutos_adicionales} minutos`,
          data: {
            prestamo: resultado.prestamo,
            costo_adicional: resultado.costo_adicional
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: resultado.error
        });
      }

    } catch (error) {
      console.error('Error en extenderPrestamo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener historial de préstamos de un usuario
   * GET /api/v1/prestamos/usuario/:usuarioId
   */
  static async obtenerHistorialUsuario(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId } = req.params;
      const { page = '1', limit = '10' } = req.query;
      
      const userId = parseInt(usuarioId);
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
        return;
      }

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({
          success: false,
          message: 'Número de página inválido'
        });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          message: 'Límite inválido (debe estar entre 1 y 100)'
        });
        return;
      }

      const historial = await PrestamoService.obtenerHistorialUsuario(userId, pageNum, limitNum);

      res.json({
        success: true,
        message: 'Historial obtenido exitosamente',
        data: historial
      });

    } catch (error) {
      console.error('Error en obtenerHistorialUsuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener disponibilidad de una estación
   * GET /api/v1/prestamos/estacion/:estacionId/disponibilidad
   */
  static async obtenerDisponibilidadEstacion(req: Request, res: Response): Promise<void> {
    try {
      const { estacionId } = req.params;
      const estacionIdNum = parseInt(estacionId);

      if (isNaN(estacionIdNum)) {
        res.status(400).json({
          success: false,
          message: 'ID de estación inválido'
        });
        return;
      }

      const disponibilidad = await PrestamoService.obtenerDisponibilidadEstacion(estacionIdNum);

      res.json({
        success: true,
        message: 'Disponibilidad obtenida exitosamente',
        data: disponibilidad
      });

    } catch (error) {
      console.error('Error en obtenerDisponibilidadEstacion:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener reporte de préstamos por período
   * GET /api/v1/prestamos/reporte
   */
  static async obtenerReportePeriodo(req: Request, res: Response): Promise<void> {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      if (!fecha_inicio || !fecha_fin) {
        res.status(400).json({
          success: false,
          message: 'fecha_inicio y fecha_fin son obligatorios'
        });
        return;
      }

      const fechaInicio = new Date(fecha_inicio as string);
      const fechaFin = new Date(fecha_fin as string);

      if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Fechas inválidas. Use formato YYYY-MM-DD'
        });
        return;
      }

      if (fechaInicio > fechaFin) {
        res.status(400).json({
          success: false,
          message: 'fecha_inicio no puede ser mayor que fecha_fin'
        });
        return;
      }

      // Validar que el rango no sea mayor a 1 año
      const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 365) {
        res.status(400).json({
          success: false,
          message: 'El rango de fechas no puede ser mayor a 1 año'
        });
        return;
      }

      const reporte = await PrestamoService.obtenerReportePeriodo(fechaInicio, fechaFin);

      res.json({
        success: true,
        message: 'Reporte generado exitosamente',
        data: reporte
      });

    } catch (error) {
      console.error('Error en obtenerReportePeriodo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Calcular tarifa estimada
   * POST /api/v1/prestamos/calcular-tarifa
   */
  static async calcularTarifaEstimada(req: Request, res: Response): Promise<void> {
    try {
      const { transporte_id, duracion_minutos } = req.body;

      if (!transporte_id || !duracion_minutos) {
        res.status(400).json({
          success: false,
          message: 'transporte_id y duracion_minutos son obligatorios'
        });
        return;
      }

      if (typeof transporte_id !== 'number' || typeof duracion_minutos !== 'number') {
        res.status(400).json({
          success: false,
          message: 'transporte_id y duracion_minutos deben ser números'
        });
        return;
      }

      if (duracion_minutos <= 0 || duracion_minutos > 1440) { // Máximo 24 horas
        res.status(400).json({
          success: false,
          message: 'duracion_minutos debe estar entre 1 y 1440 (24 horas)'
        });
        return;
      }

      // Obtener datos del transporte (esto debería estar en TransporteService, pero lo simulamos)
      const transporteData = {
        tarifa_por_hora: 3000, // Valor por defecto
        tipo: 'bicycle' // Valor por defecto
      };

      const calculo = PrestamoService.calcularTarifa(
        transporteData.tarifa_por_hora,
        duracion_minutos,
        transporteData.tipo
      );

      res.json({
        success: true,
        message: 'Tarifa calculada exitosamente',
        data: calculo
      });

    } catch (error) {
      console.error('Error en calcularTarifaEstimada:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener préstamos activos (para administradores)
   * GET /api/v1/prestamos/activos
   */
  static async obtenerPrestamosActivos(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20' } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({
          success: false,
          message: 'Número de página inválido'
        });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          message: 'Límite inválido (debe estar entre 1 y 100)'
        });
        return;
      }

      const offset = (pageNum - 1) * limitNum;

      // Query directo para obtener préstamos activos con información completa
      const query = `
        SELECT 
          p.id, p.usuario_id, p.transporte_id, p.estacion_origen_id,
          p.fecha_inicio, p.duracion_estimada, p.estado,
          u.nombre as usuario_nombre, u.correo as usuario_correo,
          t.tipo as transporte_tipo, t.modelo as transporte_modelo,
          e.nombre as estacion_origen_nombre
        FROM prestamo p
        LEFT JOIN usuario u ON p.usuario_id = u.id
        LEFT JOIN transporte t ON p.transporte_id = t.id
        LEFT JOIN estacion e ON p.estacion_origen_id = e.id
        WHERE p.estado = $1
        ORDER BY p.fecha_inicio DESC
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM prestamo 
        WHERE estado = $1
      `;

      const [prestamosResult, countResult] = await Promise.all([
        require('../config/database').pool.query(query, [EstadoPrestamo.ACTIVO, limitNum, offset]),
        require('../config/database').pool.query(countQuery, [EstadoPrestamo.ACTIVO])
      ]);

      const prestamos = prestamosResult.rows;
      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        message: 'Préstamos activos obtenidos exitosamente',
        data: {
          prestamos,
          pagination: {
            current_page: pageNum,
            total_pages: Math.ceil(total / limitNum),
            total_items: total,
            items_per_page: limitNum
          }
        }
      });

    } catch (error) {
      console.error('Error en obtenerPrestamosActivos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}