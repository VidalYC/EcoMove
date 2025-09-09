declare namespace Express {
  interface Request {
    user?: {
      id: number;
      correo: string;
      role: string;
    };
    targetUser?: import('./Usuario').IUsuario;
  }
}