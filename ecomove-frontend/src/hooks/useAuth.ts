import { useState, useEffect } from 'react';
import { apiService, User, LoginData, RegisterData } from '../services/api.service';

interface UseAuthReturn {
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

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token and user on mount
    const savedToken = localStorage.getItem('ecomove_token');
    const savedUser = localStorage.getItem('ecomove_user');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        apiService.setToken(savedToken);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('ecomove_token');
        localStorage.removeItem('ecomove_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.login(credentials);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('ecomove_user', JSON.stringify(user));
        return true;
      } else {
        setError(response.message || 'Login failed');
        return false;
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.register(userData);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('ecomove_user', JSON.stringify(user));
        return true;
      } else {
        setError(response.message || 'Registration failed');
        return false;
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      console.warn('Logout API call failed, clearing local data anyway');
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('ecomove_token');
      localStorage.removeItem('ecomove_user');
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.updateProfile(updates);
      
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('ecomove_user', JSON.stringify(response.data));
        return true;
      } else {
        setError(response.message || 'Profile update failed');
        return false;
      }
    } catch (error: any) {
      setError(error.message || 'Profile update failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.changePassword({
        currentPassword,
        newPassword,
      });
      
      if (response.success) {
        return true;
      } else {
        setError(response.message || 'Password change failed');
        return false;
      }
    } catch (error: any) {
      setError(error.message || 'Password change failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
  };
}