import { Pool } from 'pg';
import { User } from '../../../core/domain/entities/user.entity';
import { UserRepository } from '../../../core/domain/repositories/user.repository';
import { Email } from '../../../core/domain/value-objects/email.vo';
import { DocumentNumber } from '../../../core/domain/value-objects/document-number.vo';

export class PostgreSQLUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async save(user: User): Promise<User> {
    const userData = user.toPersistence();
    
    const query = `
      INSERT INTO usuario (nombre, correo, documento, telefono, password_hash, role, estado, fecha_registro)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at, updated_at
    `;
    
    const values = [
      userData.nombre,
      userData.correo,
      userData.documento,
      userData.telefono,
      userData.password_hash,
      userData.role,
      userData.estado || 'active',
      userData.fecha_registro || new Date()
    ];
    
    const result = await this.pool.query(query, values);
    const savedData = { ...userData, ...result.rows[0] };
    
    return User.fromPersistence(savedData);
  }

  async findById(id: number): Promise<User | null> {
    const query = `
      SELECT id, nombre, correo, documento, telefono, password_hash,
             fecha_registro, estado, role, created_at, updated_at
      FROM usuario 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return User.fromPersistence(result.rows[0]);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const query = `
      SELECT id, nombre, correo, documento, telefono, password_hash,
             fecha_registro, estado, role, created_at, updated_at
      FROM usuario 
      WHERE correo = $1
    `;
    
    const result = await this.pool.query(query, [email.value]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return User.fromPersistence(result.rows[0]);
  }

  async findByDocument(document: DocumentNumber): Promise<User | null> {
    const query = `
      SELECT id, nombre, correo, documento, telefono, password_hash,
             fecha_registro, estado, role, created_at, updated_at
      FROM usuario 
      WHERE documento = $1
    `;
    
    const result = await this.pool.query(query, [document.value]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return User.fromPersistence(result.rows[0]);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    users: User[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;
    
    const usersQuery = `
      SELECT id, nombre, correo, documento, telefono, password_hash,
             fecha_registro, estado, role, created_at, updated_at
      FROM usuario 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const countQuery = 'SELECT COUNT(*) as total FROM usuario';
    
    const [usersResult, countResult] = await Promise.all([
      this.pool.query(usersQuery, [limit, offset]),
      this.pool.query(countQuery)
    ]);
    
    const users = usersResult.rows.map(row => User.fromPersistence(row));
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    return {
      users,
      total,
      totalPages,
      currentPage: page
    };
  }

  async search(term: string, page: number = 1, limit: number = 10): Promise<{
    users: User[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;
    const searchPattern = `%${term}%`;
    
    const usersQuery = `
      SELECT id, nombre, correo, documento, telefono, password_hash,
             fecha_registro, estado, role, created_at, updated_at
      FROM usuario 
      WHERE nombre ILIKE $1 OR correo ILIKE $1 OR documento ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM usuario 
      WHERE nombre ILIKE $1 OR correo ILIKE $1 OR documento ILIKE $1
    `;
    
    const [usersResult, countResult] = await Promise.all([
      this.pool.query(usersQuery, [searchPattern, limit, offset]),
      this.pool.query(countQuery, [searchPattern])
    ]);
    
    const users = usersResult.rows.map(row => User.fromPersistence(row));
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    return {
      users,
      total,
      totalPages,
      currentPage: page
    };
  }

  async update(user: User): Promise<User> {
    const userData = user.toPersistence();
    
    const query = `
      UPDATE usuario 
      SET nombre = $1, correo = $2, telefono = $3, password_hash = $4, 
          estado = $5, role = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING updated_at
    `;
    
    const values = [
      userData.nombre,
      userData.correo,
      userData.telefono,
      userData.password_hash,
      userData.estado,
      userData.role,
      userData.id
    ];
    
    const result = await this.pool.query(query, values);
    const updatedData = { ...userData, updated_at: result.rows[0].updated_at };
    
    return User.fromPersistence(updatedData);
  }

  async delete(id: number): Promise<void> {
    const query = 'DELETE FROM usuario WHERE id = $1';
    await this.pool.query(query, [id]);
  }

  async exists(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM usuario WHERE id = $1 LIMIT 1';
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }

  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    admins: number;
    newUsersThisMonth: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE estado = 'active') as active_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_month
      FROM usuario
    `;
    
    const result = await this.pool.query(query);
    const row = result.rows[0];
    
    return {
      totalUsers: parseInt(row.total_users),
      activeUsers: parseInt(row.active_users),
      admins: parseInt(row.admins),
      newUsersThisMonth: parseInt(row.new_users_month)
    };
  }
}