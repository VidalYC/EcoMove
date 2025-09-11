import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import { IUsuario, IUsuarioCreate } from '../types/Usuario';

export class UsuarioModel {
  // Crear usuario
  static async create(userData: IUsuarioCreate): Promise<IUsuario> {
    const { nombre, correo, documento, telefono, password, role = 'user' } = userData;
    
    const password_hash = await bcrypt.hash(password, 12);
    
    const query = `
      INSERT INTO usuario (nombre, correo, documento, telefono, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nombre, correo, documento, telefono, fecha_registro, 
                estado, role, created_at, updated_at
    `;
    
    const values = [nombre, correo, documento, telefono, password_hash, role];
    const result = await pool.query(query, values);
    
    return result.rows[0];
  }

  // Buscar por ID
  static async findById(id: number): Promise<IUsuario | null> {
    const query = `
      SELECT id, nombre, correo, documento, telefono, fecha_registro, 
             estado, role, created_at, updated_at
      FROM usuario WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Buscar por email
  static async findByEmail(correo: string): Promise<IUsuario | null> {
    const query = `
      SELECT id, nombre, correo, documento, telefono, password_hash,
             fecha_registro, estado, role, created_at, updated_at
      FROM usuario WHERE correo = $1
    `;
    
    const result = await pool.query(query, [correo]);
    return result.rows[0] || null;
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  // Agregar este método al final de la clase UsuarioModel
    static async findByDocumento(documento: string): Promise<IUsuario | null> {
    const query = `
        SELECT id, nombre, correo, documento, telefono, fecha_registro, 
            estado, role, created_at, updated_at
        FROM usuario WHERE documento = $1
    `;
    
    const result = await pool.query(query, [documento]);
    return result.rows[0] || null;
    }

    // Obtener estadísticas básicas
    static async getStats(): Promise<any> {
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