export interface IUsuario {
  id?: number;
  nombre: string;
  correo: string;
  documento: string;
  telefono?: string;
  password_hash?: string;
  fecha_registro?: Date;
  estado?: 'active' | 'inactive' | 'suspended';
  role?: 'user' | 'admin';
  created_at?: Date;
  updated_at?: Date;
}

export interface IUsuarioCreate {
  nombre: string;
  correo: string;
  documento: string;
  telefono?: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface IUsuarioUpdate {
  nombre?: string;
  correo?: string;
  telefono?: string;
  estado?: 'active' | 'inactive' | 'suspended';
  role?: 'user' | 'admin';
}

export interface IUsuarioStats {
  total_usuarios: string;
  usuarios_activos: string;
  administradores: string;
  nuevos_mes: string;
}