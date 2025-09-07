import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  document: string;
  role: 'user' | 'admin';
  isBlocked?: boolean;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users data
const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    name: 'Usuario Demo',
    email: 'usuario@ecomove.com',
    document: '12345678',
    role: 'user',
    password: 'usuario123',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Admin EcoMove',
    email: 'admin@ecomove.com',
    document: '87654321',
    role: 'admin',
    password: 'admin123',
    createdAt: new Date('2024-01-01')
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('ecomove_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser && !foundUser.isBlocked) {
      const userWithoutPassword = { ...foundUser };
      delete (userWithoutPassword as any).password;
      
      setUser(userWithoutPassword);
      localStorage.setItem('ecomove_user', JSON.stringify(userWithoutPassword));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === userData.email);
    if (existingUser) {
      setIsLoading(false);
      return false;
    }
    
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    mockUsers.push(newUser);
    
    const userWithoutPassword = { ...newUser };
    delete (userWithoutPassword as any).password;
    
    setUser(userWithoutPassword);
    localStorage.setItem('ecomove_user', JSON.stringify(userWithoutPassword));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ecomove_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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