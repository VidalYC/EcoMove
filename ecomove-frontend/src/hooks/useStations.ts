import { useState, useEffect } from 'react';
import { apiService, Station, Vehicle } from '../services/api.service';

interface UseStationsReturn {
  stations: Station[];
  loading: boolean;
  error: string | null;
  refreshStations: () => Promise<void>;
  getNearbyStations: (lat: number, lng: number, radius?: number) => Promise<Station[]>;
  getStationAvailability: (stationId: string) => Promise<Vehicle[]>;
}

export function useStations(): UseStationsReturn {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStations = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getStationsWithTransports();
      
      if (response.success && response.data) {
        setStations(response.data);
      } else {
        setError(response.message || 'Failed to load stations');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load stations');
    } finally {
      setLoading(false);
    }
  };

  const getNearbyStations = async (lat: number, lng: number, radius = 1000): Promise<Station[]> => {
    try {
      const response = await apiService.getNearbyStations(lat, lng, radius);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get nearby stations');
      }
    } catch (error: any) {
      console.error('Error getting nearby stations:', error);
      return [];
    }
  };

  const getStationAvailability = async (stationId: string): Promise<Vehicle[]> => {
    try {
      const response = await apiService.getStationAvailability(stationId);
      
      if (response.success && response.data) {
        return response.data.available;
      } else {
        throw new Error(response.message || 'Failed to get station availability');
      }
    } catch (error: any) {
      console.error('Error getting station availability:', error);
      return [];
    }
  };

  useEffect(() => {
    refreshStations();
  }, []);

  return {
    stations,
    loading,
    error,
    refreshStations,
    getNearbyStations,
    getStationAvailability,
  };
}