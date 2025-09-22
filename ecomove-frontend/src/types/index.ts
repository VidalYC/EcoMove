import { IconComponent } from './icons';

// =====================================================
// TIPOS DE TEMA Y UI
// =====================================================

export type Theme = 'light' | 'dark';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// =====================================================
// TIPOS DE USUARIO Y AUTENTICACIÓN
// =====================================================

export interface User {
  id: string;
  nombre: string;
  correo: string;
  role: 'user' | 'admin';
  documento?: string;
  telefono?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

export interface LoginData {
  correo: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  correo: string;
  password: string;
  documento: string;
  telefono: string;
}

export interface AuthContextType {
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

// =====================================================
// TIPOS DE TRANSPORTES
// =====================================================

export type TransportType = 'bicycle' | 'electric_scooter';
export type TransportStatus = 'available' | 'in_use' | 'maintenance' | 'out_of_service';

export interface Transport {
  id: string;
  type: TransportType;
  model: string;
  status: TransportStatus;
  batteryLevel?: number; // Solo para scooters eléctricos
  currentStationId?: string;
  lastMaintenanceDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransportFilters {
  type?: TransportType;
  status?: TransportStatus;
  stationId?: string;
  minBatteryLevel?: number;
  page?: number;
  limit?: number;
}

// =====================================================
// TIPOS DE ESTACIONES
// =====================================================

export type StationStatus = 'active' | 'inactive' | 'maintenance';

export interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  availableSlots: number;
  status: StationStatus;
  transports: Transport[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StationFilters {
  status?: StationStatus;
  hasAvailableTransports?: boolean;
  nearLatitude?: number;
  nearLongitude?: number;
  maxDistance?: number;
  page?: number;
  limit?: number;
}

// =====================================================
// TIPOS DE PRÉSTAMOS
// =====================================================

export type LoanStatus = 'active' | 'completed' | 'cancelled' | 'overdue';
export type PaymentMethod = 'card' | 'cash' | 'subscription';

export interface Loan {
  id: string;
  userId: string;
  transportId: string;
  originStationId: string;
  destinationStationId?: string;
  startDate: Date;
  endDate?: Date;
  estimatedDuration?: number; // en minutos
  totalCost?: number;
  status: LoanStatus;
  paymentMethod?: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanWithDetails extends Loan {
  user: User;
  transport: Transport;
  originStation: Station;
  destinationStation?: Station;
}

export interface CreateLoanData {
  transportId: string;
  originStationId: string;
  estimatedDuration?: number;
  paymentMethod: PaymentMethod;
}

export interface LoanFilters {
  userId?: string;
  transportId?: string;
  status?: LoanStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// =====================================================
// TIPOS DE ESTADÍSTICAS
// =====================================================

export interface UserStats {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  totalSpent: number;
  averageDuration: number;
  favoriteTransportType?: TransportType;
  totalDistanceTraveled?: number;
  co2Saved?: number;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalTransports: number;
  availableTransports: number;
  totalStations: number;
  activeStations: number;
  totalLoans: number;
  activeLoans: number;
  totalRevenue: number;
  averageLoanDuration: number;
}

// =====================================================
// TIPOS DE API Y RESPUESTAS
// =====================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// =====================================================
// TIPOS DE FORMULARIOS
// =====================================================

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
  options?: { value: string; label: string; }[]; // Para selects
}

export interface FormErrors {
  [fieldName: string]: string;
}

// =====================================================
// TIPOS DE NAVEGACIÓN Y RUTAS
// =====================================================

export interface NavItem {
  label: string;
  href: string;
  icon?: IconComponent;
  external?: boolean;
  protected?: boolean;
  adminOnly?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

// =====================================================
// TIPOS DE MAPAS Y GEOLOCALIZACIÓN
// =====================================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapBounds {
  northeast: Coordinates;
  southwest: Coordinates;
}

export interface RoutePoint extends Coordinates {
  address?: string;
  name?: string;
}

export interface Route {
  origin: RoutePoint;
  destination: RoutePoint;
  waypoints?: RoutePoint[];
  distance: number; // en metros
  duration: number; // en segundos
  polyline?: string;
}

// =====================================================
// TIPOS DE NOTIFICACIONES
// =====================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

// =====================================================
// TIPOS DE CONFIGURACIÓN
// =====================================================

export interface AppConfig {
  apiBaseUrl: string;
  mapApiKey: string;
  supportEmail: string;
  supportPhone: string;
  companyAddress: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
}

// =====================================================
// UTILIDADES DE TIPOS
// =====================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Tipo para componentes React con children
export interface WithChildren {
  children: React.ReactNode;
}

// Tipo para props de componentes con className opcional
export interface WithClassName {
  className?: string;
}