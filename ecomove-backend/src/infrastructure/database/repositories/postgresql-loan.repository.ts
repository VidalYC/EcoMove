// src/infrastructure/database/repositories/postgresql-loan.repository.ts
import { Pool } from 'pg';
import { Loan } from '../../../core/domain/entities/loan.entity';
import { 
  LoanRepository, 
  PaginatedLoanResponse, 
  LoanStats, 
  LoanFilters,
  LoanWithDetails,
  UserLoanHistory
} from '../../../core/domain/repositories/loan.repository';
import { LoanStatus } from '../../../shared/enums/loan.enums';

export class PostgreSQLLoanRepository implements LoanRepository {
  constructor(private readonly pool: Pool) {}

  async save(loan: Loan): Promise<Loan> {
    const data = loan.toPersistence();
    
    const query = `
      INSERT INTO prestamo (
        usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
        fecha_inicio, fecha_fin, duracion_estimada, costo_total, estado, metodo_pago
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, created_at, updated_at
    `;
    
    const values = [
      data.usuario_id,
      data.transporte_id,
      data.estacion_origen_id,
      data.estacion_destino_id,
      data.fecha_inicio,
      data.fecha_fin,
      data.duracion_estimada,
      data.costo_total,
      data.estado,
      data.metodo_pago
    ];
    
    const result = await this.pool.query(query, values);
    const savedData = { ...data, ...result.rows[0] };
    
    return Loan.fromPersistence(savedData);
  }

