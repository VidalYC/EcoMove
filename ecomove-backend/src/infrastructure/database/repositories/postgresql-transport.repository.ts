import { Pool } from 'pg';
import { 
  Transport, 
  Bicycle, 
  ElectricScooter,
  TransportType,
  TransportStatus,
  TransportFilters,
  TransportRepository 
} from '../../../core/domain/entities/transport.entity';

export class PostgreSQLTransportRepository implements TransportRepository {
  constructor(private readonly pool: Pool) {}

  // Generar código único para transporte
  private async generateTransportCode(type: TransportType): Promise<string> {
    const prefix = type === TransportType.BICYCLE ? 'BIKE' : 
                  type === TransportType.ELECTRIC_SCOOTER ? 'SCOOT' : 
                  type === TransportType.SCOOTER ? 'SCOO' : 'VEH';
    
    try {
      // Contar en todas las tablas para el tipo específico
      const countQuery = `
        WITH all_transports AS (
          SELECT tipo FROM bicicleta WHERE tipo = $1
          UNION ALL
          SELECT tipo FROM patineta_electrica WHERE tipo = $1
        )
        SELECT COUNT(*) + 1 as next_number FROM all_transports
      `;
      
      const result = await this.pool.query(countQuery, [type]);
      const nextNumber = parseInt(result.rows[0].next_number) || 1;
      
      return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
      
    } catch (error) {
      console.error('Error generando código de transporte:', error);
      // Fallback: usar timestamp para evitar duplicados
      const timestamp = Date.now().toString().slice(-3);
      return `${prefix}-${timestamp}`;
    }
  }

