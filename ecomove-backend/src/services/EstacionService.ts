import { pool } from '../config/database';
import { EstacionModel } from '../models/EstacionModel';
import { 
  IEstacion, 
  IEstacionCreate,
  IEstacionUpdate, 
  IEstacionFiltros,
  IEstacionDisponibilidad 
} from '../types/Estacion';

export class EstacionService {
  // Crear estación con validaciones de negocio
  static async create(estacionData: IEstacionCreate): Promise<IEstacion> {
    // Validaciones específicas
    if (estacionData.capacidad_maxima <= 0) {
      throw new Error('La capacidad máxima debe ser mayor a 0');
    }

    if (estacionData.capacidad_maxima > 100) {
      throw new Error('La capacidad máxima no puede exceder 100 transportes');
    }

    // Validar coordenadas
    if (estacionData.latitud < -90 || estacionData.latitud > 90) {
      throw new Error('La latitud debe estar entre -90 y 90');
    }

    if (estacionData.longitud < -180 || estacionData.longitud > 180) {
      throw new Error('La longitud debe estar entre -180 y 180');
    }

    // Verificar que no exista una estación muy cercana (menos de 100m)
    const estacionesCercanas = await EstacionModel.findNearby(
      estacionData.latitud, 
      estacionData.longitud, 
      0.1 // 100 metros
    );

    if (estacionesCercanas.length > 0) {
      throw new Error('Ya existe una estación muy cercana a esta ubicación');
    }

    return await EstacionModel.create(estacionData);
  }

