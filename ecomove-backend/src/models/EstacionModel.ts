import { pool } from '../config/database';
import { 
  IEstacion, 
  IEstacionCreate, 
  IEstacionUpdate,
  ICoordenada,
  IEstacionFiltros 
} from '../types/Estacion';

export class EstacionModel {
  // Crear estación con coordenadas
  static async create(estacionData: IEstacionCreate): Promise<IEstacion> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { nombre, direccion, capacidad_maxima, latitud, longitud } = estacionData;
      
      // Crear coordenada primero
      const coordenadaQuery = `
        INSERT INTO coordenada (latitud, longitud)
        VALUES ($1, $2)
        RETURNING id
      `;
      
      const coordenadaResult = await client.query(coordenadaQuery, [latitud, longitud]);
      const coordenadaId = coordenadaResult.rows[0].id;
      
      // Crear estación
      const estacionQuery = `
        INSERT INTO estacion (nombre, direccion, coordenada_id, capacidad_maxima)
        VALUES ($1, $2, $3, $4)
        RETURNING id, nombre, direccion, coordenada_id, capacidad_maxima, 
                  fecha_creacion, is_active, created_at, updated_at
      `;
      
      const estacionResult = await client.query(estacionQuery, [
        nombre, direccion, coordenadaId, capacidad_maxima
      ]);
      
      await client.query('COMMIT');
      
