import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotifications, Notification, NotificationType } from '../../contexts/NotificationContext';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    default:
      return Info;
  }
};

const getNotificationStyles = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return {
        container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        icon: 'text-green-600 dark:text-green-400',
        title: 'text-green-800 dark:text-green-200',
        message: 'text-green-700 dark:text-green-300',
        closeButton: 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300'
      };
    case 'error':
      return {
        container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-400',
        title: 'text-red-800 dark:text-red-200',
        message: 'text-red-700 dark:text-red-300',
        closeButton: 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
      };
    case 'warning':
      return {
        container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-600 dark:text-yellow-400',
        title: 'text-yellow-800 dark:text-yellow-200',
        message: 'text-yellow-700 dark:text-yellow-300',
        closeButton: 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
      };
    case 'info':
      return {
        container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        title: 'text-blue-800 dark:text-blue-200',
        message: 'text-blue-700 dark:text-blue-300',
        closeButton: 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
      };
  }
};

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const Icon = getNotificationIcon(notification.type);
  const styles = getNotificationStyles(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8, transition: { duration: 0.2 } }}
      className={`relative flex items-start p-3 border rounded-lg shadow-md backdrop-blur-sm ${styles.container} max-w-xs`}
      layout
    >
      {/* Icono */}
      <div className="flex-shrink-0 mr-2">
        <Icon className={`h-4 w-4 ${styles.icon}`} />
      </div>
      
      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <h3 className={`text-xs font-semibold ${styles.title} leading-tight`}>
          {notification.title}
        </h3>
        <div className={`mt-0.5 text-xs ${styles.message} leading-tight`}>
          {notification.message}
        </div>
      </div>
      
      {/* Botón cerrar */}
      <div className="flex-shrink-0 ml-2">
        <button
          className={`inline-flex rounded-md focus:outline-none focus:ring-1 focus:ring-offset-1 p-0.5 ${styles.closeButton} transition-colors`}
          onClick={() => onRemove(notification.id)}
        >
          <span className="sr-only">Cerrar</span>
          <X className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationItem
              notification={notification}
              onRemove={removeNotification}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};