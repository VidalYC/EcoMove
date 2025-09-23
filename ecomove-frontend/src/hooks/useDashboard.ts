// src/hooks/useDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

interface UseDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: any) => void;
  onSuccess?: (data: any) => void;
}

interface DashboardState<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useDashboard<T>(
  fetchFunction: () => Promise<T>,
  options: UseDashboardOptions = {}
) {
  const { showSuccess, showError } = useNotifications();
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 segundos por defecto
    onError,
    onSuccess
  } = options;

  const [state, setState] = useState<DashboardState<T>>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
    lastUpdated: null
  });

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: !isRefresh,
        isRefreshing: isRefresh,
        error: null
      }));

      const data = await fetchFunction();
      
      setState(prev => ({
        ...prev,
        data,
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastUpdated: new Date()
      }));

      if (onSuccess) {
        onSuccess(data);
      }

      if (isRefresh) {
        showSuccess('Actualizado', 'Datos actualizados correctamente');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Error al cargar datos';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: errorMessage
      }));

      if (onError) {
        onError(error);
      }

      showError('Error de carga', errorMessage);
    }
  }, [fetchFunction, onError, onSuccess, showSuccess, showError]);

  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const retry = useCallback(() => {
    loadData(false);
  }, [loadData]);

  // Carga inicial
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !state.data) return;

    const interval = setInterval(() => {
      loadData(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, state.data, loadData]);

  return {
    ...state,
    refresh,
    retry,
    loadData
  };
}

// Hook específico para estadísticas con formateo
export function useStats<T>(
  fetchFunction: () => Promise<T>,
  formatter?: (data: T) => any,
  options?: UseDashboardOptions
) {
  const dashboard = useDashboard(fetchFunction, options);

  const formattedData = dashboard.data && formatter ? 
    formatter(dashboard.data) : 
    dashboard.data;

  return {
    ...dashboard,
    data: formattedData
  };
}

// Hook para manejar paginación en dashboards
export function usePaginatedDashboard<T>(
  fetchFunction: (page: number, limit: number) => Promise<T>,
  initialPage = 1,
  initialLimit = 10,
  options?: UseDashboardOptions
) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const wrappedFetchFunction = useCallback(() => {
    return fetchFunction(page, limit);
  }, [fetchFunction, page, limit]);

  const dashboard = useDashboard(wrappedFetchFunction, options);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  return {
    ...dashboard,
    page,
    limit,
    goToPage,
    changeLimit,
    nextPage,
    prevPage
  };
}

// Utilidades para formatear datos comunes en dashboards
export const dashboardFormatters = {
  currency: (amount: number, locale = 'es-CO', currency = 'COP') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(amount);
  },

  percentage: (value: number, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
  },

  number: (value: number, locale = 'es-CO') => {
    return new Intl.NumberFormat(locale).format(value);
  },

  duration: (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  },

  timeAgo: (date: Date | string) => {
    const now = new Date();
    const target = typeof date === 'string' ? new Date(date) : date;
    const diffInMinutes = Math.floor((now.getTime() - target.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays}d`;
  },

  date: (date: Date | string, locale = 'es-CO') => {
    const target = typeof date === 'string' ? new Date(date) : date;
    return target.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  dateTime: (date: Date | string, locale = 'es-CO') => {
    const target = typeof date === 'string' ? new Date(date) : date;
    return target.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// Hook para manejar múltiples dashboards
export function useMultipleDashboards<T extends Record<string, () => Promise<any>>>(
  dashboards: T,
  options?: UseDashboardOptions
) {
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Crear un tipo para los resultados que sea indexable
  type DashboardResults = {
    [K in keyof T]: ReturnType<typeof useDashboard>
  };

  const results = {} as DashboardResults;

  // Crear los hooks para cada dashboard
  Object.keys(dashboards).forEach((key) => {
    const dashboardKey = key as keyof T;
    results[dashboardKey] = useDashboard(dashboards[dashboardKey], {
      ...options,
      onSuccess: undefined, // Manejamos el éxito globalmente
      onError: undefined    // Manejamos el error globalmente
    }) as any;
  });

  // Calcular estados globales
  useEffect(() => {
    const allResults = Object.values(results);
    const stillLoading = allResults.some(result => result.isLoading);
    const hasErrors = allResults.some(result => result.error);
    
    setGlobalLoading(stillLoading);
    
    if (hasErrors) {
      const errors = allResults
        .filter(result => result.error)
        .map(result => result.error)
        .join(', ');
      setGlobalError(errors);
    } else {
      setGlobalError(null);
    }

    // Trigger success callback when all dashboards are loaded
    if (!stillLoading && !hasErrors && options?.onSuccess) {
      const allData = {} as {[K in keyof T]: any};
      
      Object.keys(results).forEach((key) => {
        const dashboardKey = key as keyof T;
        allData[dashboardKey] = results[dashboardKey].data;
      });
      
      options.onSuccess(allData);
    }
  }, [results, options]);

  const refreshAll = useCallback(() => {
    Object.values(results).forEach(result => result.refresh());
  }, [results]);

  return {
    dashboards: results,
    globalLoading,
    globalError,
    refreshAll
  };
}