  async findById(id: number): Promise<Loan | null> {
    const query = `
      SELECT id, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
             fecha_inicio, fecha_fin, duracion_estimada, costo_total, estado,
             metodo_pago, created_at, updated_at
      FROM prestamo 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return Loan.fromPersistence(result.rows[0]);
  }

  async update(loan: Loan): Promise<Loan> {
    const data = loan.toPersistence();
    
    const query = `
      UPDATE prestamo 
      SET estacion_destino_id = $1, fecha_fin = $2, duracion_estimada = $3,
          costo_total = $4, estado = $5, metodo_pago = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING updated_at
    `;
    
    const values = [
      data.estacion_destino_id,
      data.fecha_fin,
      data.duracion_estimada,
      data.costo_total,
      data.estado,
      data.metodo_pago,
      data.id
    ];
    
    const result = await this.pool.query(query, values);
    
    if (result.rowCount === 0) {
      throw new Error('Préstamo no encontrado para actualizar');
    }
    
    // Refrescar la entidad con los datos actualizados
    const updatedLoan = await this.findById(loan.getId()!);
    if (!updatedLoan) {
      throw new Error('Error al refrescar el préstamo actualizado');
    }
    return updatedLoan;
  }

  async delete(id: number): Promise<void> {
    const query = 'DELETE FROM prestamo WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rowCount === 0) {
      throw new Error('Préstamo no encontrado para eliminar');
    }
  }

  async exists(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM prestamo WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }

  async findActiveByUserId(userId: number): Promise<Loan | null> {
    const query = `
      SELECT id, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
             fecha_inicio, fecha_fin, duracion_estimada, costo_total, estado,
             metodo_pago, created_at, updated_at
      FROM prestamo 
      WHERE usuario_id = $1 AND estado IN ('active', 'extended')
      ORDER BY fecha_inicio DESC
      LIMIT 1
    `;
    
    const result = await this.pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return Loan.fromPersistence(result.rows[0]);
  }

  async findByUserId(userId: number, page: number, limit: number): Promise<PaginatedLoanResponse<Loan>> {
    const offset = (page - 1) * limit;
    
    // Contar total
    const countQuery = 'SELECT COUNT(*) as total FROM prestamo WHERE usuario_id = $1';
    const countResult = await this.pool.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total);
    
    // Obtener préstamos
    const query = `
      SELECT id, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
             fecha_inicio, fecha_fin, duracion_estimada, costo_total, estado,
             metodo_pago, created_at, updated_at
      FROM prestamo 
      WHERE usuario_id = $1
      ORDER BY fecha_inicio DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.pool.query(query, [userId, limit, offset]);
    const loans = result.rows.map(row => Loan.fromPersistence(row));
    
    return {
      loans,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async findByTransportId(transportId: number): Promise<Loan[]> {
    const query = `
      SELECT id, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
             fecha_inicio, fecha_fin, duracion_estimada, costo_total, estado,
             metodo_pago, created_at, updated_at
      FROM prestamo 
      WHERE transporte_id = $1
      ORDER BY fecha_inicio DESC
    `;
    
    const result = await this.pool.query(query, [transportId]);
    return result.rows.map(row => Loan.fromPersistence(row));
  }

  async findByStatus(status: LoanStatus, page: number, limit: number): Promise<PaginatedLoanResponse<Loan>> {
    const offset = (page - 1) * limit;
    
    // Contar total
    const countQuery = 'SELECT COUNT(*) as total FROM prestamo WHERE estado = $1';
    const countResult = await this.pool.query(countQuery, [status]);
    const total = parseInt(countResult.rows[0].total);
    
    // Obtener préstamos
    const query = `
      SELECT id, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
             fecha_inicio, fecha_fin, duracion_estimada, costo_total, estado,
             metodo_pago, created_at, updated_at
      FROM prestamo 
      WHERE estado = $1
      ORDER BY fecha_inicio DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.pool.query(query, [status, limit, offset]);
    const loans = result.rows.map(row => Loan.fromPersistence(row));
    
    return {
      loans,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async findByFilters(filters: LoanFilters): Promise<PaginatedLoanResponse<LoanWithDetails>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    
    // Construir condiciones WHERE dinámicamente
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      conditions.push(`p.usuario_id = $${paramIndex}`);
      values.push(filters.userId);
      paramIndex++;
    }

    if (filters.transportId) {
      conditions.push(`p.transporte_id = $${paramIndex}`);
      values.push(filters.transportId);
      paramIndex++;
    }

    if (filters.status) {
      conditions.push(`p.estado = $${paramIndex}`);
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.originStationId) {
      conditions.push(`p.estacion_origen_id = $${paramIndex}`);
      values.push(filters.originStationId);
      paramIndex++;
    }

    if (filters.destinationStationId) {
      conditions.push(`p.estacion_destino_id = $${paramIndex}`);
      values.push(filters.destinationStationId);
      paramIndex++;
    }

    if (filters.startDate) {
      conditions.push(`p.fecha_inicio >= $${paramIndex}`);
      values.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      conditions.push(`p.fecha_inicio <= $${paramIndex}`);
      values.push(filters.endDate);
      paramIndex++;
    }

    if (filters.paymentMethod) {
      conditions.push(`p.metodo_pago = $${paramIndex}`);
      values.push(filters.paymentMethod);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM prestamo p
      ${whereClause}
    `;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Obtener datos con JOINs
    const dataQuery = `
      SELECT 
        p.id, p.usuario_id, p.transporte_id, p.estacion_origen_id, p.estacion_destino_id,
        p.fecha_inicio, p.fecha_fin, p.duracion_estimada, p.costo_total, p.estado,
        p.metodo_pago, p.created_at, p.updated_at,
        u.nombre as user_name, u.correo as user_email, u.documento as user_document,
        t.tipo as transport_type, t.modelo as transport_model,
        eo.nombre as origin_station_name,
        ed.nombre as destination_station_name
      FROM prestamo p
      LEFT JOIN usuario u ON p.usuario_id = u.id
      LEFT JOIN transporte t ON p.transporte_id = t.id
      LEFT JOIN estacion eo ON p.estacion_origen_id = eo.id
      LEFT JOIN estacion ed ON p.estacion_destino_id = ed.id
      ${whereClause}
      ORDER BY p.fecha_inicio DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);
    const result = await this.pool.query(dataQuery, values);

    const loans: LoanWithDetails[] = result.rows.map(row => ({
      id: row.id,
      userId: row.usuario_id,
      transportId: row.transporte_id,
      originStationId: row.estacion_origen_id,
      destinationStationId: row.estacion_destino_id,
      startDate: new Date(row.fecha_inicio),
      endDate: row.fecha_fin ? new Date(row.fecha_fin) : null,
      estimatedDuration: row.duracion_estimada,
      totalCost: row.costo_total,
      status: row.estado as LoanStatus,
      paymentMethod: row.metodo_pago,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      userName: row.user_name,
      userEmail: row.user_email,
      userDocument: row.user_document,
      transportType: row.transport_type,
      transportModel: row.transport_model,
      originStationName: row.origin_station_name,
      destinationStationName: row.destination_station_name
    }));

    return {
      loans,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async findByIdWithDetails(id: number): Promise<LoanWithDetails | null> {
    const query = `
      SELECT 
        p.id, p.usuario_id, p.transporte_id, p.estacion_origen_id, p.estacion_destino_id,
        p.fecha_inicio, p.fecha_fin, p.duracion_estimada, p.costo_total, p.estado,
        p.metodo_pago, p.created_at, p.updated_at,
        u.nombre as user_name, u.correo as user_email, u.documento as user_document,
        t.tipo as transport_type, t.modelo as transport_model,
        eo.nombre as origin_station_name,
        ed.nombre as destination_station_name
      FROM prestamo p
      LEFT JOIN usuario u ON p.usuario_id = u.id
      LEFT JOIN transporte t ON p.transporte_id = t.id
      LEFT JOIN estacion eo ON p.estacion_origen_id = eo.id
      LEFT JOIN estacion ed ON p.estacion_destino_id = ed.id
      WHERE p.id = $1
    `;

    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.usuario_id,
      transportId: row.transporte_id,
      originStationId: row.estacion_origen_id,
      destinationStationId: row.estacion_destino_id,
      startDate: new Date(row.fecha_inicio),
      endDate: row.fecha_fin ? new Date(row.fecha_fin) : null,
      estimatedDuration: row.duracion_estimada,
      totalCost: row.costo_total,
      status: row.estado as LoanStatus,
      paymentMethod: row.metodo_pago,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      userName: row.user_name,
      userEmail: row.user_email,
      userDocument: row.user_document,
      transportType: row.transport_type,
      transportModel: row.transport_model,
      originStationName: row.origin_station_name,
      destinationStationName: row.destination_station_name
    };
  }

  async findUserLoanHistory(userId: number, page: number, limit: number): Promise<UserLoanHistory> {
    const offset = (page - 1) * limit;

    // Contar total de préstamos del usuario
    const countQuery = 'SELECT COUNT(*) as total FROM prestamo WHERE usuario_id = $1';
    const countResult = await this.pool.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total);

    // Obtener préstamos con detalles
    const loansQuery = `
      SELECT 
        p.id, p.usuario_id, p.transporte_id, p.estacion_origen_id, p.estacion_destino_id,
        p.fecha_inicio, p.fecha_fin, p.duracion_estimada, p.costo_total, p.estado,
        p.metodo_pago, p.created_at, p.updated_at,
        u.nombre as user_name, u.correo as user_email, u.documento as user_document,
        t.tipo as transport_type, t.modelo as transport_model,
        eo.nombre as origin_station_name,
        ed.nombre as destination_station_name
      FROM prestamo p
      LEFT JOIN usuario u ON p.usuario_id = u.id
      LEFT JOIN transporte t ON p.transporte_id = t.id
      LEFT JOIN estacion eo ON p.estacion_origen_id = eo.id
      LEFT JOIN estacion ed ON p.estacion_destino_id = ed.id
      WHERE p.usuario_id = $1
      ORDER BY p.fecha_inicio DESC
      LIMIT $2 OFFSET $3
    `;

    const loansResult = await this.pool.query(loansQuery, [userId, limit, offset]);

    // Estadísticas del usuario
    const statsQuery = `
      SELECT 
        COUNT(*) as total_loans,
        COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(fecha_fin, NOW()) - fecha_inicio))/60), 0) as total_time_used,
        COALESCE(SUM(costo_total), 0) as total_spent,
        (
          SELECT t.tipo || ' ' || t.modelo
          FROM prestamo p2
          JOIN transporte t ON p2.transporte_id = t.id
          WHERE p2.usuario_id = $1
          GROUP BY t.tipo, t.modelo
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) as favorite_transport
      FROM prestamo
      WHERE usuario_id = $1
    `;

    const statsResult = await this.pool.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    const loans: LoanWithDetails[] = loansResult.rows.map(row => ({
      id: row.id,
      userId: row.usuario_id,
      transportId: row.transporte_id,
      originStationId: row.estacion_origen_id,
      destinationStationId: row.estacion_destino_id,
      startDate: new Date(row.fecha_inicio),
      endDate: row.fecha_fin ? new Date(row.fecha_fin) : null,
      estimatedDuration: row.duracion_estimada,
      totalCost: row.costo_total,
      status: row.estado as LoanStatus,
      paymentMethod: row.metodo_pago,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      userName: row.user_name,
      userEmail: row.user_email,
      userDocument: row.user_document,
      transportType: row.transport_type,
      transportModel: row.transport_model,
      originStationName: row.origin_station_name,
      destinationStationName: row.destination_station_name
    }));

    return {
      loans,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      userStats: {
        totalLoans: parseInt(stats.total_loans),
        totalTimeUsed: Math.round(parseFloat(stats.total_time_used)),
        totalSpent: parseFloat(stats.total_spent) || 0,
        favoriteTransport: stats.favorite_transport || 'N/A'
      }
    };
  }

  async getStats(): Promise<LoanStats> {
    const query = `
      SELECT 
        COUNT(*) as total_loans,
        COUNT(*) FILTER (WHERE estado IN ('active', 'extended')) as active_loans,
        COUNT(*) FILTER (WHERE estado = 'completed') as completed_loans,
        COUNT(*) FILTER (WHERE estado = 'cancelled') as cancelled_loans,
        COALESCE(SUM(costo_total), 0) as total_revenue,
        COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(fecha_fin, NOW()) - fecha_inicio))/60), 0) as average_duration,
        (
          SELECT t.tipo
          FROM prestamo p
          JOIN transporte t ON p.transporte_id = t.id
          GROUP BY t.tipo
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) as most_used_transport_type
      FROM prestamo
    `;

    const result = await this.pool.query(query);
    const row = result.rows[0];

    return {
      totalLoans: parseInt(row.total_loans),
      activeLoans: parseInt(row.active_loans),
      completedLoans: parseInt(row.completed_loans),
      cancelledLoans: parseInt(row.cancelled_loans),
      totalRevenue: parseFloat(row.total_revenue) || 0,
      averageDuration: Math.round(parseFloat(row.average_duration)),
      mostUsedTransportType: row.most_used_transport_type || 'N/A'
    };
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<LoanWithDetails[]> {
    const query = `
      SELECT 
        p.id, p.usuario_id, p.transporte_id, p.estacion_origen_id, p.estacion_destino_id,
        p.fecha_inicio, p.fecha_fin, p.duracion_estimada, p.costo_total, p.estado,
        p.metodo_pago, p.created_at, p.updated_at,
        u.nombre as user_name, u.correo as user_email, u.documento as user_document,
        t.tipo as transport_type, t.modelo as transport_model,
        eo.nombre as origin_station_name,
        ed.nombre as destination_station_name
      FROM prestamo p
      LEFT JOIN usuario u ON p.usuario_id = u.id
      LEFT JOIN transporte t ON p.transporte_id = t.id
      LEFT JOIN estacion eo ON p.estacion_origen_id = eo.id
      LEFT JOIN estacion ed ON p.estacion_destino_id = ed.id
      WHERE p.fecha_inicio BETWEEN $1 AND $2
      ORDER BY p.fecha_inicio DESC
    `;

    const result = await this.pool.query(query, [startDate, endDate]);

    return result.rows.map(row => ({
      id: row.id,
      userId: row.usuario_id,
      transportId: row.transporte_id,
      originStationId: row.estacion_origen_id,
      destinationStationId: row.estacion_destino_id,
      startDate: new Date(row.fecha_inicio),
      endDate: row.fecha_fin ? new Date(row.fecha_fin) : null,
      estimatedDuration: row.duracion_estimada,
      totalCost: row.costo_total,
      status: row.estado as LoanStatus,
      paymentMethod: row.metodo_pago,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      userName: row.user_name,
      userEmail: row.user_email,
      userDocument: row.user_document,
      transportType: row.transport_type,
      transportModel: row.transport_model,
      originStationName: row.origin_station_name,
      destinationStationName: row.destination_station_name
    }));
  }

  async getMostUsedTransports(startDate: Date, endDate: Date, limit: number): Promise<any[]> {
    const query = `
      SELECT 
        t.tipo as transport_type,
        t.modelo as transport_model,
        COUNT(p.id) as total_loans,
        COALESCE(SUM(p.costo_total), 0) as total_revenue
      FROM prestamo p
      JOIN transporte t ON p.transporte_id = t.id
      WHERE p.fecha_inicio BETWEEN $1 AND $2
      GROUP BY t.tipo, t.modelo, t.id
      ORDER BY total_loans DESC
      LIMIT $3
    `;

    const result = await this.pool.query(query, [startDate, endDate, limit]);
    return result.rows.map(row => ({
      transportType: row.transport_type,
      transportModel: row.transport_model,
      totalLoans: parseInt(row.total_loans),
      totalRevenue: parseFloat(row.total_revenue)
    }));
  }

  async getMostActiveStations(startDate: Date, endDate: Date, limit: number): Promise<any[]> {
    const query = `
      SELECT 
        e.nombre as station_name,
        COUNT(p.id) as total_loans,
        COUNT(CASE WHEN p.estacion_origen_id = e.id THEN 1 END) as loans_as_origin,
        COUNT(CASE WHEN p.estacion_destino_id = e.id THEN 1 END) as loans_as_destination
      FROM prestamo p
      JOIN estacion e ON (p.estacion_origen_id = e.id OR p.estacion_destino_id = e.id)
      WHERE p.fecha_inicio BETWEEN $1 AND $2
      GROUP BY e.id, e.nombre
      ORDER BY total_loans DESC
      LIMIT $3
    `;

    const result = await this.pool.query(query, [startDate, endDate, limit]);
    return result.rows.map(row => ({
      stationName: row.station_name,
      totalLoans: parseInt(row.total_loans),
      loansAsOrigin: parseInt(row.loans_as_origin),
      loansAsDestination: parseInt(row.loans_as_destination)
    }));
  }

  async hasActiveLoans(userId: number): Promise<boolean> {
    const query = `
      SELECT 1 FROM prestamo 
      WHERE usuario_id = $1 AND estado IN ('active', 'extended')
      LIMIT 1
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows.length > 0;
  }

  async countActiveLoans(): Promise<number> {
    const query = `
      SELECT COUNT(*) as total 
      FROM prestamo 
      WHERE estado IN ('active', 'extended')
    `;

    const result = await this.pool.query(query);
    return parseInt(result.rows[0].total);
  }

  async findOverdueLoans(): Promise<LoanWithDetails[]> {
    // Préstamos que han excedido su duración estimada por más de 30 minutos
    const query = `
      SELECT 
        p.id, p.usuario_id, p.transporte_id, p.estacion_origen_id, p.estacion_destino_id,
        p.fecha_inicio, p.fecha_fin, p.duracion_estimada, p.costo_total, p.estado,
        p.metodo_pago, p.created_at, p.updated_at,
        u.nombre as user_name, u.correo as user_email, u.documento as user_document,
        t.tipo as transport_type, t.modelo as transport_model,
        eo.nombre as origin_station_name,
        ed.nombre as destination_station_name
      FROM prestamo p
      LEFT JOIN usuario u ON p.usuario_id = u.id
      LEFT JOIN transporte t ON p.transporte_id = t.id
      LEFT JOIN estacion eo ON p.estacion_origen_id = eo.id
      LEFT JOIN estacion ed ON p.estacion_destino_id = ed.id
      WHERE p.estado IN ('active', 'extended')
        AND p.duracion_estimada IS NOT NULL
        AND EXTRACT(EPOCH FROM (NOW() - p.fecha_inicio))/60 > (p.duracion_estimada + 30)
      ORDER BY p.fecha_inicio ASC
    `;

    const result = await this.pool.query(query);

    return result.rows.map(row => ({
      id: row.id,
      userId: row.usuario_id,
      transportId: row.transporte_id,
      originStationId: row.estacion_origen_id,
      destinationStationId: row.estacion_destino_id,
      startDate: new Date(row.fecha_inicio),
      endDate: row.fecha_fin ? new Date(row.fecha_fin) : null,
      estimatedDuration: row.duracion_estimada,
      totalCost: row.costo_total,
      status: row.estado as LoanStatus,
      paymentMethod: row.metodo_pago,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      userName: row.user_name,
      userEmail: row.user_email,
      userDocument: row.user_document,
      transportType: row.transport_type,
      transportModel: row.transport_model,
      originStationName: row.origin_station_name,
      destinationStationName: row.destination_station_name
    }));
  }

  async findLoansByRevenue(minRevenue: number): Promise<LoanWithDetails[]> {
    const query = `
      SELECT 
        p.id, p.usuario_id, p.transporte_id, p.estacion_origen_id, p.estacion_destino_id,
        p.fecha_inicio, p.fecha_fin, p.duracion_estimada, p.costo_total, p.estado,
        p.metodo_pago, p.created_at, p.updated_at,
        u.nombre as user_name, u.correo as user_email, u.documento as user_document,
        t.tipo as transport_type, t.modelo as transport_model,
        eo.nombre as origin_station_name,
        ed.nombre as destination_station_name
      FROM prestamo p
      LEFT JOIN usuario u ON p.usuario_id = u.id
      LEFT JOIN transporte t ON p.transporte_id = t.id
      LEFT JOIN estacion eo ON p.estacion_origen_id = eo.id
      LEFT JOIN estacion ed ON p.estacion_destino_id = ed.id
      WHERE p.costo_total >= $1
      ORDER BY p.costo_total DESC
    `;

    const result = await this.pool.query(query, [minRevenue]);

    return result.rows.map(row => ({
      id: row.id,
      userId: row.usuario_id,
      transportId: row.transporte_id,
      originStationId: row.estacion_origen_id,
      destinationStationId: row.estacion_destino_id,
      startDate: new Date(row.fecha_inicio),
      endDate: row.fecha_fin ? new Date(row.fecha_fin) : null,
      estimatedDuration: row.duracion_estimada,
      totalCost: row.costo_total,
      status: row.estado as LoanStatus,
      paymentMethod: row.metodo_pago,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      userName: row.user_name,
      userEmail: row.user_email,
      userDocument: row.user_document,
      transportType: row.transport_type,
      transportModel: row.transport_model,
      originStationName: row.origin_station_name,
      destinationStationName: row.destination_station_name
    }));
  }
}