      // Agregar coordenadas al resultado
      return {
        ...estacionResult.rows[0],
        latitud,
        longitud
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Buscar estación por ID con coordenadas
  static async findById(id: number): Promise<IEstacion | null> {
    const query = `
      SELECT e.id, e.nombre, e.direccion, e.coordenada_id, e.capacidad_maxima,
             e.fecha_creacion, e.is_active, e.created_at, e.updated_at,
             c.latitud, c.longitud
      FROM estacion e
      LEFT JOIN coordenada c ON e.coordenada_id = c.id
      WHERE e.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Obtener todas las estaciones con paginación y filtros
  static async findAll(page: number = 1, limit: number = 10, filtros?: IEstacionFiltros): Promise<{
    estaciones: IEstacion[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;
    
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (filtros?.activa !== undefined) {
      whereConditions.push(`e.is_active = $${paramIndex}`);
      queryParams.push(filtros.activa);
      paramIndex++;
    }

    if (filtros?.capacidad_min) {
      whereConditions.push(`e.capacidad_maxima >= $${paramIndex}`);
      queryParams.push(filtros.capacidad_min);
      paramIndex++;
    }

    if (filtros?.capacidad_max) {
      whereConditions.push(`e.capacidad_maxima <= $${paramIndex}`);
      queryParams.push(filtros.capacidad_max);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Query para obtener estaciones
    const estacionesQuery = `
      SELECT e.id, e.nombre, e.direccion, e.coordenada_id, e.capacidad_maxima,
             e.fecha_creacion, e.is_active, e.created_at, e.updated_at,
             c.latitud, c.longitud
      FROM estacion e
      LEFT JOIN coordenada c ON e.coordenada_id = c.id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM estacion e ${whereClause}`;
    
    const estacionesParams = [...queryParams, limit, offset];
    
    const [estacionesResult, countResult] = await Promise.all([
      pool.query(estacionesQuery, estacionesParams),
      pool.query(countQuery, queryParams)
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    return {
      estaciones: estacionesResult.rows,
      total,
      totalPages,
      currentPage: page
    };
  }

  // Buscar estaciones cercanas a una ubicación
    static async findNearby(latitud: number, longitud: number, radioKm: number = 5): Promise<IEstacion[]> {
        const query = `
            SELECT e.id, e.nombre, e.direccion, e.coordenada_id, e.capacidad_maxima,
                e.fecha_creacion, e.is_active, e.created_at, e.updated_at,
                c.latitud, c.longitud,
                (6371 * acos(cos(radians($1)) * cos(radians(c.latitud)) * 
                    cos(radians(c.longitud) - radians($2)) + 
                    sin(radians($1)) * sin(radians(c.latitud)))) AS distancia_km
            FROM estacion e
            LEFT JOIN coordenada c ON e.coordenada_id = c.id
            WHERE e.is_active = true
            AND (6371 * acos(cos(radians($1)) * cos(radians(c.latitud)) * 
                cos(radians(c.longitud) - radians($2)) + 
                sin(radians($1)) * sin(radians(c.latitud)))) <= $3
            ORDER BY (6371 * acos(cos(radians($1)) * cos(radians(c.latitud)) * 
                    cos(radians(c.longitud) - radians($2)) + 
                    sin(radians($1)) * sin(radians(c.latitud)))) ASC
        `;
        
        const result = await pool.query(query, [latitud, longitud, radioKm]);
        return result.rows;
    }

  // Actualizar estación
  static async update(id: number, updates: IEstacionUpdate): Promise<IEstacion | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Separar campos de estación y coordenadas
      const { latitud, longitud, ...estacionUpdates } = updates;
      
      // Actualizar coordenadas si se proporcionan
      if (latitud !== undefined && longitud !== undefined) {
        const coordenadaQuery = `
          UPDATE coordenada 
          SET latitud = $1, longitud = $2
          WHERE id = (SELECT coordenada_id FROM estacion WHERE id = $3)
        `;
        await client.query(coordenadaQuery, [latitud, longitud, id]);
      }
      
      // Actualizar estación si hay campos
      if (Object.keys(estacionUpdates).length > 0) {
        const allowedFields = ['nombre', 'direccion', 'capacidad_maxima', 'is_active'];
        const setFields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        Object.keys(estacionUpdates).forEach(key => {
          if (allowedFields.includes(key) && estacionUpdates[key as keyof typeof estacionUpdates] !== undefined) {
            setFields.push(`${key} = $${paramIndex}`);
            values.push(estacionUpdates[key as keyof typeof estacionUpdates]);
            paramIndex++;
          }
        });

        if (setFields.length > 0) {
          setFields.push(`updated_at = CURRENT_TIMESTAMP`);
          values.push(id);

          const estacionQuery = `
            UPDATE estacion 
            SET ${setFields.join(', ')}
            WHERE id = $${paramIndex}
          `;

          await client.query(estacionQuery, values);
        }
      }
      
      await client.query('COMMIT');
      
      // Retornar estación actualizada
      return await this.findById(id);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Activar estación
  static async activate(id: number): Promise<boolean> {
    const query = `
      UPDATE estacion 
      SET is_active = true, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Desactivar estación
  static async deactivate(id: number): Promise<boolean> {
    const query = `
      UPDATE estacion 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Obtener ocupación de una estación
  static async getOcupacion(id: number): Promise<{
    transportes_totales: number;
    transportes_disponibles: number;
    porcentaje_ocupacion: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as transportes_totales,
        COUNT(*) FILTER (WHERE estado = 'available') as transportes_disponibles,
        e.capacidad_maxima
      FROM transporte t
      RIGHT JOIN estacion e ON t.estacion_actual_id = e.id
      WHERE e.id = $1
      GROUP BY e.capacidad_maxima
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return {
        transportes_totales: 0,
        transportes_disponibles: 0,
        porcentaje_ocupacion: 0
      };
    }
    
    const row = result.rows[0];
    const porcentaje = (parseInt(row.transportes_totales) / parseInt(row.capacidad_maxima)) * 100;
    
    return {
      transportes_totales: parseInt(row.transportes_totales) || 0,
      transportes_disponibles: parseInt(row.transportes_disponibles) || 0,
      porcentaje_ocupacion: Math.round(porcentaje * 100) / 100
    };
  }

  // Obtener estadísticas generales
  static async getStats(): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_estaciones,
        COUNT(*) FILTER (WHERE is_active = true) as estaciones_activas,
        COUNT(*) FILTER (WHERE is_active = false) as estaciones_inactivas,
        SUM(capacidad_maxima) as capacidad_total,
        AVG(capacidad_maxima) as capacidad_promedio
      FROM estacion
    `;
    
    const result = await pool.query(query);
    return {
      total_estaciones: result.rows[0].total_estaciones,
      estaciones_activas: result.rows[0].estaciones_activas,
      estaciones_inactivas: result.rows[0].estaciones_inactivas,
      capacidad_total: result.rows[0].capacidad_total,
      capacidad_promedio: Math.round(parseFloat(result.rows[0].capacidad_promedio || 0) * 100) / 100
    };
  }

  // Verificar si existe estación
  static async exists(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM estacion WHERE id = $1 LIMIT 1';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }
}