import { createContext, useContext, ReactNode } from 'react';
import { useStations } from '../hooks/useStations';
import { useLoans } from '../hooks/useLoans';
import { Station as ApiStation, Vehicle as ApiVehicle, Loan as ApiLoan } from '../services/api.service';


// Interfaces para compatibilidad con el frontend existente
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
  duration?: number; // in minutes
}

interface DataContextType {
  // Stations
  stations: Station[];
  stationsLoading: boolean;
  stationsError: string | null;
  refreshStations: () => Promise<void>;
  getNearbyStations: (lat: number, lng: number, radius?: number) => Promise<Station[]>;
  
  // Vehicles
  getVehiclesByStation: (stationId: string) => Promise<Vehicle[]>;
  
  // Loans
  loans: Loan[];
  loansLoading: boolean;
  loansError: string | null;
  refreshLoans: () => Promise<void>;
  createLoan: (loan: { vehicleId: string; originStationId: string }) => Promise<string | null>;
  completeLoan: (loanId: string, destinationStationId: string) => Promise<boolean>;
  cancelLoan: (loanId: string) => Promise<boolean>;
  extendLoan: (loanId: string, newDurationMinutes: number) => Promise<boolean>;
  calculateFare: (vehicleType: string, durationMinutes: number) => Promise<{ fare: number; breakdown: any } | null>;
  
  // Utilities
  getActiveLoans: () => Loan[];
  getUserLoans: (userId: string) => Loan[];
  getActiveLoan: () => Loan | null;
  
  // Legacy methods (mantener compatibilidad)
  addStation: (station: Omit<Station, 'id'>) => void;
  updateStation: (id: string, updates: Partial<Station>) => void;
  deleteStation: (id: string) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

// Funciones para transformar datos del backend al formato del frontend
const transformStation = (apiStation: ApiStation): Station => ({
  id: apiStation.id,
  name: apiStation.name,
  address: apiStation.address,
  coordinates: apiStation.coordinates,
  capacity: apiStation.capacity,
  isActive: apiStation.isActive,
  currentOccupancy: apiStation.currentOccupancy,
});

const transformVehicle = (apiVehicle: ApiVehicle): Vehicle => ({
  id: apiVehicle.id,
  type: apiVehicle.type === 'electric-scooter' ? 'electric-scooter' : 'bicycle',
  model: apiVehicle.model,
  stationId: apiVehicle.stationId,
  status: apiVehicle.status,
  batteryLevel: apiVehicle.batteryLevel,
});

const transformLoan = (apiLoan: ApiLoan): Loan => ({
  id: apiLoan.id,
  userId: apiLoan.userId,
  vehicleId: apiLoan.vehicleId,
  startTime: new Date(apiLoan.startTime),
  endTime: apiLoan.endTime ? new Date(apiLoan.endTime) : undefined,
  originStationId: apiLoan.originStationId,
  destinationStationId: apiLoan.destinationStationId,
  cost: apiLoan.totalCost,
  status: apiLoan.status === 'cancelled' ? 'completed' : apiLoan.status,
  duration: apiLoan.duration,
});

export function DataProvider({ children }: DataProviderProps) {
  const stationsHook = useStations();
  const loansHook = useLoans();

  // Transform API data to frontend format
  const stations = stationsHook.stations.map(transformStation);
  const loans = loansHook.loans.map(transformLoan);

  const getVehiclesByStation = async (stationId: string): Promise<Vehicle[]> => {
    try {
      const vehicles = await stationsHook.getStationAvailability(stationId);
      return vehicles.map(transformVehicle);
    } catch (error) {
      console.error('Error getting vehicles by station:', error);
      return [];
    }
  };

  const createLoan = async (data: { vehicleId: string; originStationId: string }): Promise<string | null> => {
    try {
      const newLoan = await loansHook.createLoan(data);
      return newLoan ? newLoan.id : null;
    } catch (error) {
      console.error('Error creating loan:', error);
      return null;
    }
  };

  const completeLoan = async (loanId: string, destinationStationId: string): Promise<boolean> => {
    try {
      const updatedLoan = await loansHook.completeLoan(loanId, { destinationStationId });
      return !!updatedLoan;
    } catch (error) {
      console.error('Error completing loan:', error);
      return false;
    }
  };

  const cancelLoan = async (loanId: string): Promise<boolean> => {
    try {
      const updatedLoan = await loansHook.cancelLoan(loanId);
      return !!updatedLoan;
    } catch (error) {
      console.error('Error cancelling loan:', error);
      return false;
    }
  };

  const extendLoan = async (loanId: string, newDurationMinutes: number): Promise<boolean> => {
    try {
      const updatedLoan = await loansHook.extendLoan(loanId, newDurationMinutes);
      return !!updatedLoan;
    } catch (error) {
      console.error('Error extending loan:', error);
      return false;
    }
  };

  const calculateFare = async (vehicleType: string, durationMinutes: number) => {
    return await loansHook.calculateFare(vehicleType, durationMinutes);
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

  // Legacy methods - mantener compatibilidad pero mostrar advertencias
  const addStation = (_station: Omit<Station, 'id'>) => {
    console.warn('addStation: This method is not implemented with real API. Use admin panel instead.');
  };

  const updateStation = (_id: string, _updates: Partial<Station>) => {
    console.warn('updateStation: This method is not implemented with real API. Use admin panel instead.');
  };

  const deleteStation = (_id: string) => {
    console.warn('deleteStation: This method is not implemented with real API. Use admin panel instead.');
  };

  const addVehicle = (_vehicle: Omit<Vehicle, 'id'>) => {
    console.warn('addVehicle: This method is not implemented with real API. Use admin panel instead.');
  };

  const updateVehicle = (_id: string, _updates: Partial<Vehicle>) => {
    console.warn('updateVehicle: This method is not implemented with real API. Use admin panel instead.');
  };

  const deleteVehicle = (_id: string) => {
    console.warn('deleteVehicle: This method is not implemented with real API. Use admin panel instead.');
  };

  const contextValue: DataContextType = {
    // Stations
    stations,
    stationsLoading: stationsHook.loading,
    stationsError: stationsHook.error,
    refreshStations: stationsHook.refreshStations,
    getNearbyStations: async (lat, lng, radius) => {
      const nearbyStations = await stationsHook.getNearbyStations(lat, lng, radius);
      return nearbyStations.map(transformStation);
    },
    
    // Vehicles
    getVehiclesByStation,
    
    // Loans
    loans,
    loansLoading: loansHook.loading,
    loansError: loansHook.error,
    refreshLoans: loansHook.refreshLoans,
    createLoan,
    completeLoan,
    cancelLoan,
    extendLoan,
    calculateFare,
    
    // Utilities
    getActiveLoans,
    getUserLoans,
    getActiveLoan,
    
    // Legacy methods
    addStation,
    updateStation,
    deleteStation,
    addVehicle,
    updateVehicle,
    deleteVehicle,
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