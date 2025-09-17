import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { apiService } from '../services/api.service';

export interface Station {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  capacity: number;
  isActive: boolean;
  currentOccupancy?: number;
}

export interface Vehicle {
  id: string;
  type: 'bicycle' | 'scooter' | 'electric-scooter';
  model: string;
  stationId: string | null;
  status: 'available' | 'in-use' | 'maintenance';
  batteryLevel?: number;
}

export interface Loan {
  id: string;
  userId: string;
  vehicleId: string;
  startTime: Date;
  endTime?: Date;
  originStationId: string;
  destinationStationId?: string;
  cost: number;
  status: 'active' | 'completed';
  duration?: number;
}

interface DataContextType {
  // Data
  stations: Station[];
  loans: Loan[];
  
  // Loading states
  stationsLoading: boolean;
  loansLoading: boolean;
  
  // Error states
  stationsError: string | null;
  loansError: string | null;
  
  // Actions
  refreshStations: () => Promise<void>;
  refreshLoans: () => Promise<void>;
  getVehiclesByStation: (stationId: string) => Promise<Vehicle[]>;
  createLoan: (data: { vehicleId: string; originStationId: string }) => Promise<string | null>;
  completeLoan: (loanId: string, destinationStationId: string) => Promise<boolean>;
  cancelLoan: (loanId: string) => Promise<boolean>;
  
  // Utilities
  getActiveLoans: () => Loan[];
  getUserLoans: (userId: string) => Loan[];
  getActiveLoan: () => Loan | null;
  
  // Legacy methods (mantenidos para compatibilidad)
  addStation: (station: Omit<Station, 'id'>) => void;
  updateStation: (id: string, updates: Partial<Station>) => void;
  deleteStation: (id: string) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  extendLoan: (loanId: string, newDurationMinutes: number) => Promise<boolean>;
  calculateFare: (vehicleType: string, durationMinutes: number) => Promise<any>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [loansLoading, setLoansLoading] = useState(false);
  const [stationsError, setStationsError] = useState<string | null>(null);
  const [loansError, setLoansError] = useState<string | null>(null);

  const refreshStations = async (): Promise<void> => {
    try {
      setStationsLoading(true);
      setStationsError(null);
      
      const response = await apiService.getStationsWithTransports();
      
      if (response.success && response.data && Array.isArray(response.data)) {
        const transformedStations = response.data.map((apiStation: any) => ({
          id: apiStation.id || '',
          name: apiStation.name || 'Estación sin nombre',
          address: apiStation.address || 'Dirección no disponible',
          coordinates: apiStation.coordinates || { lat: 0, lng: 0 },
          capacity: apiStation.capacity || 0,
          isActive: apiStation.isActive ?? true,
          currentOccupancy: apiStation.currentOccupancy || 0,
        }));
        setStations(transformedStations);
      } else {
        setStationsError('Error al cargar estaciones');
        setStations([]);
      }
    } catch (error: any) {
      setStationsError(error.message || 'Error al cargar estaciones');
      setStations([]);
    } finally {
      setStationsLoading(false);
    }
  };

  const refreshLoans = async (): Promise<void> => {
    try {
      setLoansLoading(true);
      setLoansError(null);
      
      // Verificar si hay token antes de hacer la petición
      const token = localStorage.getItem('ecomove_token');
      if (!token) {
        // Si no hay token, no cargar préstamos (usuario no logueado)
        setLoans([]);
        setLoansLoading(false);
        return;
      }
      
      const response = await apiService.getLoans();
      
      if (response.success && response.data && Array.isArray(response.data)) {
        const transformedLoans = response.data.map((apiLoan: any) => ({
          id: apiLoan.id || '',
          userId: apiLoan.userId || '',
          vehicleId: apiLoan.vehicleId || '',
          startTime: apiLoan.startTime ? new Date(apiLoan.startTime) : new Date(),
          endTime: apiLoan.endTime ? new Date(apiLoan.endTime) : undefined,
          originStationId: apiLoan.originStationId || '',
          destinationStationId: apiLoan.destinationStationId,
          cost: apiLoan.totalCost || apiLoan.cost || 0,
          status: apiLoan.status === 'cancelled' ? 'completed' : (apiLoan.status || 'active'),
          duration: apiLoan.duration,
        }));
        setLoans(transformedLoans);
      } else {
        setLoansError('Error al cargar préstamos');
        setLoans([]);
      }
    } catch (error: any) {
      // No mostrar error si no hay token (usuario no logueado)
      const token = localStorage.getItem('ecomove_token');
      if (token) {
        setLoansError(error.message || 'Error al cargar préstamos');
      }
      setLoans([]);
    } finally {
      setLoansLoading(false);
    }
  };

