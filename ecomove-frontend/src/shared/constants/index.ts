// 🔄 SHARED CONSTANTS

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/users/auth/login',
    REGISTER: '/api/v1/users/auth/register',
    REFRESH: '/api/v1/users/auth/refresh',
    LOGOUT: '/api/v1/users/auth/logout',
  },
  USERS: {
    PROFILE: '/api/v1/users/profile',
    UPDATE: '/api/v1/users/profile',
  },
  TRANSPORTS: {
    LIST: '/api/v1/transports',
    BY_ID: (id: number) => `/api/v1/transports/${id}`,
    AVAILABLE: '/api/v1/transports/available',
  },
  STATIONS: {
    LIST: '/api/v1/stations',
    BY_ID: (id: number) => `/api/v1/stations/${id}`,
    NEARBY: '/api/v1/stations/nearby',
  },
  LOANS: {
    LIST: '/api/v1/loans',
    CREATE: '/api/v1/loans',
    BY_ID: (id: number) => `/api/v1/loans/${id}`,
    COMPLETE: (id: number) => `/api/v1/loans/${id}/complete`,
    CANCEL: (id: number) => `/api/v1/loans/${id}/cancel`,
  },
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'ecomove_auth_token',
  REFRESH_TOKEN: 'ecomove_refresh_token',
  USER_DATA: 'ecomove_user_data',
  THEME: 'ecomove_theme',
  LANGUAGE: 'ecomove_language',
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  DOCUMENT_NUMBER_LENGTH: { min: 8, max: 11 },
  PHONE_NUMBER_LENGTH: 10,
  EMAIL_MAX_LENGTH: 255,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
} as const;

export const MAP_CONFIG = {
  DEFAULT_CENTER: [4.6097, -74.0817] as [number, number], // Bogotá
  DEFAULT_ZOOM: 13,
  MARKER_CLUSTER_MAX_ZOOM: 15,
} as const;

export const THEME_COLORS = {
  primary: {
    50: '#f0f9ff',
    500: '#3b82f6',
    600: '#2563eb',
    900: '#1e3a8a',
  },
  secondary: {
    50: '#f0fdfa',
    500: '#14b8a6',
    600: '#0d9488',
  },
  accent: {
    500: '#f97316',
    600: '#ea580c',
  },
  success: {
    500: '#10b981',
    600: '#059669',
  },
  warning: {
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    500: '#ef4444',
    600: '#dc2626',
  },
} as const;