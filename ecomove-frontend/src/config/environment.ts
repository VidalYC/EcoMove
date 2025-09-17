// ⚙️ ENVIRONMENT CONFIGURATION
const requiredEnvVars = ['VITE_API_BASE_URL'] as const;

interface Environment {
  API_BASE_URL: string;
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
  VERSION: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] || defaultValue;
  
  if (!value && requiredEnvVars.includes(key as any)) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value || '';
}

export const env: Environment = {
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000'),
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  VERSION: import.meta.env.PACKAGE_VERSION || '1.0.0',
};

export default env;