import { TransportStatus, TransportType } from '../../shared/enums/transport.enums';

export interface CreateBicycleDto {
  model: string;
  hourlyRate: number;
  gearCount: number;
  brakeType: string;
  stationId?: number;
  acquisitionDate?: string;
}

export interface CreateElectricScooterDto {
  model: string;
  hourlyRate: number;
  maxSpeed: number;
  range: number;
  batteryLevel?: number;
  stationId?: number;
  acquisitionDate?: string;
}

export interface UpdateTransportDto {
  model?: string;
  status?: TransportStatus;
  stationId?: number;
  hourlyRate?: number;
}

export interface TransportResponseDto {
  id: number;
  type: TransportType;
  model: string;
  status: TransportStatus;
  currentStationId: number | null;
  hourlyRate: number;
  acquisitionDate: string;
  specifications?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}