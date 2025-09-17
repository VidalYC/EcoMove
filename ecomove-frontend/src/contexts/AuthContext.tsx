import { createContext, useContext, ReactNode } from 'react';
import { useAuth as useAuthHook } from '../hooks/useAuth';
import { User, LoginData, RegisterData } from '../services/api.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginData) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const authData = useAuthHook();

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Para compatibilidad con tu código existente
export interface AuthUser {
  id: string;
  name: string;  // Mapear desde 'nombre'
  email: string; // Mapear desde 'correo'
  role: 'user' | 'admin';
  documento?: string;
  telefono?: string;
}

// Hook wrapper para mantener compatibilidad
export function useAuthCompat() {
  const { user, login, register, logout, loading, error, clearError } = useAuth();
  
  // Transformar el usuario del backend al formato esperado por el frontend
  const transformedUser: AuthUser | null = user ? {
    id: user.id,
    name: user.nombre,
    email: user.correo,
    role: user.role,
    documento: user.documento,
    telefono: user.telefono,
  } : null;

  const loginCompat = async (userData: { email: string; password: string }): Promise<boolean> => {
    return await login({
      correo: userData.email,
      password: userData.password,
    });
  };

  const registerCompat = async (userData: { 
    name: string; 
    email: string; 
    password: string;
    documento?: string;
    telefono?: string;
  }): Promise<boolean> => {
    return await register({
      nombre: userData.name,
      correo: userData.email,
      password: userData.password,
      documento: userData.documento || '',
      telefono: userData.telefono || '',
    });
  };

  return {
    user: transformedUser,
    login: loginCompat,
    register: registerCompat,
    logout,
    isLoading: loading,
    error,
    clearError,
  };
}