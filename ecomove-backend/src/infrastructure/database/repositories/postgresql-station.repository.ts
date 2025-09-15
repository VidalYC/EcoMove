// src/infrastructure/database/repositories/postgresql-station.repository.ts
// CORREGIDO PARA TU ESQUEMA REAL

import { Pool } from 'pg';
import { 
  Station, 
  StationAvailability,
  StationFilters,
  StationRepository,
  Coordinate 
} from '../../../core/domain/entities/station.entity';

export class PostgreSQLStationRepository implements StationRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: {
    name: string;
    address: string;
    coordinate: Coordinate;
    maxCapacity: number;
  }): Promise<Station> {
    const query = `
      INSERT INTO estaciones (nombre, direccion, latitud, longitud, capacidad_total)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, direccion, latitud, longitud, capacidad_total, 
                estado, created_at, updated_at
    `;
    
    const values = [
      data.name,
      data.address,
      data.coordinate.latitude,
      data.coordinate.longitude,
      data.maxCapacity
    ];
    
    const result = await this.pool.query(query, values);
    const row = result.rows[0];
    
    return new Station(
      row.id,
      row.nombre,
      row.direccion,
      { latitude: parseFloat(row.latitud), longitude: parseFloat(row.longitud) },
      row.capacidad_total,
      row.estado === 'active',
      row.created_at,
      row.updated_at
    );
  }

  async findById(id: number): Promise<Station | null> {
    const query = `
      SELECT id, nombre, direccion, latitud, longitud, capacidad_total, 
             estado, created_at, updated_at
      FROM estaciones
      WHERE id = $1 AND deleted_at IS NULL
    `;
    
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return new Station(
      row.id,
      row.nombre,
      row.direccion,
      { latitude: parseFloat(row.latitud), longitude: parseFloat(row.longitud) },
      row.capacidad_total,
      row.estado === 'active',
      row.created_at,
      row.updated_at
    );
  }

  async findAll(page: number, limit: number, filters?: StationFilters): Promise<{
    stations: Station[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE deleted_at IS NULL';
    const params: any[] = [];
    let paramCount = 0;

    // Aplicar filtros
    if (filters?.active !== undefined) {
      whereClause += ` AND estado = $${++paramCount}`;
      params.push(filters.active ? 'active' : 'inactive');
    }
    
    if (filters?.minCapacity) {
      whereClause += ` AND capacidad_total >= $${++paramCount}`;
      params.push(filters.minCapacity);
    }
    
    if (filters?.maxCapacity) {
      whereClause += ` AND capacidad_total <= $${++paramCount}`;
      params.push(filters.maxCapacity);
    }

    // Para filtro geográfico
    if (filters?.nearLocation) {
      whereClause += `
        AND (
          6371 * acos(
            cos(radians($${++paramCount})) * cos(radians(latitud)) * 
            cos(radians(longitud) - radians($${++paramCount})) + 
            sin(radians($${paramCount - 1})) * sin(radians(latitud))
          )
        ) <= $${++paramCount}
      `;
      params.push(
        filters.nearLocation.coordinate.latitude,
        filters.nearLocation.coordinate.longitude,
        filters.nearLocation.radiusKm
      );
    }

    const dataQuery = `
      SELECT id, nombre, direccion, latitud, longitud, capacidad_total, 
             estado, created_at, updated_at
      FROM estaciones
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM estaciones
      ${whereClause}
    `;

    params.push(limit, offset);
    
    const [dataResult, countResult] = await Promise.all([
      this.pool.query(dataQuery, params),
      this.pool.query(countQuery, params.slice(0, -2))
    ]);

    const stations = dataResult.rows.map(row => new Station(
      row.id,
      row.nombre,
      row.direccion,
      { latitude: parseFloat(row.latitud), longitude: parseFloat(row.longitud) },
      row.capacidad_total,
      row.estado === 'active',
      row.created_at,
      row.updated_at
    ));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      stations,
      total,
      totalPages,
      currentPage: page
    };
  }

  async update(id: number, updates: {
    name?: string;
    address?: string;
    coordinate?: Coordinate;
    maxCapacity?: number;
  }): Promise<Station | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 0;
    
    if (updates.name !== undefined) {
      setClauses.push(`nombre = $${++paramCount}`);
      values.push(updates.name);
    }
    
    if (updates.address !== undefined) {
      setClauses.push(`direccion = $${++paramCount}`);
      values.push(updates.address);
    }
    
    if (updates.coordinate) {
      setClauses.push(`latitud = $${++paramCount}`, `longitud = $${++paramCount}`);
      values.push(updates.coordinate.latitude, updates.coordinate.longitude);
    }
    
    if (updates.maxCapacity !== undefined) {
      setClauses.push(`capacidad_total = $${++paramCount}`);
      values.push(updates.maxCapacity);
    }
    
    if (setClauses.length === 0) {
      return await this.findById(id);
    }
    
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const updateQuery = `
      UPDATE estaciones 
      SET ${setClauses.join(', ')}
      WHERE id = $${++paramCount} AND deleted_at IS NULL
      RETURNING id
    `;
    
    values.push(id);
    
    const result = await this.pool.query(updateQuery, values);
    
    if (result.rowCount === 0) {
      return null;
    }
    
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE estaciones SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  async activate(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE estaciones SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL',
      ['active', id]
    );
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  async deactivate(id: number): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE estaciones SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL',
      ['inactive', id]
    );
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  async findNearby(coordinate: Coordinate, radiusKm: number, limit: number = 10): Promise<Station[]> {
    const query = `
      SELECT 
        id, nombre, direccion, latitud, longitud, capacidad_total, 
        estado, created_at, updated_at,
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(latitud)) * 
            cos(radians(longitud) - radians($2)) + 
            sin(radians($1)) * sin(radians(latitud))
          )
        ) AS distance
      FROM estaciones
      WHERE deleted_at IS NULL
        AND estado = 'active'
        AND (
          6371 * acos(
            cos(radians($1)) * cos(radians(latitud)) * 
            cos(radians(longitud) - radians($2)) + 
            sin(radians($1)) * sin(radians(latitud))
          )
        ) <= $3
      ORDER BY distance
      LIMIT $4
    `;
    
    const result = await this.pool.query(query, [
      coordinate.latitude,
      coordinate.longitude,
      radiusKm,
      limit
    ]);
    
    return result.rows.map(row => new Station(
      row.id,
      row.nombre,
      row.direccion,
      { latitude: parseFloat(row.latitud), longitude: parseFloat(row.longitud) },
      row.capacidad_total,
      row.estado === 'active',
      row.created_at,
      row.updated_at
    ));
  }

  async findWithAvailableTransports(transportType?: string): Promise<Station[]> {
    let typeFilter = '';
    const params: any[] = [];
    
    if (transportType) {
      typeFilter = 'AND t.tipo = $1';
      params.push(transportType);
    }
    
    const query = `
      SELECT DISTINCT
        e.id, e.nombre, e.direccion, e.latitud, e.longitud, e.capacidad_total, 
        e.estado, e.created_at, e.updated_at
      FROM estaciones e
      INNER JOIN (
        SELECT estacion_actual_id FROM bicicleta WHERE estado = 'available' AND deleted_at IS NULL
        UNION ALL
        SELECT estacion_actual_id FROM patineta_electrica WHERE estado = 'available' AND deleted_at IS NULL
      ) t ON e.id = t.estacion_actual_id
      WHERE e.deleted_at IS NULL AND e.estado = 'active' ${typeFilter}
      ORDER BY e.nombre
    `;
    
    const result = await this.pool.query(query, params);
    
    return result.rows.map(row => new Station(
      row.id,
      row.nombre,
      row.direccion,
      { latitude: parseFloat(row.latitud), longitude: parseFloat(row.longitud) },
      row.capacidad_total,
      row.estado === 'active',
      row.created_at,
      row.updated_at
    ));
  }

  async getAvailability(id: number): Promise<StationAvailability | null> {
    const station = await this.findById(id);
    if (!station) return null;
    
    const query = `
      WITH transport_counts AS (
        SELECT 
          COUNT(*) as total_count,
          COUNT(CASE WHEN estado = 'available' THEN 1 END) as available_count,
          COUNT(CASE WHEN tipo = 'bicycle' AND estado = 'available' THEN 1 END) as bicycles,
          COUNT(CASE WHEN tipo = 'electric-scooter' AND estado = 'available' THEN 1 END) as electric_scooters,
          COUNT(CASE WHEN tipo = 'scooter' AND estado = 'available' THEN 1 END) as scooters,
          COUNT(CASE WHEN tipo = 'electric-vehicle' AND estado = 'available' THEN 1 END) as electric_vehicles
        FROM (
          SELECT tipo, estado FROM bicicleta WHERE estacion_actual_id = $1 AND deleted_at IS NULL
          UNION ALL
          SELECT tipo, estado FROM patineta_electrica WHERE estacion_actual_id = $1 AND deleted_at IS NULL
        ) t
      )
      SELECT * FROM transport_counts
    `;
    
    const result = await this.pool.query(query, [id]);
    const row = result.rows[0] || {};
    
    return new StationAvailability(
      station,
      parseInt(row.total_count) || 0,
      parseInt(row.available_count) || 0,
      {
        bicycles: parseInt(row.bicycles) || 0,
        electricScooters: parseInt(row.electric_scooters) || 0,
        scooters: parseInt(row.scooters) || 0,
        electricVehicles: parseInt(row.electric_vehicles) || 0
      }
    );
  }

  async getRankingByOccupancy(limit: number = 10): Promise<{
    station: Station;
    occupancyPercentage: number;
    totalTransports: number;
  }[]> {
    const query = `
      SELECT 
        e.id, e.nombre, e.direccion, e.latitud, e.longitud, e.capacidad_total,
        e.estado, e.created_at, e.updated_at,
        COALESCE(transport_counts.total_count, 0) as total_transports,
        CASE 
          WHEN e.capacidad_total > 0 THEN 
            (COALESCE(transport_counts.total_count, 0)::float / e.capacidad_total) * 100
          ELSE 0 
        END as occupancy_percentage
      FROM estaciones e
      LEFT JOIN (
        SELECT 
          estacion_actual_id,
          COUNT(*) as total_count
        FROM (
          SELECT estacion_actual_id FROM bicicleta WHERE deleted_at IS NULL
          UNION ALL
          SELECT estacion_actual_id FROM patineta_electrica WHERE deleted_at IS NULL
        ) t
        GROUP BY estacion_actual_id
      ) transport_counts ON e.id = transport_counts.estacion_actual_id
      WHERE e.deleted_at IS NULL AND e.estado = 'active'
      ORDER BY occupancy_percentage DESC
      LIMIT $1
    `;
    
    const result = await this.pool.query(query, [limit]);
    
    return result.rows.map(row => ({
      station: new Station(
        row.id,
        row.nombre,
        row.direccion,
        { latitude: parseFloat(row.latitud), longitude: parseFloat(row.longitud) },
        row.capacidad_total,
        row.estado === 'active',
        row.created_at,
        row.updated_at
      ),
      occupancyPercentage: parseFloat(row.occupancy_percentage),
      totalTransports: parseInt(row.total_transports)
    }));
  }

  async calculateRoute(originId: number, destinationId: number): Promise<{
    origin: Station;
    destination: Station;
    distance: number;
    estimatedTime: number;
  } | null> {
    const [origin, destination] = await Promise.all([
      this.findById(originId),
      this.findById(destinationId)
    ]);
    
    if (!origin || !destination) return null;
    
    const distance = origin.distanceTo(destination);
    const estimatedTime = Math.ceil(distance * 3); // 3 minutos por km
    
    return {
      origin,
      destination,
      distance,
      estimatedTime
    };
  }

  async getStats(): Promise<{
    totalStations: number;
    activeStations: number;
    inactiveStations: number;
    totalCapacity: number;
    averageOccupancy: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_stations,
        COUNT(CASE WHEN estado = 'active' THEN 1 END) as active_stations,
        COUNT(CASE WHEN estado != 'active' THEN 1 END) as inactive_stations,
        COALESCE(SUM(capacidad_total), 0) as total_capacity,
        COALESCE(AVG(
          CASE 
            WHEN capacidad_total > 0 THEN 
              (COALESCE(transport_counts.total_count, 0)::float / capacidad_total) * 100
            ELSE 0 
          END
        ), 0) as average_occupancy
      FROM estaciones e
      LEFT JOIN (
        SELECT 
          estacion_actual_id,
          COUNT(*) as total_count
        FROM (
          SELECT estacion_actual_id FROM bicicleta WHERE deleted_at IS NULL
          UNION ALL
          SELECT estacion_actual_id FROM patineta_electrica WHERE deleted_at IS NULL
        ) t
        GROUP BY estacion_actual_id
      ) transport_counts ON e.id = transport_counts.estacion_actual_id
      WHERE e.deleted_at IS NULL
    `;
    
    const result = await this.pool.query(query);
    const row = result.rows[0];
    
    return {
      totalStations: parseInt(row.total_stations) || 0,
      activeStations: parseInt(row.active_stations) || 0,
      inactiveStations: parseInt(row.inactive_stations) || 0,
      totalCapacity: parseInt(row.total_capacity) || 0,
      averageOccupancy: parseFloat(row.average_occupancy) || 0
    };
  }
}