  // Obtener todas las estaciones con filtros
  static async findAll(page: number = 1, limit: number = 10, filtros?: IEstacionFiltros): Promise<{
    estaciones: IEstacion[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    // Validar parámetros de paginación
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    return await EstacionModel.findAll(page, limit, filtros);
  }

  // Actualizar estación con validaciones
  static async update(id: number, updates: IEstacionUpdate): Promise<IEstacion | null> {
    const estacion = await EstacionModel.findById(id);
    if (!estacion) {
      throw new Error('Estación no encontrada');
    }

    // Validar campos si se proporcionan
    if (updates.capacidad_maxima !== undefined) {
      if (updates.capacidad_maxima <= 0) {
        throw new Error('La capacidad máxima debe ser mayor a 0');
      }
      if (updates.capacidad_maxima > 100) {
        throw new Error('La capacidad máxima no puede exceder 100 transportes');
      }
    }

    if (updates.latitud !== undefined && (updates.latitud < -90 || updates.latitud > 90)) {
      throw new Error('La latitud debe estar entre -90 y 90');
    }

    if (updates.longitud !== undefined && (updates.longitud < -180 || updates.longitud > 180)) {
      throw new Error('La longitud debe estar entre -180 y 180');
    }

    return await EstacionModel.update(id, updates);
  }

  // Buscar estaciones cercanas a una ubicación
  static async findNearby(latitud: number, longitud: number, radioKm: number = 5): Promise<IEstacion[]> {
    // Validar parámetros
    if (latitud < -90 || latitud > 90) {
      throw new Error('La latitud debe estar entre -90 y 90');
    }

    if (longitud < -180 || longitud > 180) {
      throw new Error('La longitud debe estar entre -180 y 180');
    }

    if (radioKm <= 0 || radioKm > 50) {
      throw new Error('El radio debe estar entre 0.1 y 50 km');
    }

    return await EstacionModel.findNearby(latitud, longitud, radioKm);
  }

  // Obtener disponibilidad completa de una estación
  static async getDisponibilidad(id: number): Promise<IEstacionDisponibilidad | null> {
    const estacion = await EstacionModel.findById(id);
    if (!estacion) {
      return null;
    }

    // Obtener ocupación general
    const ocupacion = await EstacionModel.getOcupacion(id);

    // Obtener disponibilidad por tipo de transporte
    const tipoQuery = `
      SELECT 
        tipo,
        COUNT(*) as cantidad,
        COUNT(*) FILTER (WHERE estado = 'available') as disponibles
      FROM transporte 
      WHERE estacion_actual_id = $1
      GROUP BY tipo
    `;

    const tipoResult = await pool.query(tipoQuery, [id]);
    
    const disponibilidadPorTipo = {
      bicicletas: 0,
      patinetas: 0,
      scooters: 0,
      vehiculos: 0
    };

    tipoResult.rows.forEach(row => {
      switch (row.tipo) {
        case 'bicycle':
          disponibilidadPorTipo.bicicletas = parseInt(row.disponibles);
          break;
        case 'electric-scooter':
          disponibilidadPorTipo.patinetas = parseInt(row.disponibles);
          break;
        case 'scooter':
          disponibilidadPorTipo.scooters = parseInt(row.disponibles);
          break;
        case 'electric-vehicle':
          disponibilidadPorTipo.vehiculos = parseInt(row.disponibles);
          break;
      }
    });

    return {
      estacion,
      transportes_totales: ocupacion.transportes_totales,
      transportes_disponibles: ocupacion.transportes_disponibles,
      porcentaje_ocupacion: ocupacion.porcentaje_ocupacion,
      disponibilidad_por_tipo: disponibilidadPorTipo
    };
  }

  // Activar estación con validaciones
  static async activate(id: number): Promise<boolean> {
    const estacion = await EstacionModel.findById(id);
    if (!estacion) {
      throw new Error('Estación no encontrada');
    }

    if (estacion.is_active) {
      throw new Error('La estación ya está activa');
    }

    return await EstacionModel.activate(id);
  }

  // Desactivar estación con validaciones
  static async deactivate(id: number): Promise<boolean> {
    const estacion = await EstacionModel.findById(id);
    if (!estacion) {
      throw new Error('Estación no encontrada');
    }

    if (!estacion.is_active) {
      throw new Error('La estación ya está inactiva');
    }

    // Verificar que no tenga transportes antes de desactivar
    const ocupacion = await EstacionModel.getOcupacion(id);
    if (ocupacion.transportes_totales > 0) {
      throw new Error('No se puede desactivar una estación que tiene transportes');
    }

    return await EstacionModel.deactivate(id);
  }

  // Buscar estaciones con transportes disponibles
  static async findWithAvailableTransports(tipo?: string): Promise<IEstacion[]> {
    let whereClause = "WHERE e.is_active = true AND t.estado = 'available'";
    const params: any[] = [];
    
    if (tipo) {
      whereClause += " AND t.tipo = $1";
      params.push(tipo);
    }

    const query = `
      SELECT DISTINCT e.id, e.nombre, e.direccion, e.coordenada_id, e.capacidad_maxima,
             e.fecha_creacion, e.is_active, e.created_at, e.updated_at,
             c.latitud, c.longitud
      FROM estacion e
      LEFT JOIN coordenada c ON e.coordenada_id = c.id
      INNER JOIN transporte t ON t.estacion_actual_id = e.id
      ${whereClause}
      ORDER BY e.nombre ASC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Obtener ranking de estaciones por ocupación
  static async getRankingOcupacion(): Promise<any[]> {
    const query = `
      SELECT 
        e.id,
        e.nombre,
        e.capacidad_maxima,
        COUNT(t.id) as transportes_actuales,
        ROUND((COUNT(t.id)::decimal / e.capacidad_maxima * 100), 2) as porcentaje_ocupacion
      FROM estacion e
      LEFT JOIN transporte t ON t.estacion_actual_id = e.id
      WHERE e.is_active = true
      GROUP BY e.id, e.nombre, e.capacidad_maxima
      ORDER BY porcentaje_ocupacion DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Obtener estadísticas generales
  static async getStats(): Promise<any> {
    const stats = await EstacionModel.getStats();
    
    // Agregar estadísticas de ocupación
    const ocupacionQuery = `
      SELECT 
        AVG(ocupacion.porcentaje) as ocupacion_promedio
      FROM (
        SELECT 
          (COUNT(t.id)::decimal / e.capacidad_maxima * 100) as porcentaje
        FROM estacion e
        LEFT JOIN transporte t ON t.estacion_actual_id = e.id
        WHERE e.is_active = true
        GROUP BY e.id, e.capacidad_maxima
      ) as ocupacion
    `;

    const ocupacionResult = await pool.query(ocupacionQuery);
    const ocupacionPromedio = parseFloat(ocupacionResult.rows[0].ocupacion_promedio || 0);

    return {
      ...stats,
      ocupacion_promedio: Math.round(ocupacionPromedio * 100) / 100
    };
  }

  // Calcular ruta óptima entre estaciones
  static async calcularRutaOptima(origenId: number, destinoId: number): Promise<{
    distancia_km: number;
    tiempo_estimado_minutos: number;
  }> {
    const origen = await EstacionModel.findById(origenId);
    const destino = await EstacionModel.findById(destinoId);

    if (!origen || !destino) {
      throw new Error('Una o ambas estaciones no existen');
    }

    if (!origen.latitud || !origen.longitud || !destino.latitud || !destino.longitud) {
      throw new Error('Las estaciones no tienen coordenadas válidas');
    }

    // Calcular distancia usando fórmula de Haversine
    const query = `
      SELECT 
        (6371 * acos(cos(radians($1)) * cos(radians($3)) * 
         cos(radians($4) - radians($2)) + 
         sin(radians($1)) * sin(radians($3)))) AS distancia_km
    `;

    const result = await pool.query(query, [
      origen.latitud, origen.longitud,
      destino.latitud, destino.longitud
    ]);

    const distanciaKm = parseFloat(result.rows[0].distancia_km);
    
    // Estimar tiempo (velocidad promedio 15 km/h en bicicleta urbana)
    const tiempoMinutos = Math.round((distanciaKm / 15) * 60);

    return {
      distancia_km: Math.round(distanciaKm * 100) / 100,
      tiempo_estimado_minutos: tiempoMinutos
    };
  }
}