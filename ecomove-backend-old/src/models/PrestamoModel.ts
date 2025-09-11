import { pool } from '../config/database';
import { 
  IPrestamo, 
  IPrestamoCreate, 
  IPrestamoUpdate,
  IPrestamoCompleto,
  EstadoPrestamo,
  MetodoPago,
  IPrestamoFiltros
} from '../types/Prestamo';

export class PrestamoModel {
  // Crear nuevo préstamo
  static async create(prestamoData: IPrestamoCreate): Promise<IPrestamo> {
    const { 
      usuario_id, 
      transporte_id, 
      estacion_origen_id,
      duracion_estimada = 120 // 2 horas por defecto
    } = prestamoData;
    
    const query = `
      INSERT INTO prestamo (usuario_id, transporte_id, estacion_origen_id, duracion_estimada, estado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
                fecha_inicio, fecha_fin, duracion_estimada, costo_total, estado, 
                metodo_pago, created_at, updated_at
    `;
    
    const values = [
      usuario_id,
      transporte_id,
      estacion_origen_id,
      duracion_estimada,
      EstadoPrestamo.ACTIVO
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Buscar préstamo por ID
  static async findById(id: number): Promise<IPrestamo | null> {
    const query = `
      SELECT id, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
             fecha_inicio, fecha_fin, duracion_estimada, costo_total, estado,
             metodo_pago, created_at, updated_at
      FROM prestamo 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Buscar préstamo completo con datos relacionados
  static async findByIdComplete(id: number): Promise<IPrestamoCompleto | null> {
    const query = `
      SELECT 
        p.id, p.usuario_id, p.transporte_id, p.estacion_origen_id, p.estacion_destino_id,
        p.fecha_inicio, p.fecha_fin, p.duracion_estimada, p.costo_total, p.estado,
        p.metodo_pago, p.created_at, p.updated_at,
        u.nombre as usuario_nombre, u.correo as usuario_correo, u.documento as usuario_documento,
        t.tipo as transporte_tipo, t.modelo as transporte_modelo,
        eo.nombre as estacion_origen_nombre,
        ed.nombre as estacion_destino_nombre
      FROM prestamo p
      LEFT JOIN usuario u ON p.usuario_id = u.id
      LEFT JOIN transporte t ON p.transporte_id = t.id
      LEFT JOIN estacion eo ON p.estacion_origen_id = eo.id
      LEFT JOIN estacion ed ON p.estacion_destino_id = ed.id
      WHERE p.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Buscar préstamos por usuario
  static async findByUsuario(usuarioId: number, page: number = 1, limit: number = 10): Promise<{
    prestamos: IPrestamoCompleto[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;
    
    const prestamosQuery = `
      SELECT 
        p.id, p.usuario_id, p.transporte_id, p.estacion_origen_id, p.estacion_destino_id,
        p.fecha_inicio, p.fecha_fin, p.duracion_estimada, p.costo_total, p.estado,
        p.metodo_pago, p.created_at, p.updated_at,
        t.tipo as transporte_tipo, t.modelo as transporte_modelo,
        eo.nombre as estacion_origen_nombre,
        ed.nombre as estacion_destino_nombre
      FROM prestamo p
      LEFT JOIN transporte t ON p.transporte_id = t.id
      LEFT JOIN estacion eo ON p.estacion_origen_id = eo.id
      LEFT JOIN estacion ed ON p.estacion_destino_id = ed.id
      WHERE p.usuario_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `SELECT COUNT(*) as total FROM prestamo WHERE usuario_id = $1`;
    
    const [prestamosResult, countResult] = await Promise.all([
      pool.query(prestamosQuery, [usuarioId, limit, offset]),
      pool.query(countQuery, [usuarioId])
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    return {
      prestamos: prestamosResult.rows,
      total,
      totalPages,
      currentPage: page
    };
  }

  // Buscar préstamo activo por usuario
  static async findActivoByUsuario(usuarioId: number): Promise<IPrestamo | null> {
    const query = `
      SELECT id, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
             fecha_inicio, fecha_fin, duracion_estimada, costo_total, estado,
             metodo_pago, created_at, updated_at
      FROM prestamo 
      WHERE usuario_id = $1 AND estado = $2
      ORDER BY fecha_inicio DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [usuarioId, EstadoPrestamo.ACTIVO]);
    return result.rows[0] || null;
  }

  // Buscar préstamos con filtros
  static async findWithFilters(page: number = 1, limit: number = 10, filtros?: IPrestamoFiltros): Promise<{
    prestamos: IPrestamoCompleto[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;
    
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (filtros?.usuario_id) {
      whereConditions.push(`p.usuario_id = $${paramIndex}`);
      queryParams.push(filtros.usuario_id);
      paramIndex++;
    }

    if (filtros?.transporte_id) {
      whereConditions.push(`p.transporte_id = $${paramIndex}`);
      queryParams.push(filtros.transporte_id);
      paramIndex++;
    }

    if (filtros?.estado) {
      whereConditions.push(`p.estado = $${paramIndex}`);
      queryParams.push(filtros.estado);
      paramIndex++;
    }

    if (filtros?.estacion_origen_id) {
      whereConditions.push(`p.estacion_origen_id = $${paramIndex}`);
      queryParams.push(filtros.estacion_origen_id);
      paramIndex++;
    }

    if (filtros?.metodo_pago) {
      whereConditions.push(`p.metodo_pago = $${paramIndex}`);
      queryParams.push(filtros.metodo_pago);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const prestamosQuery = `
      SELECT 
        p.id, p.usuario_id, p.transporte_id, p.estacion_origen_id, p.estacion_destino_id,
        p.fecha_inicio, p.fecha_fin, p.duracion_estimada, p.costo_total, p.estado,
        p.metodo_pago, p.created_at, p.updated_at,
        u.nombre as usuario_nombre, u.correo as usuario_correo, u.documento as usuario_documento,
        t.tipo as transporte_tipo, t.modelo as transporte_modelo,
        eo.nombre as estacion_origen_nombre,
        ed.nombre as estacion_destino_nombre
      FROM prestamo p
      LEFT JOIN usuario u ON p.usuario_id = u.id
      LEFT JOIN transporte t ON p.transporte_id = t.id
      LEFT JOIN estacion eo ON p.estacion_origen_id = eo.id
      LEFT JOIN estacion ed ON p.estacion_destino_id = ed.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const countQuery = `SELECT COUNT(*) as total FROM prestamo p ${whereClause}`;
    
    const prestamosParams = [...queryParams, limit, offset];
    
    const [prestamosResult, countResult] = await Promise.all([
      pool.query(prestamosQuery, prestamosParams),
      pool.query(countQuery, queryParams)
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    return {
      prestamos: prestamosResult.rows,
      total,
      totalPages,
      currentPage: page
    };
  }

  // Actualizar préstamo
  static async update(id: number, updates: IPrestamoUpdate): Promise<IPrestamo | null> {
    const allowedFields = ['estacion_destino_id', 'fecha_fin', 'costo_total', 'estado', 'metodo_pago'];
    const setFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key as keyof IPrestamoUpdate] !== undefined) {
        setFields.push(`${key} = $${paramIndex}`);
        values.push(updates[key as keyof IPrestamoUpdate]);
        paramIndex++;
      }
    });

    if (setFields.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    setFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE prestamo 
      SET ${setFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
                fecha_inicio, fecha_fin, duracion_estimada, costo_total, estado,
                metodo_pago, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Obtener estadísticas generales
  static async getStats(): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_prestamos,
        COUNT(*) FILTER (WHERE estado = 'active') as prestamos_activos,
        COUNT(*) FILTER (WHERE estado = 'completed') as prestamos_completados,
        COUNT(*) FILTER (WHERE estado = 'cancelled') as prestamos_cancelados,
        COALESCE(SUM(costo_total), 0) as ingresos_totales,
        COALESCE(AVG(EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio))/60), 0) as duracion_promedio_minutos
      FROM prestamo
    `;
    
    const result = await pool.query(query);
    return {
      total_prestamos: result.rows[0].total_prestamos,
      prestamos_activos: result.rows[0].prestamos_activos,
      prestamos_completados: result.rows[0].prestamos_completados,
      prestamos_cancelados: result.rows[0].prestamos_cancelados,
      ingresos_totales: parseFloat(result.rows[0].ingresos_totales || 0),
      duracion_promedio: Math.round(parseFloat(result.rows[0].duracion_promedio_minutos || 0))
    };
  }

  // Verificar si existe préstamo
  static async exists(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM prestamo WHERE id = $1 LIMIT 1';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }

  // Buscar préstamos por rango de fechas
  static async findByDateRange(fechaInicio: Date, fechaFin: Date): Promise<IPrestamoCompleto[]> {
    const query = `
      SELECT 
        p.id, p.usuario_id, p.transporte_id, p.estacion_origen_id, p.estacion_destino_id,
        p.fecha_inicio, p.fecha_fin, p.duracion_estimada, p.costo_total, p.estado,
        p.metodo_pago, p.created_at, p.updated_at,
        u.nombre as usuario_nombre,
        t.tipo as transporte_tipo, t.modelo as transporte_modelo,
        eo.nombre as estacion_origen_nombre,
        ed.nombre as estacion_destino_nombre
      FROM prestamo p
      LEFT JOIN usuario u ON p.usuario_id = u.id
      LEFT JOIN transporte t ON p.transporte_id = t.id
      LEFT JOIN estacion eo ON p.estacion_origen_id = eo.id
      LEFT JOIN estacion ed ON p.estacion_destino_id = ed.id
      WHERE p.fecha_inicio BETWEEN $1 AND $2
      ORDER BY p.fecha_inicio DESC
    `;
    
    const result = await pool.query(query, [fechaInicio, fechaFin]);
    return result.rows;
  }
}