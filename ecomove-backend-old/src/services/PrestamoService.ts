import { pool } from '../config/database';
import { PrestamoModel } from '../models/PrestamoModel';
import { UsuarioModel } from '../models/UsuarioModel';
import { TransporteModel } from '../models/TransporteModel';
import { EstacionModel } from '../models/EstacionModel';
import { EstadoTransporte } from '../types/Transporte';
import {
  IPrestamo,
  IPrestamoCreate,
  IPrestamoCompleto,
  EstadoPrestamo,
  MetodoPago,
  ICalculoTarifa,
  IHistorialPrestamo
} from '../types/Prestamo';

export class PrestamoService {
  
  /**
   * Iniciar un nuevo préstamo con validaciones completas
   */
  static async iniciarPrestamo(prestamoData: IPrestamoCreate): Promise<{
    success: boolean;
    prestamo?: IPrestamo;
    error?: string;
  }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Validar que el usuario existe y está activo
      const usuario = await UsuarioModel.findById(prestamoData.usuario_id);
      if (!usuario || usuario.estado !== 'active') {
        throw new Error('Usuario no encontrado o inactivo');
      }
      
      // 2. Verificar que el usuario no tenga préstamos activos
      const prestamoActivo = await PrestamoModel.findActivoByUsuario(prestamoData.usuario_id);
      if (prestamoActivo) {
        throw new Error('El usuario ya tiene un préstamo activo');
      }
      
      // 3. Validar que el transporte existe y está disponible
      const transporte = await TransporteModel.findById(prestamoData.transporte_id);
      if (!transporte) {
        throw new Error('Transporte no encontrado');
      }
      
      if (transporte.estado !== EstadoTransporte.DISPONIBLE) {
        throw new Error('El transporte no está disponible');
      }
      
      // 4. Validar que el transporte está en la estación especificada
      if (transporte.estacion_actual_id !== prestamoData.estacion_origen_id) {
        throw new Error('El transporte no se encuentra en la estación especificada');
      }
      
      // 5. Validar disponibilidad específica para transportes eléctricos
      const transporteCompleto = await TransporteModel.findByIdComplete(transporte.id!);
      if (transporteCompleto && transporteCompleto.nivel_bateria !== undefined && transporteCompleto.nivel_bateria < 15) {
        throw new Error('El transporte eléctrico no tiene suficiente batería');
      }
      
      // 6. Validar que la estación origen existe
      const estacionOrigen = await EstacionModel.findById(prestamoData.estacion_origen_id);
      if (!estacionOrigen) {
        throw new Error('Estación de origen no encontrada');
      }
      
      // 7. Crear el préstamo
      const nuevoPrestamo = await PrestamoModel.create(prestamoData);
      
