// src/presentation/http/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { RegisterUserUseCase } from '../../../core/use-cases/user/register-user.use-case';
import { LoginUserUseCase } from '../../../core/use-cases/user/login-user.use-case';

/**
 * Controlador para autenticación (registro y login)
 * Responsabilidad única: Gestionar autenticación de usuarios
 */
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, correo, documento, telefono, password } = req.body;

      const result = await this.registerUserUseCase.execute({
        nombre,
        correo,
        documento,
        telefono,
        password
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          id: result.user.getId(),
          nombre: result.user.getName(),
          correo: result.user.getEmail().getValue(),
          documento: result.user.getDocumentNumber().getValue(),
          telefono: result.user.getPhone(),
          token: result.token
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error al registrar usuario',
        code: 'REGISTER_ERROR'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { correo, password } = req.body;

      const result = await this.loginUserUseCase.execute({ correo, password });

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: result.user.getId(),
            nombre: result.user.getName(),
            correo: result.user.getEmail().getValue(),
            documento: result.user.getDocumentNumber().getValue(),
            telefono: result.user.getPhone(),
            role: result.user.getRole(),
            estado: result.user.getStatus()
          },
          token: result.token
        }
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Error en el login',
        code: 'LOGIN_ERROR'
      });
    }
  }
}