  const getVehiclesByStation = async (stationId: string): Promise<Vehicle[]> => {
    try {
      const response = await apiService.getStationAvailability(stationId);
      if (response.success && response.data?.available) {
        return response.data.available.map((v: any) => ({
          id: v.id || '',
          type: v.type === 'electric-scooter' ? 'electric-scooter' : 'bicycle',
          model: v.model || 'Modelo desconocido',
          stationId: v.stationId,
          status: v.status || 'available',
          batteryLevel: v.batteryLevel,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting vehicles:', error);
      return [];
    }
  };

  const createLoan = async (data: { vehicleId: string; originStationId: string }): Promise<string | null> => {
    try {
      const response = await apiService.createLoan(data);
      if (response.success && response.data) {
        await refreshLoans();
        return response.data.id;
      }
      return null;
    } catch (error) {
      console.error('Error creating loan:', error);
      return null;
    }
  };

  const completeLoan = async (loanId: string, destinationStationId: string): Promise<boolean> => {
    try {
      const response = await apiService.completeLoan(loanId, { destinationStationId });
      if (response.success) {
        await refreshLoans();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error completing loan:', error);
      return false;
    }
  };

  const cancelLoan = async (loanId: string): Promise<boolean> => {
    try {
      const response = await apiService.cancelLoan(loanId);
      if (response.success) {
        await refreshLoans();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error cancelling loan:', error);
      return false;
    }
  };

  const getActiveLoans = (): Loan[] => {
    return loans.filter(loan => loan.status === 'active');
  };

  const getUserLoans = (userId: string): Loan[] => {
    return loans.filter(loan => loan.userId === userId);
  };

  const getActiveLoan = (): Loan | null => {
    return loans.find(loan => loan.status === 'active') || null;
  };

  // Métodos legacy simplificados
  const addStation = (_station: Omit<Station, 'id'>) => {
    console.warn('addStation: Not implemented');
  };

  const updateStation = (_id: string, _updates: Partial<Station>) => {
    console.warn('updateStation: Not implemented');
  };

  const deleteStation = (_id: string) => {
    console.warn('deleteStation: Not implemented');
  };

  const addVehicle = (_vehicle: Omit<Vehicle, 'id'>) => {
    console.warn('addVehicle: Not implemented');
  };

  const updateVehicle = (_id: string, _updates: Partial<Vehicle>) => {
    console.warn('updateVehicle: Not implemented');
  };

  const deleteVehicle = (_id: string) => {
    console.warn('deleteVehicle: Not implemented');
  };

  const extendLoan = async (_loanId: string, _newDurationMinutes: number): Promise<boolean> => {
    console.warn('extendLoan: Not implemented');
    return false;
  };

  const calculateFare = async (_vehicleType: string, _durationMinutes: number): Promise<any> => {
    console.warn('calculateFare: Not implemented');
    return null;
  };

  useEffect(() => {
    refreshStations();
    refreshLoans();
  }, []);

  const contextValue: DataContextType = {
    stations,
    loans,
    stationsLoading,
    loansLoading,
    stationsError,
    loansError,
    refreshStations,
    refreshLoans,
    getVehiclesByStation,
    createLoan,
    completeLoan,
    cancelLoan,
    getActiveLoans,
    getUserLoans,
    getActiveLoan,
    addStation,
    updateStation,
    deleteStation,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    extendLoan,
    calculateFare,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}