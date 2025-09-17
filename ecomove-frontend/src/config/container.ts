// ⚙️ DEPENDENCY INJECTION CONTAINER
import { apiClient } from '../infrastructure/http/ApiClient';
import { HttpAuthRepository } from '../infrastructure/repositories/HttpAuthRepository';
import { HttpUserRepository } from '../infrastructure/repositories/HttpUserRepository';
import { HttpTransportRepository } from '../infrastructure/repositories/HttpTransportRepository';
import { HttpStationRepository } from '../infrastructure/repositories/HttpStationRepository';
import { HttpLoanRepository } from '../infrastructure/repositories/HttpLoanRepository';

// Repository instances
export const authRepository = new HttpAuthRepository(apiClient);
export const userRepository = new HttpUserRepository(apiClient);
export const transportRepository = new HttpTransportRepository(apiClient);
export const stationRepository = new HttpStationRepository(apiClient);
export const loanRepository = new HttpLoanRepository(apiClient);

// Container object for easy access
export const container = {
  repositories: {
    auth: authRepository,
    user: userRepository,
    transport: transportRepository,
    station: stationRepository,
    loan: loanRepository,
  },
  services: {
    apiClient,
  },
} as const;

export default container;