// Archivo de tipos personalizados para autenticación
export interface AuthenticatedUser {
  id: number;
  correo: string;
  role: string;
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}