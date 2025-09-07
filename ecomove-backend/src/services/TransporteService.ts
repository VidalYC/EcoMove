import { pool } from '../config/database';
import { TransporteModel } from '../models/TransporteModel';
import { 
  ITransporte, 
  ITransporteUpdate, 
  ITransporteFiltros,
  TipoTransporte, 
  EstadoTransporte,
  IBicicletaCreate,
  IPatinetaElectricaCreate 
} from '../types/Transporte';

export class TransporteService {
  // Obtener todos los transportes con paginación y filtros
  static async findAll(page: number = 1, limit: number = 10, filtros?: ITransporteFiltros): Promise<{
    transportes: ITransporte[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;
    
    // Construir query dinámicamente según filtros
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (filtros?.tipo) {
      whereConditions.push(`tipo = $${paramIndex}`);
      queryParams.push(filtros.tipo);
      paramIndex++;
    }

    if (filtros?.estado) {
      whereConditions.push(`estado = $${paramIndex}`);
      queryParams.push(filtros.estado);
      paramIndex++;
    }

    if (filtros?.estacion_id) {
      whereConditions.push(`estacion_actual_id = $${paramIndex}`);
      queryParams.push(filtros.estacion_id);
      paramIndex++;
    }

    if (filtros?.tarifa_min) {
      whereConditions.push(`tarifa_por_hora >= $${paramIndex}`);
      queryParams.push(filtros.tarifa_min);
      paramIndex++;
    }

    if (filtros?.tarifa_max) {
      whereConditions.push(`tarifa_por_hora <= $${paramIndex}`);
      queryParams.push(filtros.tarifa_max);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Query para obtener transportes
    const transportesQuery = `
      SELECT id, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora,
             fecha_adquisicion, created_at, updated_at
      FROM transporte 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM transporte ${whereClause}`;
    
    const transportesParams = [...queryParams, limit, offset];
    
    const [transportesResult, countResult] = await Promise.all([
      pool.query(transportesQuery, transportesParams),
      pool.query(countQuery, queryParams)
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    return {
      transportes: transportesResult.rows,
      total,
      totalPages,
      currentPage: page
    };
  }

  // Crear bicicleta con validaciones de negocio
  static async createBicicleta(bicicletaData: IBicicletaCreate): Promise<any> {
    // Validaciones específicas de bicicleta
    if (bicicletaData.num_marchas < 1 || bicicletaData.num_marchas > 30) {
      throw new Error('El número de marchas debe estar entre 1 y 30');
    }

    if (bicicletaData.tarifa_por_hora <= 0) {
      throw new Error('La tarifa debe ser mayor a 0');
    }

    const tiposFrenos = ['Disco', 'V-Brake', 'Cantilever', 'Tambor'];
    if (!tiposFrenos.includes(bicicletaData.tipo_freno)) {
      throw new Error('Tipo de freno no válido');
    }

    return await TransporteModel.createBicicleta(bicicletaData);
  }

  // Crear patineta eléctrica con validaciones
  static async createPatinetaElectrica(patinetaData: IPatinetaElectricaCreate): Promise<any> {
    // Validaciones específicas de patineta
    if (patinetaData.velocidad_maxima < 10 || patinetaData.velocidad_maxima > 50) {
      throw new Error('La velocidad máxima debe estar entre 10 y 50 km/h');
    }

    if (patinetaData.autonomia < 10 || patinetaData.autonomia > 100) {
      throw new Error('La autonomía debe estar entre 10 y 100 km');
    }

    if (patinetaData.nivel_bateria && (patinetaData.nivel_bateria < 0 || patinetaData.nivel_bateria > 100)) {
      throw new Error('El nivel de batería debe estar entre 0 y 100%');
    }

    return await TransporteModel.createPatinetaElectrica(patinetaData);
  }

  // Actualizar transporte con validaciones
  static async update(id: number, updates: ITransporteUpdate): Promise<ITransporte | null> {
    const transporte = await TransporteModel.findById(id);
    if (!transporte) {
      throw new Error('Transporte no encontrado');
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const allowedFields = ['modelo', 'estado', 'estacion_actual_id', 'tarifa_por_hora', 'kilometraje'];
      const setFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key as keyof ITransporteUpdate] !== undefined) {
          setFields.push(`${key} = $${paramIndex}`);
          values.push(updates[key as keyof ITransporteUpdate]);
          paramIndex++;
        }
      });

      if (setFields.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      setFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE transporte 
        SET ${setFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora,
                  fecha_adquisicion, kilometraje, created_at, updated_at
      `;

      const result = await client.query(query, values);
      
      await client.query('COMMIT');
      return result.rows[0] || null;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Cambiar estado con validaciones de negocio
  static async cambiarEstado(id: number, nuevoEstado: EstadoTransporte): Promise<boolean> {
    const transporte = await TransporteModel.findById(id);
    if (!transporte) {
      throw new Error('Transporte no encontrado');
    }

    // Validar transiciones de estado válidas
    const transicionesValidas = {
      [EstadoTransporte.DISPONIBLE]: [EstadoTransporte.EN_USO, EstadoTransporte.MANTENIMIENTO, EstadoTransporte.FUERA_DE_SERVICIO],
      [EstadoTransporte.EN_USO]: [EstadoTransporte.DISPONIBLE, EstadoTransporte.MANTENIMIENTO],
      [EstadoTransporte.MANTENIMIENTO]: [EstadoTransporte.DISPONIBLE, EstadoTransporte.FUERA_DE_SERVICIO],
      [EstadoTransporte.FUERA_DE_SERVICIO]: [EstadoTransporte.MANTENIMIENTO]
    };

    const estadosPermitidos = transicionesValidas[transporte.estado];
    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error(`No se puede cambiar de ${transporte.estado} a ${nuevoEstado}`);
    }

    return await TransporteModel.updateEstado(id, nuevoEstado);
  }

  // Mover transporte a otra estación
  static async moverAEstacion(transporteId: number, nuevaEstacionId: number): Promise<boolean> {
    const transporte = await TransporteModel.findById(transporteId);
    if (!transporte) {
      throw new Error('Transporte no encontrado');
    }

    // Solo permitir mover si está disponible
    if (transporte.estado !== EstadoTransporte.DISPONIBLE) {
      throw new Error('Solo se pueden mover transportes disponibles');
    }

    return await TransporteModel.updateEstacion(transporteId, nuevaEstacionId);
  }

  // Buscar transportes disponibles por estación y tipo
  static async buscarDisponibles(estacionId: number, tipo?: TipoTransporte): Promise<ITransporte[]> {
    let transportes = await TransporteModel.findDisponiblesByEstacion(estacionId);
    
    if (tipo) {
      transportes = transportes.filter(t => t.tipo === tipo);
    }
    
    return transportes;
  }

  // Obtener transporte para préstamo (cambia estado a EN_USO)
  static async obtenerParaPrestamo(transporteId: number): Promise<ITransporte | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verificar que esté disponible
      const transporte = await TransporteModel.findById(transporteId);
      if (!transporte || transporte.estado !== EstadoTransporte.DISPONIBLE) {
        await client.query('ROLLBACK');
        return null;
      }

      // Cambiar estado a EN_USO
      await TransporteModel.updateEstado(transporteId, EstadoTransporte.EN_USO);
      
      await client.query('COMMIT');
      
      // Retornar transporte actualizado
      return await TransporteModel.findById(transporteId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Devolver transporte (cambia estado a DISPONIBLE)
  static async devolverTransporte(transporteId: number, nuevaEstacionId: number, kilometrajeRecorrido: number = 0): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const transporte = await TransporteModel.findById(transporteId);
      if (!transporte) {
        throw new Error('Transporte no encontrado');
      }

      // Cambiar estación
      await TransporteModel.updateEstacion(transporteId, nuevaEstacionId);
      
      // Cambiar estado a disponible
      await TransporteModel.updateEstado(transporteId, EstadoTransporte.DISPONIBLE);
      
      await client.query('COMMIT');
      return true;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

    // Obtener estadísticas detalladas
    static async getStats(): Promise<any> {
        console.log('🔍 EJECUTANDO TransporteService.getStats()');
        const stats = await TransporteModel.getStats();
        console.log('📊 Stats del Model:', stats);
        
        return stats; // Retornar directamente lo que viene del Model
    }

  // Verificar si necesita mantenimiento
  static async verificarMantenimiento(transporteId: number): Promise<boolean> {
    const transporte = await TransporteModel.findById(transporteId);
    if (!transporte) return false;

    // Criterios para mantenimiento:
    // - Más de 1000 km recorridos
    // - Batería baja (si es eléctrico)
    const necesitaMantenimiento = false;
    
    if (necesitaMantenimiento) {
      await TransporteModel.updateEstado(transporteId, EstadoTransporte.MANTENIMIENTO);
    }
    
    return necesitaMantenimiento;
  }
}