      // 8. Actualizar estado del transporte a "en_uso"
      await TransporteModel.updateEstado(transporte.id!, EstadoTransporte.EN_USO);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        prestamo: nuevoPrestamo
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      };
    } finally {
      client.release();
    }
  }
  
  /**
   * Finalizar un préstamo con cálculo de tarifas
   */
  static async finalizarPrestamo(
    prestamoId: number, 
    estacionDestinoId: number,
    metodoPago: MetodoPago = MetodoPago.EFECTIVO
  ): Promise<{
    success: boolean;
    prestamo?: IPrestamoCompleto;
    calculo?: ICalculoTarifa;
    error?: string;
  }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Obtener el préstamo activo
      const prestamo = await PrestamoModel.findById(prestamoId);
      if (!prestamo) {
        throw new Error('Préstamo no encontrado');
      }
      
      if (prestamo.estado !== EstadoPrestamo.ACTIVO) {
        throw new Error('El préstamo no está activo');
      }
      
      // 2. Validar estación destino
      const estacionDestino = await EstacionModel.findById(estacionDestinoId);
      if (!estacionDestino) {
        throw new Error('Estación de destino no encontrada');
      }
      
      // 3. Obtener datos del transporte para cálculo de tarifa
      const transporte = await TransporteModel.findById(prestamo.transporte_id);
      if (!transporte) {
        throw new Error('Transporte no encontrado');
      }
      
      // 4. Calcular duración y costo
      const fechaFin = new Date();
      const duracionMinutos = Math.ceil(
        (fechaFin.getTime() - prestamo.fecha_inicio.getTime()) / (1000 * 60)
      );
      
      const calculo = this.calcularTarifa(
        transporte.tarifa_por_hora,
        duracionMinutos,
        transporte.tipo
      );
      
      // 5. Actualizar el préstamo
      await PrestamoModel.update(prestamoId, {
        estacion_destino_id: estacionDestinoId,
        fecha_fin: fechaFin,
        costo_total: calculo.costo_total,
        estado: EstadoPrestamo.COMPLETADO,
        metodo_pago: metodoPago
      });
      
      // 6. Actualizar transporte: disponible + nueva estación
      await TransporteModel.updateEstado(transporte.id!, EstadoTransporte.DISPONIBLE);
      await TransporteModel.updateEstacion(transporte.id!, estacionDestinoId);
      
      // 7. Obtener préstamo completo actualizado
      const prestamoCompleto = await PrestamoModel.findByIdComplete(prestamoId);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        prestamo: prestamoCompleto!,
        calculo
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      };
    } finally {
      client.release();
    }
  }
  
  /**
   * Cancelar un préstamo activo
   */
  static async cancelarPrestamo(prestamoId: number, razon?: string): Promise<{
    success: boolean;
    prestamo?: IPrestamo;
    error?: string;
  }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const prestamo = await PrestamoModel.findById(prestamoId);
      if (!prestamo) {
        throw new Error('Préstamo no encontrado');
      }
      
      if (prestamo.estado !== EstadoPrestamo.ACTIVO) {
        throw new Error('Solo se pueden cancelar préstamos activos');
      }
      
      // Actualizar préstamo a cancelado
      await PrestamoModel.update(prestamoId, {
        estado: EstadoPrestamo.CANCELADO,
        fecha_fin: new Date()
      });
      
      // Liberar el transporte
      await TransporteModel.updateEstado(prestamo.transporte_id, EstadoTransporte.DISPONIBLE);
      
      const prestamoActualizado = await PrestamoModel.findById(prestamoId);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        prestamo: prestamoActualizado!
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      };
    } finally {
      client.release();
    }
  }
  
  /**
   * Calcular tarifa según tipo de transporte y duración
   */
  static calcularTarifa(
    tarifaPorHora: number,
    duracionMinutos: number,
    tipoTransporte: string
  ): ICalculoTarifa {
    const duracionHoras = duracionMinutos / 60;
    let costo = tarifaPorHora * duracionHoras;
    let descuentos = 0;
    
    // Aplicar descuentos según reglas de negocio
    if (duracionMinutos <= 30) {
      // Descuento para viajes cortos
      descuentos = costo * 0.1; // 10% descuento
    } else if (duracionMinutos >= 180) {
      // Recargo para viajes muy largos
      costo = costo * 1.15; // 15% recargo
    }
    
    // Descuento especial para bicicletas (promoción ecológica)
    if (tipoTransporte === 'bicycle') {
      descuentos += costo * 0.05; // 5% adicional
    }
    
    const impuestos = costo * 0.19; // IVA Colombia
    const costoFinal = Math.round((costo - descuentos + impuestos) * 100) / 100;
    
    return {
      tarifa_base: tarifaPorHora,
      duracion_minutos: duracionMinutos,
      costo_total: costoFinal,
      descuentos_aplicados: Math.round(descuentos * 100) / 100,
      impuestos: Math.round(impuestos * 100) / 100
    };
  }
  
  /**
   * Obtener historial de préstamos de un usuario con paginación
   */
  static async obtenerHistorialUsuario(
    usuarioId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<IHistorialPrestamo> {
    const offset = (page - 1) * limit;
    
    // Obtener préstamos paginados - usar query directo para asegurar el tipo correcto
    const prestamosQuery = `
      SELECT 
        p.id, p.usuario_id, p.transporte_id, p.estacion_origen_id, p.estacion_destino_id,
        p.fecha_inicio, p.fecha_fin, p.duracion_estimada, p.costo_total, p.estado,
        p.metodo_pago, p.created_at, p.updated_at
      FROM prestamo p
      WHERE p.usuario_id = $1
      ORDER BY p.fecha_inicio DESC
      LIMIT $2 OFFSET $3
    `;
    
    const prestamosResult = await pool.query(prestamosQuery, [usuarioId, limit, offset]);
    const prestamos: IPrestamoCompleto[] = prestamosResult.rows;
    
    // Contar total de préstamos
    const totalQuery = `SELECT COUNT(*) as total FROM prestamo WHERE usuario_id = $1`;
    const totalResult = await pool.query(totalQuery, [usuarioId]);
    const total = parseInt(totalResult.rows[0].total);
    
    return {
      prestamos,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      estadisticas_usuario: {
        total_prestamos: total,
        tiempo_total_uso: 0,
        gasto_total: 0,
        transporte_favorito: 'bicycle'
      }
    };
  }
  
  /**
   * Obtener disponibilidad en tiempo real de una estación
   */
  static async obtenerDisponibilidadEstacion(estacionId: number): Promise<{
    estacion: any;
    transportes_disponibles: any[];
    capacidad: any;
  }> {
    const [estacion, transportes] = await Promise.all([
      EstacionModel.findById(estacionId),
      TransporteModel.findByEstacion(estacionId)
    ]);
    
    // Capacidad simplificada
    const capacidad = {
      capacidad_maxima: 20,
      transportes_actuales: transportes.length,
      espacios_libres: 20 - transportes.length,
      puede_recibir: transportes.length < 20
    };
    
    return {
      estacion,
      transportes_disponibles: transportes.filter(t => t.estado === EstadoTransporte.DISPONIBLE),
      capacidad
    };
  }
  
  /**
   * Extender tiempo de un préstamo activo
   */
  static async extenderPrestamo(
    prestamoId: number,
    minutosAdicionales: number
  ): Promise<{
    success: boolean;
    prestamo?: IPrestamo;
    costo_adicional?: number;
    error?: string;
  }> {
    try {
      const prestamo = await PrestamoModel.findById(prestamoId);
      if (!prestamo || prestamo.estado !== EstadoPrestamo.ACTIVO) {
        throw new Error('Préstamo no encontrado o no activo');
      }
      
      const transporte = await TransporteModel.findById(prestamo.transporte_id);
      if (!transporte) {
        throw new Error('Transporte no encontrado');
      }
      
      // Calcular costo adicional
      const costoAdicional = transporte.tarifa_por_hora * (minutosAdicionales / 60);
      const nuevoCosto = (prestamo.costo_total || 0) + costoAdicional;
      
      await PrestamoModel.update(prestamoId, {
        costo_total: nuevoCosto,
        estado: EstadoPrestamo.EXTENDIDO
      });
      
      const prestamoActualizado = await PrestamoModel.findById(prestamoId);
      
      return {
        success: true,
        prestamo: prestamoActualizado!,
        costo_adicional: costoAdicional
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      };
    }
  }
  
  /**
   * Obtener reporte de préstamos por rango de fechas
   */
  static async obtenerReportePeriodo(
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<{
    resumen: any;
    prestamos_por_dia: any[];
    transportes_mas_usados: any[];
    estaciones_mas_activas: any[];
  }> {
    const resumen = await PrestamoModel.getStats();
    const prestamos = await PrestamoModel.findByDateRange(fechaInicio, fechaFin);
    const transportes = await this.getTransportesMasUsados(fechaInicio, fechaFin);
    const estaciones = await this.getEstacionesMasActivas(fechaInicio, fechaFin);
    
    const prestamosPorDia = this.agruparPrestamosPorDia(prestamos);
    
    return {
      resumen,
      prestamos_por_dia: prestamosPorDia,
      transportes_mas_usados: transportes,
      estaciones_mas_activas: estaciones
    };
  }
  
  /**
   * Métodos auxiliares para reportes
   */
  private static async getTransportesMasUsados(fechaInicio: Date, fechaFin: Date): Promise<any[]> {
    const query = `
      SELECT 
        t.tipo,
        t.modelo,
        COUNT(p.id) as total_prestamos,
        SUM(p.costo_total) as ingresos_generados
      FROM prestamo p
      JOIN transporte t ON p.transporte_id = t.id
      WHERE p.fecha_inicio BETWEEN $1 AND $2
      GROUP BY t.tipo, t.modelo
      ORDER BY total_prestamos DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query, [fechaInicio, fechaFin]);
    return result.rows;
  }
  
  private static async getEstacionesMasActivas(fechaInicio: Date, fechaFin: Date): Promise<any[]> {
    const query = `
      SELECT 
        e.nombre,
        COUNT(p.id) as total_prestamos,
        COUNT(CASE WHEN p.estacion_origen_id = e.id THEN 1 END) as prestamos_origen,
        COUNT(CASE WHEN p.estacion_destino_id = e.id THEN 1 END) as prestamos_destino
      FROM prestamo p
      JOIN estacion e ON (p.estacion_origen_id = e.id OR p.estacion_destino_id = e.id)
      WHERE p.fecha_inicio BETWEEN $1 AND $2
      GROUP BY e.id, e.nombre
      ORDER BY total_prestamos DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query, [fechaInicio, fechaFin]);
    return result.rows;
  }
  
  private static agruparPrestamosPorDia(prestamos: any[]): any[] {
    const grupo: { [key: string]: any } = {};
    
    prestamos.forEach(prestamo => {
      const fecha = prestamo.fecha_inicio.toISOString().split('T')[0];
      if (!grupo[fecha]) {
        grupo[fecha] = {
          fecha,
          total_prestamos: 0,
          ingresos: 0,
          prestamos_completados: 0,
          prestamos_cancelados: 0
        };
      }
      
      grupo[fecha].total_prestamos++;
      grupo[fecha].ingresos += prestamo.costo_total || 0;
      
      if (prestamo.estado === EstadoPrestamo.COMPLETADO) {
        grupo[fecha].prestamos_completados++;
      } else if (prestamo.estado === EstadoPrestamo.CANCELADO) {
        grupo[fecha].prestamos_cancelados++;
      }
    });
    
    return Object.values(grupo).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
}