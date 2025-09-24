import React, { createContext, useContext, useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  // Helper methods para tipos específicos
  showSuccess: (title: string, message: string, duration?: number) => void;
  showError: (title: string, message: string, persistent?: boolean) => void;
  showWarning: (title: string, message: string, duration?: number) => void;
  showInfo: (title: string, message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      id,
      duration: 5000, // 5 segundos por defecto
      persistent: false,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove si no es persistente
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helper methods
  const showSuccess = useCallback((title: string, message: string, duration = 4000) => {
    addNotification({ type: 'success', title, message, duration });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, persistent = false) => {
    addNotification({ 
      type: 'error', 
      title, 
      message, 
      persistent,
      duration: persistent ? undefined : 7000 
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, duration = 5000) => {
    addNotification({ type: 'warning', title, message, duration });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, duration = 4000) => {
    addNotification({ type: 'info', title, message, duration });
  }, [addNotification]);

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}