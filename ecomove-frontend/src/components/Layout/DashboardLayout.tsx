// src/components/Layout/DashboardLayout.tsx
import React from 'react';
import { LogOut, RefreshCw, Bell, Settings } from 'lucide-react';
import { Button } from '../UI/Button';
import { ThemeToggle } from '../UI/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  icon?: React.ComponentType<any>;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  actions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  icon: Icon,
  onRefresh,
  isRefreshing = false,
  actions
}) => {
  const { logout } = useAuth();
  const { showError } = useNotifications();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      showError('Error', 'No se pudo cerrar la sesión');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              {Icon && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Acciones personalizadas */}
              {actions}
              
              {/* Botón de refresh si se proporciona */}
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </Button>
              )}

              {/* Notificaciones (placeholder) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert('Notificaciones próximamente')}
                className="relative"
              >
                <Bell className="h-4 w-4" />
                {/* Badge de notificaciones */}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </Button>
              
              {/* Toggle de tema */}
              <ThemeToggle />
              
              {/* Configuraciones (placeholder) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert('Configuraciones próximamente')}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              {/* Logout */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
};