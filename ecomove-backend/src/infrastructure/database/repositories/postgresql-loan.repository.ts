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

  // Método para verificar transporte con herencia
  async findTransportWithInheritance(transportId: number): Promise<any> {
    const query = `
      SELECT id, tipo, modelo, estado, estacion_actual_id as current_station_id,
             tarifa_por_hora as hourly_rate, created_at, updated_at
      FROM transportes 
      WHERE id = $1
      UNION ALL
      SELECT id, tipo, modelo, estado, estacion_actual_id as current_station_id,
             tarifa_por_hora as hourly_rate, created_at, updated_at  
      FROM bicicleta 
      WHERE id = $1  
      UNION ALL
      SELECT id, tipo, modelo, estado, estacion_actual_id as current_station_id,
             tarifa_por_hora as hourly_rate, created_at, updated_at
      FROM patineta_electrica 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [transportId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  async save(loan: Loan): Promise<Loan> {
    const data = loan.toPersistence();
    
    // Generar código único de préstamo
    const codigoPrestamo = await this.generateLoanCode();
    
    const query = `
      INSERT INTO prestamos (
        codigo_prestamo, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
        fecha_inicio, fecha_fin, duracion_minutos, tarifa_por_hora, costo_total, 
        costo_adicional, estado, metodo_pago, comentarios
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, created_at, updated_at
    `;
    
    const values = [
      codigoPrestamo,
      data.usuario_id,
      data.transporte_id,
      data.estacion_origen_id,
      data.estacion_destino_id,
      data.fecha_inicio,
      data.fecha_fin,
      data.duracion_estimada, // mapea a duracion_minutos
      0, // tarifa_por_hora - por defecto 0
      data.costo_total,
      0, // costo_adicional - por defecto 0
      data.estado,
      data.metodo_pago,
      null // comentarios
    ];
    
    const result = await this.pool.query(query, values);
    const savedData = { ...data, ...result.rows[0] };
    
    return Loan.fromPersistence(savedData);
  }

  // Método para generar código único de préstamo
  private async generateLoanCode(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const code = `LOAN-${timestamp.slice(-8)}-${random}`;
    
    // Verificar que no existe (muy improbable, pero por seguridad)
    const existsQuery = 'SELECT 1 FROM prestamos WHERE codigo_prestamo = $1';
    const result = await this.pool.query(existsQuery, [code]);
    
    if (result.rows.length > 0) {
      // Si existe, generar uno nuevo recursivamente
      return this.generateLoanCode();
    }
    
    return code;
  }

  async findById(id: number): Promise<Loan | null> {
    const query = `
      SELECT id, codigo_prestamo, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
             fecha_inicio, fecha_fin, duracion_minutos as duracion_estimada, 
             costo_total, estado, metodo_pago, created_at, updated_at
      FROM prestamos 
      WHERE id = $1 AND deleted_at IS NULL
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
      UPDATE prestamos 
      SET estacion_destino_id = $1, fecha_fin = $2, duracion_minutos = $3,
          costo_total = $4, estado = $5, metodo_pago = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND deleted_at IS NULL
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
    
    const updatedLoan = await this.findById(loan.getId()!);
    if (!updatedLoan) {
      throw new Error('Error al refrescar el préstamo actualizado');
    }
    return updatedLoan;
  }

  async delete(id: number): Promise<void> {
    // Soft delete
    const query = 'UPDATE prestamos SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rowCount === 0) {
      throw new Error('Préstamo no encontrado para eliminar');
    }
  }

  async exists(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM prestamos WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }

  async findActiveByUserId(userId: number): Promise<Loan | null> {
    const query = `
      SELECT id, codigo_prestamo, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
             fecha_inicio, fecha_fin, duracion_minutos as duracion_estimada, 
             costo_total, estado, metodo_pago, created_at, updated_at
      FROM prestamos 
      WHERE usuario_id = $1 AND estado IN ('active', 'extended') AND deleted_at IS NULL
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
    
    const countQuery = 'SELECT COUNT(*) as total FROM prestamos WHERE usuario_id = $1 AND deleted_at IS NULL';
    const countResult = await this.pool.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT id, codigo_prestamo, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
             fecha_inicio, fecha_fin, duracion_minutos as duracion_estimada, 
             costo_total, estado, metodo_pago, created_at, updated_at
      FROM prestamos 
      WHERE usuario_id = $1 AND deleted_at IS NULL
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

  async findByStatus(status: LoanStatus, page: number, limit: number): Promise<PaginatedLoanResponse<Loan>> {
    const offset = (page - 1) * limit;
    
    const countQuery = 'SELECT COUNT(*) as total FROM prestamos WHERE estado = $1 AND deleted_at IS NULL';
    const countResult = await this.pool.query(countQuery, [status]);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT id, codigo_prestamo, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
             fecha_inicio, fecha_fin, duracion_minutos as duracion_estimada, 
             costo_total, estado, metodo_pago, created_at, updated_at
      FROM prestamos 
      WHERE estado = $1 AND deleted_at IS NULL
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

  async findByIdWithDetails(id: number): Promise<LoanWithDetails | null> {
    const query = `
      SELECT 
        p.id, p.codigo_prestamo, p.usuario_id, p.transporte_id, p.estacion_origen_id, p.estacion_destino_id,
        p.fecha_inicio, p.fecha_fin, p.duracion_minutos, p.costo_total, p.estado,
        p.metodo_pago, p.created_at, p.updated_at,
        u.name as user_name, u.email as user_email, u.document_number as user_document,
        COALESCE(t.tipo, b.tipo, pe.tipo) as transport_type,
        COALESCE(t.modelo, b.modelo, pe.modelo) as transport_model,
        eo.nombre as origin_station_name,
        ed.nombre as destination_station_name
      FROM prestamos p
      LEFT JOIN users u ON p.usuario_id = u.id
      LEFT JOIN transportes t ON p.transporte_id = t.id
      LEFT JOIN bicicleta b ON p.transporte_id = b.id
      LEFT JOIN patineta_electrica pe ON p.transporte_id = pe.id
      LEFT JOIN estaciones eo ON p.estacion_origen_id = eo.id
      LEFT JOIN estaciones ed ON p.estacion_destino_id = ed.id
      WHERE p.id = $1 AND p.deleted_at IS NULL
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
      estimatedDuration: row.duracion_minutos,
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

  async getStats(): Promise<LoanStats> {
    const query = `
      SELECT 
        COUNT(*) as total_loans,
        COUNT(*) FILTER (WHERE estado IN ('active', 'extended')) as active_loans,
        COUNT(*) FILTER (WHERE estado = 'completed') as completed_loans,
        COUNT(*) FILTER (WHERE estado = 'cancelled') as cancelled_loans,
        COALESCE(SUM(costo_total), 0) as total_revenue,
        COALESCE(AVG(duracion_minutos), 0) as average_duration,
        (
          SELECT COALESCE(t.tipo, b.tipo, pe.tipo)
          FROM prestamos p
          LEFT JOIN transportes t ON p.transporte_id = t.id
          LEFT JOIN bicicleta b ON p.transporte_id = b.id
          LEFT JOIN patineta_electrica pe ON p.transporte_id = pe.id
          WHERE p.deleted_at IS NULL
          GROUP BY COALESCE(t.tipo, b.tipo, pe.tipo)
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) as most_used_transport_type
      FROM prestamos
      WHERE deleted_at IS NULL
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

  async hasActiveLoans(userId: number): Promise<boolean> {
    const query = `
      SELECT 1 FROM prestamos 
      WHERE usuario_id = $1 AND estado IN ('active', 'extended') AND deleted_at IS NULL
      LIMIT 1
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows.length > 0;
  }

  async countActiveLoans(): Promise<number> {
    const query = `
      SELECT COUNT(*) as total 
      FROM prestamos 
      WHERE estado IN ('active', 'extended') AND deleted_at IS NULL
    `;

    const result = await this.pool.query(query);
    return parseInt(result.rows[0].total);
  }

  async findByFilters(filters: LoanFilters): Promise<PaginatedLoanResponse<LoanWithDetails>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // CORRECCIÓN: Construir WHERE conditions dinámicamente
    let whereConditions = ['p.deleted_at IS NULL'];
    const values: any[] = [];
    let paramIndex = 1;

    console.log('🔍 Repository filters received:', filters); // Debug

    // IMPORTANTE: Usar nombres correctos de propiedades (inglés)
    if (filters.userId) {
      whereConditions.push(`p.usuario_id = $${paramIndex}`);
      values.push(filters.userId);
      paramIndex++;
    }

    if (filters.status) {
      whereConditions.push(`p.estado = $${paramIndex}`);
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.transportId) {
      whereConditions.push(`p.transporte_id = $${paramIndex}`);
      values.push(filters.transportId);
      paramIndex++;
    }

    if (filters.originStationId) {
      whereConditions.push(`p.estacion_origen_id = $${paramIndex}`);
      values.push(filters.originStationId);
      paramIndex++;
    }

    if (filters.destinationStationId) {
      whereConditions.push(`p.estacion_destino_id = $${paramIndex}`);
      values.push(filters.destinationStationId);
      paramIndex++;
    }

    if (filters.startDate) {
      whereConditions.push(`p.fecha_inicio >= $${paramIndex}`);
      values.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      whereConditions.push(`p.fecha_inicio <= $${paramIndex}`);
      values.push(filters.endDate);
      paramIndex++;
    }

    if (filters.paymentMethod) {
      whereConditions.push(`p.metodo_pago = $${paramIndex}`);
      values.push(filters.paymentMethod);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    console.log('🔍 WHERE clause:', whereClause); // Debug
    console.log('🔍 Values:', values); // Debug
    console.log('🔍 Param count:', values.length); // Debug

    try {
      // Query de conteo
      const countQuery = `SELECT COUNT(*) as total FROM prestamos p WHERE ${whereClause}`;
      console.log('🔍 Count query:', countQuery); // Debug
      
      const countResult = await this.pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Query principal con JOIN para obtener detalles
      const dataQuery = `
        SELECT 
          p.id, p.codigo_prestamo, p.usuario_id, p.transporte_id, p.estacion_origen_id, p.estacion_destino_id,
          p.fecha_inicio, p.fecha_fin, p.duracion_minutos, p.costo_total, p.estado,
          p.metodo_pago, p.created_at, p.updated_at,
          u.name as user_name, u.email as user_email, u.document_number as user_document,
          COALESCE(b.tipo, pe.tipo) as transport_type,
          COALESCE(b.modelo, pe.modelo) as transport_model,
          eo.nombre as origin_station_name,
          ed.nombre as destination_station_name
        FROM prestamos p
        LEFT JOIN users u ON p.usuario_id = u.id
        LEFT JOIN bicicleta b ON p.transporte_id = b.id
        LEFT JOIN patineta_electrica pe ON p.transporte_id = pe.id
        LEFT JOIN estaciones eo ON p.estacion_origen_id = eo.id
        LEFT JOIN estaciones ed ON p.estacion_destino_id = ed.id
        WHERE ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      console.log('🔍 Data query:', dataQuery); // Debug
      
      // Agregar LIMIT y OFFSET a los valores
      const dataValues = [...values, limit, offset];
      console.log('🔍 Data values:', dataValues); // Debug

      const dataResult = await this.pool.query(dataQuery, dataValues);

      const loans: LoanWithDetails[] = dataResult.rows.map(row => ({
        id: row.id,
        loanCode: row.codigo_prestamo,
        userId: row.usuario_id,
        transportId: row.transporte_id,
        originStationId: row.estacion_origen_id,
        destinationStationId: row.estacion_destino_id,
        startDate: new Date(row.fecha_inicio),
        endDate: row.fecha_fin ? new Date(row.fecha_fin) : null,
        estimatedDuration: row.duracion_minutos,
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

    } catch (error) {
      console.error('❌ Error in findByFilters:', error);
      throw new Error('Error al consultar préstamos: ' + (error as Error).message);
    }
  }

  // Métodos básicos para cumplir con la interfaz
  async findUserLoanHistory(userId: number, page: number, limit: number): Promise<UserLoanHistory> {
    const result = await this.findByUserId(userId, page, limit);
    return {
      loans: [], // Simplificado por ahora
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      userStats: {
        totalLoans: result.total,
        totalTimeUsed: 0,
        totalSpent: 0,
        favoriteTransport: 'N/A'
      }
    };
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<LoanWithDetails[]> {
    return []; // Implementación simplificada
  }

  async getMostUsedTransports(startDate: Date, endDate: Date, limit: number): Promise<any[]> {
    return []; // Implementación simplificada
  }

  async getMostActiveStations(startDate: Date, endDate: Date, limit: number): Promise<any[]> {
    return []; // Implementación simplificada
  }

  async findOverdueLoans(): Promise<LoanWithDetails[]> {
    return []; // Implementación simplificada
  }

  async findLoansByRevenue(minRevenue: number): Promise<LoanWithDetails[]> {
    return []; // Implementación simplificada
  }

  async findByTransportId(transportId: number): Promise<Loan[]> {
    const query = `
      SELECT id, codigo_prestamo, usuario_id, transporte_id, estacion_origen_id, estacion_destino_id,
             fecha_inicio, fecha_fin, duracion_minutos as duracion_estimada, 
             costo_total, estado, metodo_pago, created_at, updated_at
      FROM prestamos 
      WHERE transporte_id = $1 AND deleted_at IS NULL
      ORDER BY fecha_inicio DESC
    `;
    
    const result = await this.pool.query(query, [transportId]);
    return result.rows.map(row => Loan.fromPersistence(row));
  }
}