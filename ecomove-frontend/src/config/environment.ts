export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  
  // Environment
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  
  // Features flags
  ENABLE_GEOLOCATION: import.meta.env.VITE_ENABLE_GEOLOCATION === 'true' || true,
  ENABLE_OFFLINE_MODE: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true' || false,
  
  // Development
  SHOW_DEV_INFO: import.meta.env.NODE_ENV === 'development',
} as const;