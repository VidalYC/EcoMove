// src/infrastructure/persistence/postgresql/user.repository.ts
import { Pool, PoolClient } from 'pg';
import { User, UserRole, UserStatus } from '../../../core/domain/entities/user.entity';
import { Email } from '../../../core/domain/value-objects/email.vo';
import { DocumentNumber } from '../../../core/domain/value-objects/document-number.vo';
import { UserRepository, PaginatedResponse, UserStats } from '../../../core/domain/repositories/user.repository';

export class PostgreSQLUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async save(user: User): Promise<User> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO users (name, email, document_number, phone, password, role, status, registration_date, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        user.getName(),
        user.getEmail().getValue(),
        user.getDocumentNumber().getValue(),
        user.getPhone(),
        user.getPassword(),
        user.getRole(),
        user.getStatus(),
        user.getRegistrationDate(),
        user.getUpdatedAt()
      ];

      const result = await client.query(query, values);
      return User.fromDatabase(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findById(id: number): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return User.fromDatabase(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL';
      const result = await client.query(query, [email.getValue()]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return User.fromDatabase(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findByDocument(document: DocumentNumber): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM users WHERE document_number = $1 AND deleted_at IS NULL';
      const result = await client.query(query, [document.getValue()]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return User.fromDatabase(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async update(user: User): Promise<User> {
    const client = await this.pool.connect();
    try {
      const query = `
        UPDATE users 
        SET name = $2, phone = $3, role = $4, status = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *
      `;
      
      const values = [
        user.getId(),
        user.getName(),
        user.getPhone(),
        user.getRole(),
        user.getStatus()
      ];

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado para actualizar');
      }

      return User.fromDatabase(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async delete(id: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      const query = 'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1';
      await client.query(query, [id]);
    } finally {
      client.release();
    }
  }

  async exists(id: number): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT 1 FROM users WHERE id = $1 AND deleted_at IS NULL';
      const result = await client.query(query, [id]);
      return result.rows.length > 0;
    } finally {
      client.release();
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse<User>> {
    const client = await this.pool.connect();
    try {
      const offset = (page - 1) * limit;
      
      const countQuery = 'SELECT COUNT(*) FROM users WHERE deleted_at IS NULL';
      const countResult = await client.query(countQuery);
      const total = parseInt(countResult.rows[0].count);
      
      const dataQuery = `
        SELECT * FROM users 
        WHERE deleted_at IS NULL 
        ORDER BY registration_date DESC 
        LIMIT $1 OFFSET $2
      `;
      const dataResult = await client.query(dataQuery, [limit, offset]);
      
      const users = dataResult.rows.map(row => User.fromDatabase(row));
      const totalPages = Math.ceil(total / limit);
      
      return {
        users,
        total,
        totalPages,
        currentPage: page
      };
    } finally {
      client.release();
    }
  }

  async search(term: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<User>> {
    const client = await this.pool.connect();
    try {
      const offset = (page - 1) * limit;
      const searchTerm = `%${term}%`;
      
      const countQuery = `
        SELECT COUNT(*) FROM users 
        WHERE deleted_at IS NULL 
        AND (name ILIKE $1 OR email ILIKE $1 OR document_number ILIKE $1)
      `;
      const countResult = await client.query(countQuery, [searchTerm]);
      const total = parseInt(countResult.rows[0].count);
      
      const dataQuery = `
        SELECT * FROM users 
        WHERE deleted_at IS NULL 
        AND (name ILIKE $1 OR email ILIKE $1 OR document_number ILIKE $1)
        ORDER BY registration_date DESC 
        LIMIT $2 OFFSET $3
      `;
      const dataResult = await client.query(dataQuery, [searchTerm, limit, offset]);
      
      const users = dataResult.rows.map(row => User.fromDatabase(row));
      const totalPages = Math.ceil(total / limit);
      
      return {
        users,
        total,
        totalPages,
        currentPage: page
      };
    } finally {
      client.release();
    }
  }

  async getStats(): Promise<UserStats> {
    const client = await this.pool.connect();
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE status = 'active') as active_users,
          COUNT(*) FILTER (WHERE role = 'admin') as admins,
          COUNT(*) FILTER (WHERE registration_date >= date_trunc('month', CURRENT_DATE)) as new_users_this_month
        FROM users 
        WHERE deleted_at IS NULL
      `;
      
      const result = await client.query(statsQuery);
      const row = result.rows[0];
      
      return {
        totalUsers: parseInt(row.total_users),
        activeUsers: parseInt(row.active_users),
        admins: parseInt(row.admins),
        newUsersThisMonth: parseInt(row.new_users_this_month)
      };
    } finally {
      client.release();
    }
  }
}