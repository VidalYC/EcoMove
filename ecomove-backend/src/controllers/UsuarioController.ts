import { Request, Response } from 'express';
import { UsuarioModel } from '../models/UsuarioModel';
import { UsuarioService } from '../services/UsuarioService';
import { IUsuarioCreate, IUsuarioUpdate } from '../types/Usuario';


interface ExtendedRequest extends Request {
  user?: {
    id: number;
    correo: string;
    role: string;
  };
}


export class UsuarioController {
  // Registrar nuevo usuario
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, correo, documento, telefono, password, role } = req.body;

      // Verificar si ya existe
      const existingUser = await UsuarioModel.findByEmail(correo);
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con este correo'
        });
        return;
      }

      const existingDoc = await UsuarioModel.findByDocumento(documento);
      if (existingDoc) {
        res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con este documento'
        });
        return;
      }

      // Crear usuario
      const userData: IUsuarioCreate = {
        nombre,
        correo,
        documento,
        telefono,
        password,
        role: role || 'user'
      };

      const newUser = await UsuarioModel.create(userData);

      // Remover password_hash del response
      const { password_hash, ...userResponse } = newUser;

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: userResponse
      });

    } catch (error) {
      console.error('Error en register:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Login de usuario
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { correo, password } = req.body;

      // Buscar usuario
      const user = await UsuarioModel.findByEmail(correo);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
        return;
      }

      // Verificar estado activo
      if (user.estado !== 'active') {
        res.status(401).json({
          success: false,
          message: 'Usuario inactivo'
        });
        return;
      }

      // Verificar contraseña
      const isValidPassword = await UsuarioModel.verifyPassword(password, user.password_hash!);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
        return;
      }

      // Remover password_hash del response
      const { password_hash, ...userResponse } = user;

      res.json({
        success: true,
        message: 'Login exitoso',
        data: userResponse
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener perfil del usuario autenticado
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const extReq = req as ExtendedRequest;
      const userId = extReq.user?.id; // ← CAMBIO AQUÍ
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
        return;
      }

      const user = await UsuarioModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Error en getProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar perfil
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const extReq = req as ExtendedRequest;
      const userId = extReq.user?.id; // ← CAMBIO AQUÍ
      const updates: IUsuarioUpdate = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
        return;
      }

      const updatedUser = await UsuarioService.update(userId, updates);
      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: updatedUser
      });

    } catch (error) {
      console.error('Error en updateProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Cambiar contraseña
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const extReq = req as ExtendedRequest;
      const userId = extReq.user?.id; // ← CAMBIO AQUÍ
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
        return;
      }

      // Verificar contraseña actual
      const user = await UsuarioModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      const isValidCurrentPassword = await UsuarioModel.verifyPassword(
        currentPassword, 
        user.password_hash!
      );
      
      if (!isValidCurrentPassword) {
        res.status(400).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
        return;
      }

      // Cambiar contraseña
      const success = await UsuarioService.updatePassword(userId, newPassword);
      if (!success) {
        res.status(500).json({
          success: false,
          message: 'Error al cambiar la contraseña'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });

    } catch (error) {
      console.error('Error en changePassword:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // ========== MÉTODOS PARA ADMIN ==========

  // Listar todos los usuarios (solo admin)
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await UsuarioService.findAll(page, limit);

      res.json({
        success: true,
        data: result.usuarios,
        pagination: {
          total: result.total,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          limit
        }
      });

    } catch (error) {
      console.error('Error en getAllUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Buscar usuarios (solo admin)
  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const searchTerm = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!searchTerm) {
        res.status(400).json({
          success: false,
          message: 'Término de búsqueda requerido'
        });
        return;
      }

      const result = await UsuarioService.search(searchTerm, page, limit);

      res.json({
        success: true,
        data: result.usuarios,
        pagination: {
          total: result.total,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          limit
        }
      });

    } catch (error) {
      console.error('Error en searchUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Activar usuario (solo admin)
  static async activateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      const success = await UsuarioService.activate(userId);
      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Usuario activado exitosamente'
      });

    } catch (error) {
      console.error('Error en activateUser:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Desactivar usuario (solo admin)
  static async deactivateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      const success = await UsuarioService.deactivate(userId);
      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Usuario desactivado exitosamente'
      });

    } catch (error) {
      console.error('Error en deactivateUser:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas (solo admin)
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await UsuarioService.getStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error en getStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}