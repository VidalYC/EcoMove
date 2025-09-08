import { pool } from '../config/database';
import { UsuarioModel } from '../models/UsuarioModel';
import { IUsuario, IUsuarioUpdate, IUsuarioStats } from '../types/Usuario';

export class UsuarioService {
  // Actualizar usuario con validaciones de negocio
  static async update(id: number, updates: IUsuarioUpdate): Promise<IUsuario | null> {
    const allowedFields = ['nombre', 'correo', 'telefono', 'estado', 'role'];
    const setFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Construir query dinámicamente
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key as keyof IUsuarioUpdate] !== undefined) {
        setFields.push(`${key} = $${paramIndex}`);
        values.push(updates[key as keyof IUsuarioUpdate]);
        paramIndex++;
      }
    });

    if (setFields.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    setFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE usuario 
      SET ${setFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, nombre, correo, documento, telefono, fecha_registro, 
                estado, role, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Cambiar contraseña con validaciones
  static async updatePassword(id: number, newPassword: string): Promise<boolean> {
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);
    
    const query = `
      UPDATE usuario 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    
    const result = await pool.query(query, [password_hash, id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Obtener usuarios con paginación
  static async findAll(page: number = 1, limit: number = 10): Promise<{
    usuarios: IUsuario[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;
    
    const usersQuery = `
      SELECT id, nombre, correo, documento, telefono, fecha_registro, 
             estado, role, created_at, updated_at
      FROM usuario 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const countQuery = 'SELECT COUNT(*) as total FROM usuario';
    
    const [usersResult, countResult] = await Promise.all([
      pool.query(usersQuery, [limit, offset]),
      pool.query(countQuery)
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    return {
      usuarios: usersResult.rows,
      total,
      totalPages,
      currentPage: page
    };
  }

  // Buscar usuarios con filtros
  static async search(searchTerm: string, page: number = 1, limit: number = 10): Promise<{
    usuarios: IUsuario[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;
    
    const usersQuery = `
      SELECT id, nombre, correo, documento, telefono, fecha_registro, 
             estado, role, created_at, updated_at
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
      pool.query(usersQuery, [searchPattern, limit, offset]),
      pool.query(countQuery, [searchPattern])
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    return {
      usuarios: usersResult.rows,
      total,
      totalPages,
      currentPage: page
    };
  }

  // Activar usuario
  static async activate(id: number): Promise<boolean> {
    const query = `
      UPDATE usuario 
      SET estado = 'active', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Desactivar usuario
  static async deactivate(id: number): Promise<boolean> {
    const query = `
      UPDATE usuario 
      SET estado = 'inactive', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Obtener estadísticas para dashboard
  static async getStats(): Promise<IUsuarioStats> {
    const query = `
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(*) FILTER (WHERE estado = 'active') as usuarios_activos,
        COUNT(*) FILTER (WHERE role = 'admin') as administradores,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as nuevos_mes
      FROM usuario
    `;
    
    const result = await pool.query(query);
    return result.rows[0];
  }
}