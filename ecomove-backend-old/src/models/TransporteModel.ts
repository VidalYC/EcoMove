import { pool } from '../config/database';
import { 
  ITransporte, 
  ITransporteCreate, 
  TipoTransporte, 
  EstadoTransporte,
  IBicicletaCreate,
  IPatinetaElectricaCreate
} from '../types/Transporte';

export class TransporteModel {
  // Crear bicicleta (herencia PostgreSQL)
  static async createBicicleta(bicicletaData: IBicicletaCreate): Promise<any> {
    const { 
      tipo, 
      modelo, 
      estacion_actual_id, 
      tarifa_por_hora, 
      fecha_adquisicion = new Date(),
      num_marchas,
      tipo_freno
    } = bicicletaData;
    
    const query = `
      INSERT INTO bicicleta (tipo, modelo, estado, estacion_actual_id, tarifa_por_hora, fecha_adquisicion, num_marchas, tipo_freno)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora, 
                fecha_adquisicion, num_marchas, tipo_freno, created_at, updated_at
    `;
    
    const values = [
      tipo, 
      modelo, 
      EstadoTransporte.DISPONIBLE, 
      estacion_actual_id, 
      tarifa_por_hora, 
      fecha_adquisicion,
      num_marchas,
      tipo_freno
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Crear patineta eléctrica (herencia PostgreSQL)
  static async createPatinetaElectrica(patinetaData: IPatinetaElectricaCreate): Promise<any> {
    const { 
      tipo, 
      modelo, 
      estacion_actual_id, 
      tarifa_por_hora, 
      fecha_adquisicion = new Date(),
      nivel_bateria = 100,
      velocidad_maxima,
      autonomia
    } = patinetaData;
    
    const query = `
      INSERT INTO patineta_electrica (tipo, modelo, estado, estacion_actual_id, tarifa_por_hora, fecha_adquisicion, nivel_bateria, velocidad_maxima, autonomia)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora, 
                fecha_adquisicion, nivel_bateria, velocidad_maxima, autonomia, created_at, updated_at
    `;
    
    const values = [
      tipo, 
      modelo, 
      EstadoTransporte.DISPONIBLE, 
      estacion_actual_id, 
      tarifa_por_hora, 
      fecha_adquisicion,
      nivel_bateria,
      velocidad_maxima,
      autonomia
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Buscar transporte por ID (desde tabla padre)
  static async findById(id: number): Promise<ITransporte | null> {
    const query = `
      SELECT id, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora,
             fecha_adquisicion, created_at, updated_at
      FROM transporte 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Buscar transporte completo por ID (con detalles específicos)
  static async findByIdComplete(id: number): Promise<any | null> {
    // Primero intentar buscar en tabla bicicleta
    const bicicletaQuery = `
      SELECT id, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora,
             fecha_adquisicion, num_marchas, tipo_freno, created_at, updated_at
      FROM bicicleta 
      WHERE id = $1
    `;
    
    let result = await pool.query(bicicletaQuery, [id]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Luego buscar en tabla patineta_electrica
    const patinetaQuery = `
      SELECT id, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora,
             fecha_adquisicion, nivel_bateria, velocidad_maxima, autonomia, created_at, updated_at
      FROM patineta_electrica 
      WHERE id = $1
    `;
    
    result = await pool.query(patinetaQuery, [id]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Si no está en tablas específicas, buscar en tabla padre
    return await this.findById(id);
  }

  // Buscar transportes por estación
  static async findByEstacion(estacionId: number): Promise<ITransporte[]> {
    const query = `
      SELECT id, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora,
             fecha_adquisicion, created_at, updated_at
      FROM transporte 
      WHERE estacion_actual_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [estacionId]);
    return result.rows;
  }

  // Buscar transportes disponibles por estación
  static async findDisponiblesByEstacion(estacionId: number): Promise<ITransporte[]> {
    const query = `
      SELECT id, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora,
             fecha_adquisicion, created_at, updated_at
      FROM transporte 
      WHERE estacion_actual_id = $1 AND estado = $2
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [estacionId, EstadoTransporte.DISPONIBLE]);
    return result.rows;
  }

  // Buscar transportes por tipo
  static async findByTipo(tipo: TipoTransporte): Promise<ITransporte[]> {
    const query = `
      SELECT id, tipo, modelo, estado, estacion_actual_id, tarifa_por_hora,
             fecha_adquisicion, created_at, updated_at
      FROM transporte 
      WHERE tipo = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [tipo]);
    return result.rows;
  }

  // Actualizar estado del transporte
  static async updateEstado(id: number, nuevoEstado: EstadoTransporte): Promise<boolean> {
    const query = `
      UPDATE transporte 
      SET estado = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    
    const result = await pool.query(query, [nuevoEstado, id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Cambiar estación del transporte
  static async updateEstacion(id: number, nuevaEstacionId: number | null): Promise<boolean> {
    const query = `
      UPDATE transporte 
      SET estacion_actual_id = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    
    const result = await pool.query(query, [nuevaEstacionId, id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Obtener estadísticas básicas
    static async getStats(): Promise<any> {
        const query = `
            SELECT 
            COUNT(*) as total_transportes,
            COUNT(*) FILTER (WHERE estado = 'available') as disponibles,
            COUNT(*) FILTER (WHERE estado = 'in-use') as en_uso,
            COUNT(*) FILTER (WHERE estado = 'maintenance') as mantenimiento,
            COUNT(*) FILTER (WHERE tipo = 'bicycle') as bicicletas,
            COUNT(*) FILTER (WHERE tipo = 'electric-scooter') as patinetas,
            COUNT(*) FILTER (WHERE tipo = 'scooter') as scooters,
            COUNT(*) FILTER (WHERE tipo = 'electric-vehicle') as vehiculos
            FROM transporte
        `;
        
        const result = await pool.query(query);
        return {
            total_transportes: result.rows[0].total_transportes,
            disponibles: result.rows[0].disponibles,
            en_uso: result.rows[0].en_uso,
            mantenimiento: result.rows[0].mantenimiento,
            por_tipo: {
            bicicletas: result.rows[0].bicicletas,
            patinetas: result.rows[0].patinetas,
            scooters: result.rows[0].scooters,
            vehiculos: result.rows[0].vehiculos
            }
        };
    }

  // Verificar si transporte existe
  static async exists(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM transporte WHERE id = $1 LIMIT 1';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }
}