  async createBicycle(data: {
    model: string;
    hourlyRate: number;
    gearCount: number;
    brakeType: string;
    stationId?: number;
  }): Promise<Bicycle> {
    const codigo = await this.generateTransportCode(TransportType.BICYCLE);
    
    const query = `
      INSERT INTO bicicleta (
        codigo, tipo, modelo, estado, estacion_actual_id, 
        tarifa_por_hora, fecha_adquisicion, num_marchas, tipo_freno
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id, codigo, tipo, modelo, estado, estacion_actual_id, 
        tarifa_por_hora, fecha_adquisicion, num_marchas, tipo_freno, 
        created_at, updated_at
    `;
    
    const values = [
      codigo,
      TransportType.BICYCLE,
      data.model,
      TransportStatus.AVAILABLE,
      data.stationId || null,
      data.hourlyRate,
      new Date(),
      data.gearCount,
      data.brakeType
    ];
    
    const result = await this.pool.query(query, values);
    const row = result.rows[0];
    
    return new Bicycle(
      row.id,
      row.modelo,
      row.estado as TransportStatus,
      row.estacion_actual_id,
      parseFloat(row.tarifa_por_hora),
      new Date(row.fecha_adquisicion),
      row.num_marchas,
      row.tipo_freno,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  async createElectricScooter(data: {
    model: string;
    hourlyRate: number;
    maxSpeed: number;
    range: number;
    stationId?: number;
  }): Promise<ElectricScooter> {
    const codigo = await this.generateTransportCode(TransportType.ELECTRIC_SCOOTER);
    
    const query = `
      INSERT INTO patineta_electrica (
        codigo, tipo, modelo, estado, estacion_actual_id, 
        tarifa_por_hora, fecha_adquisicion, nivel_bateria, 
        velocidad_maxima, autonomia
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id, codigo, tipo, modelo, estado, estacion_actual_id,
        tarifa_por_hora, fecha_adquisicion, nivel_bateria, 
        velocidad_maxima, autonomia, created_at, updated_at
    `;
    
    const values = [
      codigo,
      TransportType.ELECTRIC_SCOOTER,
      data.model,
      TransportStatus.AVAILABLE,
      data.stationId || null,
      data.hourlyRate,
      new Date(),
      100, // Battery level starts at 100%
      data.maxSpeed,
      data.range
    ];
    
    const result = await this.pool.query(query, values);
    const row = result.rows[0];
    
    return new ElectricScooter(
      row.id,
      row.modelo,
      row.estado as TransportStatus,
      row.estacion_actual_id,
      parseFloat(row.tarifa_por_hora),
      new Date(row.fecha_adquisicion),
      row.nivel_bateria,
      row.velocidad_maxima,
      row.autonomia,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  async create(transportData: Omit<Transport, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transport> {
    const codigo = await this.generateTransportCode(transportData.type);
    
    const query = `
      INSERT INTO transportes (
        codigo, tipo, modelo, estado, estacion_actual_id, 
        tarifa_por_hora, fecha_adquisicion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id, codigo, tipo, modelo, estado, estacion_actual_id, 
        tarifa_por_hora, fecha_adquisicion, created_at, updated_at
    `;
    
    const values = [
      codigo,
      transportData.type,
      transportData.model,
      transportData.status,
      transportData.currentStationId,
      transportData.hourlyRate,
      transportData.acquisitionDate
    ];
    
    const result = await this.pool.query(query, values);
    const row = result.rows[0];
    
    return new Transport(
      row.id,
      row.tipo as TransportType,
      row.modelo,
      row.estado as TransportStatus,
      row.estacion_actual_id,
      parseFloat(row.tarifa_por_hora),
      new Date(row.fecha_adquisicion),
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  async findById(id: number): Promise<Transport | null> {
    // First try to find in specific tables (bicycle, electric_scooter)
    const bicycleQuery = `
      SELECT id, codigo, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora, 
             fecha_adquisicion, num_marchas, tipo_freno, created_at, updated_at
      FROM bicicleta WHERE id = $1
    `;
    
    const bicycleResult = await this.pool.query(bicycleQuery, [id]);
    if (bicycleResult.rows.length > 0) {
      const row = bicycleResult.rows[0];
      return new Bicycle(
        row.id,
        row.modelo,
        row.estado as TransportStatus,
        row.estacion_actual_id,
        parseFloat(row.tarifa_por_hora),
        new Date(row.fecha_adquisicion),
        row.num_marchas,
        row.tipo_freno,
        new Date(row.created_at),
        new Date(row.updated_at)
      );
    }

    const scooterQuery = `
      SELECT id, codigo, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora, 
             fecha_adquisicion, nivel_bateria, velocidad_maxima, autonomia, created_at, updated_at
      FROM patineta_electrica WHERE id = $1
    `;
    
    const scooterResult = await this.pool.query(scooterQuery, [id]);
    if (scooterResult.rows.length > 0) {
      const row = scooterResult.rows[0];
      return new ElectricScooter(
        row.id,
        row.modelo,
        row.estado as TransportStatus,
        row.estacion_actual_id,
        parseFloat(row.tarifa_por_hora),
        new Date(row.fecha_adquisicion),
        row.nivel_bateria,
        row.velocidad_maxima,
        row.autonomia,
        new Date(row.created_at),
        new Date(row.updated_at)
      );
    }

    // Fall back to general transport table
    const generalQuery = `
      SELECT id, codigo, tipo, modelo, estado, estacion_actual_id, 
             tarifa_por_hora, fecha_adquisicion, created_at, updated_at
      FROM transportes WHERE id = $1
    `;
    
    const generalResult = await this.pool.query(generalQuery, [id]);
    if (generalResult.rows.length === 0) {
      return null;
    }

    const row = generalResult.rows[0];
    return new Transport(
      row.id,
      row.tipo as TransportType,
      row.modelo,
      row.estado as TransportStatus,
      row.estacion_actual_id,
      parseFloat(row.tarifa_por_hora),
      new Date(row.fecha_adquisicion),
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  // Resto de métodos simplificados para este fix
  async findAll(page: number, limit: number, filters?: TransportFilters): Promise<{
    transports: Transport[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;
    
    // Construir filtros dinámicamente
    let whereClause = '';
    const params: any[] = [];
    let paramCount = 0;
    
    if (filters?.type) {
      whereClause += `${whereClause ? ' AND' : ' WHERE'} tipo = $${++paramCount}`;
      params.push(filters.type);
    }
    
    if (filters?.status) {
      whereClause += `${whereClause ? ' AND' : ' WHERE'} estado = $${++paramCount}`;
      params.push(filters.status);
    }
    
    if (filters?.stationId) {
      whereClause += `${whereClause ? ' AND' : ' WHERE'} estacion_actual_id = $${++paramCount}`;
      params.push(filters.stationId);
    }
    
    if (filters?.minRate) {
      whereClause += `${whereClause ? ' AND' : ' WHERE'} tarifa_por_hora >= $${++paramCount}`;
      params.push(filters.minRate);
    }
    
    if (filters?.maxRate) {
      whereClause += `${whereClause ? ' AND' : ' WHERE'} tarifa_por_hora <= $${++paramCount}`;
      params.push(filters.maxRate);
    }
    
    const query = `
      WITH all_transports AS (
        SELECT id, codigo, tipo, modelo, estado, estacion_actual_id, 
              tarifa_por_hora, fecha_adquisicion, num_marchas, tipo_freno,
              null::integer as nivel_bateria, null::integer as velocidad_maxima, 
              null::integer as autonomia, created_at, updated_at
        FROM bicicleta${whereClause}
        
        UNION ALL
        
        SELECT id, codigo, tipo, modelo, estado, estacion_actual_id, 
              tarifa_por_hora, fecha_adquisicion, null::integer as num_marchas, 
              null::text as tipo_freno, nivel_bateria, velocidad_maxima, 
              autonomia, created_at, updated_at
        FROM patineta_electrica${whereClause}
      )
      SELECT * FROM all_transports
      ORDER BY created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    const countQuery = `
      WITH all_transports AS (
        SELECT id FROM bicicleta${whereClause}
        UNION ALL
        SELECT id FROM patineta_electrica${whereClause}
      )
      SELECT COUNT(*) as total FROM all_transports
    `;
    
    // Añadir limit y offset a los parámetros
    const queryParams = [...params, ...params, limit, offset]; // params duplicados para las dos partes del UNION
    const countParams = [...params, ...params]; // params duplicados para el count
    
    const [result, countResult] = await Promise.all([
      this.pool.query(query, queryParams),
      this.pool.query(countQuery, countParams)
    ]);
    
    const transports = result.rows.map(row => {
      if (row.tipo === TransportType.BICYCLE && row.num_marchas !== null) {
        return new Bicycle(
          row.id,
          row.modelo,
          row.estado as TransportStatus,
          row.estacion_actual_id,
          parseFloat(row.tarifa_por_hora),
          new Date(row.fecha_adquisicion),
          row.num_marchas,
          row.tipo_freno,
          new Date(row.created_at),
          new Date(row.updated_at)
        );
      } else if (row.tipo === TransportType.ELECTRIC_SCOOTER && row.nivel_bateria !== null) {
        return new ElectricScooter(
          row.id,
          row.modelo,
          row.estado as TransportStatus,
          row.estacion_actual_id,
          parseFloat(row.tarifa_por_hora),
          new Date(row.fecha_adquisicion),
          row.nivel_bateria,
          row.velocidad_maxima,
          row.autonomia,
          new Date(row.created_at),
          new Date(row.updated_at)
        );
      } else {
        return new Transport(
          row.id,
          row.tipo as TransportType,
          row.modelo,
          row.estado as TransportStatus,
          row.estacion_actual_id,
          parseFloat(row.tarifa_por_hora),
          new Date(row.fecha_adquisicion),
          new Date(row.created_at),
          new Date(row.updated_at)
        );
      }
    });
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    return {
      transports,
      total,
      totalPages,
      currentPage: page
    };
  }

  // Métodos placeholder para completar la interfaz
  async update(id: number, updates: Partial<Transport>): Promise<Transport | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Construir query dinámicamente solo con campos que se van a actualizar
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramCount = 0;
      
      if (updates.model !== undefined) {
        setClauses.push(`modelo = $${++paramCount}`);
        values.push(updates.model);
      }
      
      if (updates.status !== undefined) {
        setClauses.push(`estado = $${++paramCount}`);
        values.push(updates.status);
      }
      
      if (updates.currentStationId !== undefined) {
        setClauses.push(`estacion_actual_id = $${++paramCount}`);
        values.push(updates.currentStationId);
      }
      
      if (updates.hourlyRate !== undefined) {
        setClauses.push(`tarifa_por_hora = $${++paramCount}`);
        values.push(updates.hourlyRate);
      }
      
      if (setClauses.length === 0) {
        await client.query('ROLLBACK');
        return null; // No hay nada que actualizar
      }
      
      // Añadir updated_at automáticamente
      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Intentar actualizar en bicicleta primero
      const bicycleQuery = `
        UPDATE bicicleta 
        SET ${setClauses.join(', ')}
        WHERE id = $${++paramCount}
        RETURNING id, codigo, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora, 
                  fecha_adquisicion, num_marchas, tipo_freno, created_at, updated_at
      `;
      
      values.push(id);
      let result = await client.query(bicycleQuery, values);
      
      if (result.rows.length > 0) {
        await client.query('COMMIT');
        const row = result.rows[0];
        return new Bicycle(
          row.id,
          row.modelo,
          row.estado as TransportStatus,
          row.estacion_actual_id,
          parseFloat(row.tarifa_por_hora),
          new Date(row.fecha_adquisicion),
          row.num_marchas,
          row.tipo_freno,
          new Date(row.created_at),
          new Date(row.updated_at)
        );
      }
      
      // Intentar actualizar en patineta_electrica
      const scooterQuery = `
        UPDATE patineta_electrica 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, codigo, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora, 
                  fecha_adquisicion, nivel_bateria, velocidad_maxima, autonomia, created_at, updated_at
      `;
      
      result = await client.query(scooterQuery, values);
      
      if (result.rows.length > 0) {
        await client.query('COMMIT');
        const row = result.rows[0];
        return new ElectricScooter(
          row.id,
          row.modelo,
          row.estado as TransportStatus,
          row.estacion_actual_id,
          parseFloat(row.tarifa_por_hora),
          new Date(row.fecha_adquisicion),
          row.nivel_bateria,
          row.velocidad_maxima,
          row.autonomia,
          new Date(row.created_at),
          new Date(row.updated_at)
        );
      }
      
      await client.query('ROLLBACK');
      return null; // No se encontró el transporte
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: number): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Intentar eliminar de bicicleta primero
      let result = await client.query('DELETE FROM bicicleta WHERE id = $1', [id]);
      
      if (result.rowCount && result.rowCount > 0) {
        await client.query('COMMIT');
        return true;
      }
      
      // Intentar eliminar de patineta_electrica
      result = await client.query('DELETE FROM patineta_electrica WHERE id = $1', [id]);
      
      if (result.rowCount && result.rowCount > 0) {
        await client.query('COMMIT');
        return true;
      }
      
      await client.query('ROLLBACK');
      return false; // No se encontró el transporte
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findAvailableByStation(stationId: number, type?: TransportType): Promise<Transport[]> {
    let query = '';
    const params: any[] = [stationId, TransportStatus.AVAILABLE];
    
    if (type) {
      // Buscar solo en el tipo específico
      if (type === TransportType.BICYCLE) {
        query = `
          SELECT id, codigo, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora, 
                fecha_adquisicion, num_marchas, tipo_freno, created_at, updated_at
          FROM bicicleta 
          WHERE estacion_actual_id = $1 AND estado = $2
        `;
      } else if (type === TransportType.ELECTRIC_SCOOTER) {
        query = `
          SELECT id, codigo, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora, 
                fecha_adquisicion, nivel_bateria, velocidad_maxima, autonomia, created_at, updated_at
          FROM patineta_electrica 
          WHERE estacion_actual_id = $1 AND estado = $2
        `;
      } else {
        // Para otros tipos que no tenemos implementados
        return [];
      }
    } else {
      // Buscar en todas las tablas
      query = `
        WITH available_transports AS (
          SELECT id, codigo, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora, 
                fecha_adquisicion, num_marchas, tipo_freno, null::integer as nivel_bateria,
                null::integer as velocidad_maxima, null::integer as autonomia, created_at, updated_at
          FROM bicicleta 
          WHERE estacion_actual_id = $1 AND estado = $2
          
          UNION ALL
          
          SELECT id, codigo, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora, 
                fecha_adquisicion, null::integer as num_marchas, null::text as tipo_freno,
                nivel_bateria, velocidad_maxima, autonomia, created_at, updated_at
          FROM patineta_electrica 
          WHERE estacion_actual_id = $1 AND estado = $2
        )
        SELECT * FROM available_transports ORDER BY created_at DESC
      `;
    }
    
    const result = await this.pool.query(query, params);
    
    return result.rows.map(row => {
      if (row.tipo === TransportType.BICYCLE && row.num_marchas !== null) {
        return new Bicycle(
          row.id,
          row.modelo,
          row.estado as TransportStatus,
          row.estacion_actual_id,
          parseFloat(row.tarifa_por_hora),
          new Date(row.fecha_adquisicion),
          row.num_marchas,
          row.tipo_freno,
          new Date(row.created_at),
          new Date(row.updated_at)
        );
      } else if (row.tipo === TransportType.ELECTRIC_SCOOTER && row.nivel_bateria !== null) {
        return new ElectricScooter(
          row.id,
          row.modelo,
          row.estado as TransportStatus,
          row.estacion_actual_id,
          parseFloat(row.tarifa_por_hora),
          new Date(row.fecha_adquisicion),
          row.nivel_bateria,
          row.velocidad_maxima,
          row.autonomia,
          new Date(row.created_at),
          new Date(row.updated_at)
        );
      } else {
        // Transporte genérico
        return new Transport(
          row.id,
          row.tipo as TransportType,
          row.modelo,
          row.estado as TransportStatus,
          row.estacion_actual_id,
          parseFloat(row.tarifa_por_hora),
          new Date(row.fecha_adquisicion),
          new Date(row.created_at),
          new Date(row.updated_at)
        );
      }
    });
  }

  async updateStatus(id: number, status: TransportStatus): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Intentar actualizar en bicicleta primero
      let result = await client.query(
        'UPDATE bicicleta SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [status, id]
      );
      
      if (result.rowCount && result.rowCount > 0) {
        await client.query('COMMIT');
        return true;
      }
      
      // Intentar actualizar en patineta_electrica
      result = await client.query(
        'UPDATE patineta_electrica SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [status, id]
      );
      
      if (result.rowCount && result.rowCount > 0) {
        await client.query('COMMIT');
        return true;
      }
      
      await client.query('ROLLBACK');
      return false; // No se encontró el transporte
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStation(id: number, stationId: number): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Intentar actualizar en bicicleta primero
      let result = await client.query(
        'UPDATE bicicleta SET estacion_actual_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [stationId, id]
      );
      
      if (result.rowCount && result.rowCount > 0) {
        await client.query('COMMIT');
        return true;
      }
      
      // Intentar actualizar en patineta_electrica
      result = await client.query(
        'UPDATE patineta_electrica SET estacion_actual_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [stationId, id]
      );
      
      if (result.rowCount && result.rowCount > 0) {
        await client.query('COMMIT');
        return true;
      }
      
      await client.query('ROLLBACK');
      return false; // No se encontró el transporte
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateBatteryLevel(id: number, level: number): Promise<boolean> {
    // Validar rango de batería
    if (level < 0 || level > 100) {
      throw new Error('El nivel de batería debe estar entre 0 y 100');
    }
    
    // Solo aplicable a patinetas eléctricas
    const result = await this.pool.query(
      'UPDATE patineta_electrica SET nivel_bateria = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [level, id]
    );
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getStats(): Promise<{
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
    byType: {
      bicycles: number;
      electricScooters: number;
      scooters: number;
      electricVehicles: number;
    };
  }> {
    const query = `
      WITH all_transports AS (
        SELECT tipo, estado FROM bicicleta
        UNION ALL
        SELECT tipo, estado FROM patineta_electrica
      )
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN estado = 'in-use' THEN 1 END) as in_use,
        COUNT(CASE WHEN estado = 'maintenance' THEN 1 END) as maintenance,
        COUNT(CASE WHEN tipo = 'bicycle' THEN 1 END) as bicycles,
        COUNT(CASE WHEN tipo = 'electric-scooter' THEN 1 END) as electric_scooters,
        COUNT(CASE WHEN tipo = 'scooter' THEN 1 END) as scooters,
        COUNT(CASE WHEN tipo = 'electric-vehicle' THEN 1 END) as electric_vehicles
      FROM all_transports
    `;
    
    const result = await this.pool.query(query);
    const row = result.rows[0];
    
    return {
      total: parseInt(row.total) || 0,
      available: parseInt(row.available) || 0,
      inUse: parseInt(row.in_use) || 0,
      maintenance: parseInt(row.maintenance) || 0,
      byType: {
        bicycles: parseInt(row.bicycles) || 0,
        electricScooters: parseInt(row.electric_scooters) || 0,
        scooters: parseInt(row.scooters) || 0,
        electricVehicles: parseInt(row.electric_vehicles) || 0
      }
    };
  }
}