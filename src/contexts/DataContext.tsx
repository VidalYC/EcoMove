import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Station {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  capacity: number;
  isActive: boolean;
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
  stations: Station[];
  vehicles: Vehicle[];
  loans: Loan[];
  addStation: (station: Omit<Station, 'id'>) => void;
  updateStation: (id: string, updates: Partial<Station>) => void;
  deleteStation: (id: string) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  createLoan: (loan: Omit<Loan, 'id' | 'startTime' | 'cost'>) => string;
  completeLoan: (loanId: string, destinationStationId: string) => void;
  getVehiclesByStation: (stationId: string) => Vehicle[];
  getActiveLoans: () => Loan[];
  getUserLoans: (userId: string) => Loan[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock data
const initialStations: Station[] = [
  {
    id: '1',
    name: 'Estación Centro',
    address: 'Plaza Principal #123',
    coordinates: { lat: 4.6097, lng: -74.0817 },
    capacity: 20,
    isActive: true
  },
  {
    id: '2',
    name: 'Estación Universidad',
    address: 'Av. Universidad #456',
    coordinates: { lat: 4.6288, lng: -74.0647 },
    capacity: 15,
    isActive: true
  },
  {
    id: '3',
    name: 'Estación Parque',
    address: 'Parque Central #789',
    coordinates: { lat: 4.5981, lng: -74.0758 },
    capacity: 25,
    isActive: true
  }
];

const initialVehicles: Vehicle[] = [
  // Station 1 vehicles
  { id: '1', type: 'bicycle', model: 'EcoBike Pro', stationId: '1', status: 'available' },
  { id: '2', type: 'bicycle', model: 'EcoBike Pro', stationId: '1', status: 'available' },
  { id: '3', type: 'scooter', model: 'EcoScoot X1', stationId: '1', status: 'available', batteryLevel: 85 },
  { id: '4', type: 'electric-scooter', model: 'EcoElectric Pro', stationId: '1', status: 'available', batteryLevel: 92 },
  
  // Station 2 vehicles
  { id: '5', type: 'bicycle', model: 'EcoBike Lite', stationId: '2', status: 'available' },
  { id: '6', type: 'scooter', model: 'EcoScoot X2', stationId: '2', status: 'available', batteryLevel: 78 },
  { id: '7', type: 'electric-scooter', model: 'EcoElectric Pro', stationId: '2', status: 'available', batteryLevel: 88 },
  
  // Station 3 vehicles
  { id: '8', type: 'bicycle', model: 'EcoBike Pro', stationId: '3', status: 'available' },
  { id: '9', type: 'bicycle', model: 'EcoBike Lite', stationId: '3', status: 'available' },
  { id: '10', type: 'scooter', model: 'EcoScoot X1', stationId: '3', status: 'available', batteryLevel: 94 }
];

const initialLoans: Loan[] = [];

export function DataProvider({ children }: { children: ReactNode }) {
  const [stations, setStations] = useState<Station[]>(initialStations);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [loans, setLoans] = useState<Loan[]>(initialLoans);

  const addStation = (station: Omit<Station, 'id'>) => {
    const newStation: Station = {
      ...station,
      id: Date.now().toString()
    };
    setStations(prev => [...prev, newStation]);
  };

  const updateStation = (id: string, updates: Partial<Station>) => {
    setStations(prev => prev.map(station => 
      station.id === id ? { ...station, ...updates } : station
    ));
  };

  const deleteStation = (id: string) => {
    setStations(prev => prev.filter(station => station.id !== id));
    // Move vehicles from deleted station to null
    setVehicles(prev => prev.map(vehicle =>
      vehicle.stationId === id ? { ...vehicle, stationId: null, status: 'maintenance' } : vehicle
    ));
  };

  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: Date.now().toString()
    };
    setVehicles(prev => [...prev, newVehicle]);
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(vehicle =>
      vehicle.id === id ? { ...vehicle, ...updates } : vehicle
    ));
  };

  const deleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
  };

  const calculateCost = (vehicleType: string, duration: number): number => {
    const rates = {
      bicycle: 0.5, // $0.5 per minute
      scooter: 0.8, // $0.8 per minute
      'electric-scooter': 1.2 // $1.2 per minute
    };
    return Math.round((rates[vehicleType as keyof typeof rates] || 0.5) * duration * 100) / 100;
  };

  const createLoan = (loan: Omit<Loan, 'id' | 'startTime' | 'cost'>): string => {
    const vehicle = vehicles.find(v => v.id === loan.vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const newLoan: Loan = {
      ...loan,
      id: Date.now().toString(),
      startTime: new Date(),
      cost: 0,
      status: 'active'
    };

    setLoans(prev => [...prev, newLoan]);
    
    // Update vehicle status
    updateVehicle(loan.vehicleId, { status: 'in-use', stationId: null });
    
    return newLoan.id;
  };

  const completeLoan = (loanId: string, destinationStationId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const endTime = new Date();
    const duration = Math.ceil((endTime.getTime() - loan.startTime.getTime()) / (1000 * 60)); // minutes
    const vehicle = vehicles.find(v => v.id === loan.vehicleId);
    const cost = calculateCost(vehicle?.type || 'bicycle', duration);

    setLoans(prev => prev.map(l =>
      l.id === loanId
        ? { ...l, endTime, destinationStationId, duration, cost, status: 'completed' }
        : l
    ));

    // Return vehicle to station
    updateVehicle(loan.vehicleId, { status: 'available', stationId: destinationStationId });
  };

  const getVehiclesByStation = (stationId: string): Vehicle[] => {
    return vehicles.filter(v => v.stationId === stationId && v.status === 'available');
  };

  const getActiveLoans = (): Loan[] => {
    return loans.filter(l => l.status === 'active');
  };

  const getUserLoans = (userId: string): Loan[] => {
    return loans.filter(l => l.userId === userId).sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  };

  return (
    <DataContext.Provider value={{
      stations,
      vehicles,
      loans,
      addStation,
      updateStation,
      deleteStation,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      createLoan,
      completeLoan,
      getVehiclesByStation,
      getActiveLoans,
      getUserLoans
    }}>
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