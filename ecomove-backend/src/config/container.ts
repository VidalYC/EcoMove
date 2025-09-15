import { Pool } from 'pg';
import { DatabaseConfig } from './database.config';

// Repositories - USUARIOS (existentes)
import { UserRepository } from '../core/domain/repositories/user.repository';
import { PostgreSQLUserRepository } from '../infrastructure/persistence/postgresql/user.repository';

// Services - USUARIOS (existentes)
import { PasswordService } from '../core/domain/services/password.service';
import { BcryptPasswordService } from '../infrastructure/services/bcrypt-password.service';
import { TokenService } from '../core/domain/services/token.service';
import { JwtTokenService } from '../infrastructure/services/jwt-token.service';

// Use Cases - USUARIOS (existentes)
import { RegisterUserUseCase } from '../core/use-cases/user/register-user.use-case';
import { LoginUserUseCase } from '../core/use-cases/user/login-user.use-case';
import { GetUserProfileUseCase } from '../core/use-cases/user/get-user-profile.use-case';
import { UpdateUserProfileUseCase } from '../core/use-cases/user/update-user-profile.use-case';
import { ChangePasswordUseCase } from '../core/use-cases/user/change-password.use-case';
import { GetAllUsersUseCase } from '../core/use-cases/user/get-all-users.use-case';
import { SearchUsersUseCase } from '../core/use-cases/user/search-users.use-case';
import { GetUserStatsUseCase } from '../core/use-cases/user/get-user-stats.use-case';
import { GetUserByIdUseCase } from '../core/use-cases/user/get-user-by-id.use-case';
import { ActivateUserUseCase } from '../core/use-cases/user/activate-user.use-case';
import { DeactivateUserUseCase } from '../core/use-cases/user/deactivate-user.use-case';
import { UpdateUserByIdUseCase } from '../core/use-cases/user/update-user-by-id.use-case';

// Controllers - USUARIOS (existentes)
import { AuthController } from '../presentation/http/controllers/auth.controller';
import { UserProfileController } from '../presentation/http/controllers/user-profile.controller';
import { UserAdminController } from '../presentation/http/controllers/user-admin.controller';

// Middleware - USUARIOS (existente)
import { AuthenticationMiddleware } from '../presentation/http/middleware/authentication.middleware';

// ====================================================================
// NUEVAS IMPORTACIONES - TRANSPORTES
// ====================================================================

// Repositories - TRANSPORTES (nuevos)
import { TransportRepository } from '../core/domain/entities/transport.entity';
import { PostgreSQLTransportRepository } from '../infrastructure/database/repositories/postgresql-transport.repository';

// Use Cases - TRANSPORTES (nuevos)
import {
  CreateBicycleUseCase,
  CreateElectricScooterUseCase,
  GetTransportUseCase,
  GetAllTransportsUseCase,
  UpdateTransportUseCase,
  ChangeTransportStatusUseCase,
  MoveTransportToStationUseCase,
  FindAvailableTransportsUseCase,
  UpdateBatteryLevelUseCase,
  GetTransportStatsUseCase,
  DeleteTransportUseCase
} from '../core/use-cases/transport';

// Controllers - TRANSPORTES (nuevos)
import { TransportController } from '../presentation/http/controllers/transport.controller';

// Repositories - ESTACIONES (nuevos)
import { StationRepository } from '../core/domain/entities/station.entity';
import { PostgreSQLStationRepository } from '../infrastructure/database/repositories/postgresql-station.repository';

// Use Cases - ESTACIONES (nuevos)
import {
  CreateStationUseCase,
  GetStationUseCase,
  GetAllStationsUseCase,
  UpdateStationUseCase,
  FindNearbyStationsUseCase,
  GetStationAvailabilityUseCase,
  CalculateRouteUseCase,
  GetStationStatsUseCase,
  FindStationsWithTransportsUseCase,
  ActivateStationUseCase,
  DeactivateStationUseCase,
  GetOccupancyRankingUseCase
} from '../core/use-cases/station';

// Controllers - ESTACIONES (nuevos)
import { StationController } from '../presentation/http/controllers/station.controller';

/**
 * Contenedor de inyección de dependencias
 * Responsabilidad única: Gestionar la creación e inyección de dependencias
 */
export class DIContainer {
  private static instance: DIContainer;
  private pool: Pool;

  // ====================================================================
  // USUARIOS - EXISTENTES (sin cambios)
  // ====================================================================
  
  // Repositories
  private userRepository!: UserRepository;

  // Services
  private passwordService!: PasswordService;
  private tokenService!: TokenService;

  // Use Cases
  private registerUserUseCase!: RegisterUserUseCase;
  private loginUserUseCase!: LoginUserUseCase;
  private getUserProfileUseCase!: GetUserProfileUseCase;
  private updateUserProfileUseCase!: UpdateUserProfileUseCase;
  private changePasswordUseCase!: ChangePasswordUseCase;
  private getAllUsersUseCase!: GetAllUsersUseCase;
  private searchUsersUseCase!: SearchUsersUseCase;
  private getUserStatsUseCase!: GetUserStatsUseCase;
  private getUserByIdUseCase!: GetUserByIdUseCase;
  private activateUserUseCase!: ActivateUserUseCase;
  private deactivateUserUseCase!: DeactivateUserUseCase;
  private updateUserByIdUseCase!: UpdateUserByIdUseCase;

  // Controllers - Especializados
  private authController!: AuthController;
  private userProfileController!: UserProfileController;
  private userAdminController!: UserAdminController;

  // Middleware
  private authenticationMiddleware!: AuthenticationMiddleware;

  // ====================================================================
  // TRANSPORTES - NUEVOS
  // ====================================================================
  
  // Repositories
  private transportRepository!: TransportRepository;

  // Use Cases
  private createBicycleUseCase!: CreateBicycleUseCase;
  private createElectricScooterUseCase!: CreateElectricScooterUseCase;
  private getTransportUseCase!: GetTransportUseCase;
  private getAllTransportsUseCase!: GetAllTransportsUseCase;
  private updateTransportUseCase!: UpdateTransportUseCase;
  private changeTransportStatusUseCase!: ChangeTransportStatusUseCase;
  private moveTransportToStationUseCase!: MoveTransportToStationUseCase;
  private findAvailableTransportsUseCase!: FindAvailableTransportsUseCase;
  private updateBatteryLevelUseCase!: UpdateBatteryLevelUseCase;
  private getTransportStatsUseCase!: GetTransportStatsUseCase;
  private deleteTransportUseCase!: DeleteTransportUseCase;



  // Controllers
  private transportController!: TransportController;

  private stationRepository!: StationRepository;

// Use Cases
private createStationUseCase!: CreateStationUseCase;
private getStationUseCase!: GetStationUseCase;
private getAllStationsUseCase!: GetAllStationsUseCase;
private updateStationUseCase!: UpdateStationUseCase;
private findNearbyStationsUseCase!: FindNearbyStationsUseCase;
private getStationAvailabilityUseCase!: GetStationAvailabilityUseCase;
private calculateRouteUseCase!: CalculateRouteUseCase;
private getStationStatsUseCase!: GetStationStatsUseCase;
private findStationsWithTransportsUseCase!: FindStationsWithTransportsUseCase;
private activateStationUseCase!: ActivateStationUseCase;
private deactivateStationUseCase!: DeactivateStationUseCase;
private getOccupancyRankingUseCase!: GetOccupancyRankingUseCase;

// Controllers
private stationController!: StationController;

  private constructor() {
    this.pool = DatabaseConfig.createPool();
    this.initializeDependencies();
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  private initializeDependencies(): void {
    this.initializeRepositories();
    this.initializeServices();
    this.initializeUseCases();
    this.initializeControllers();
    this.initializeMiddleware();
  }

  private initializeRepositories(): void {
    // USUARIOS (existentes)
    this.userRepository = new PostgreSQLUserRepository(this.pool);
    
    // TRANSPORTES (nuevos)
    this.transportRepository = new PostgreSQLTransportRepository(this.pool);

    // ESTACIONES (nuevos)
    this.stationRepository = new PostgreSQLStationRepository(this.pool);
  }

  private initializeServices(): void {
    // USUARIOS (existentes - sin cambios)
    this.passwordService = new BcryptPasswordService();
    this.tokenService = new JwtTokenService(
      process.env.JWT_SECRET || 'your-secret-key',
      process.env.JWT_EXPIRES_IN || '24h'
    );
  }

  private initializeUseCases(): void {
    // ====================================================================
    // USUARIOS - Use Cases (existentes - sin cambios)
    // ====================================================================
    
    // Use Cases de autenticación
    this.registerUserUseCase = new RegisterUserUseCase(
      this.userRepository,
      this.passwordService,
      this.tokenService
    );

    this.loginUserUseCase = new LoginUserUseCase(
      this.userRepository,
      this.passwordService,
      this.tokenService
    );

    // Use Cases de perfil
    this.getUserProfileUseCase = new GetUserProfileUseCase(this.userRepository);
    this.updateUserProfileUseCase = new UpdateUserProfileUseCase(this.userRepository);
    this.changePasswordUseCase = new ChangePasswordUseCase(
      this.userRepository,
      this.passwordService
    );

    // Use Cases de administración
    this.getAllUsersUseCase = new GetAllUsersUseCase(this.userRepository);
    this.searchUsersUseCase = new SearchUsersUseCase(this.userRepository);
    this.getUserStatsUseCase = new GetUserStatsUseCase(this.userRepository);
    this.getUserByIdUseCase = new GetUserByIdUseCase(this.userRepository);
    this.activateUserUseCase = new ActivateUserUseCase(this.userRepository);
    this.deactivateUserUseCase = new DeactivateUserUseCase(this.userRepository);
    this.updateUserByIdUseCase = new UpdateUserByIdUseCase(this.userRepository);

    // ====================================================================
    // TRANSPORTES - Use Cases (nuevos)
    // ====================================================================
    
    this.createBicycleUseCase = new CreateBicycleUseCase(this.transportRepository);
    this.createElectricScooterUseCase = new CreateElectricScooterUseCase(this.transportRepository);
    this.getTransportUseCase = new GetTransportUseCase(this.transportRepository);
    this.getAllTransportsUseCase = new GetAllTransportsUseCase(this.transportRepository);
    this.updateTransportUseCase = new UpdateTransportUseCase(this.transportRepository);
    this.changeTransportStatusUseCase = new ChangeTransportStatusUseCase(this.transportRepository);
    this.moveTransportToStationUseCase = new MoveTransportToStationUseCase(this.transportRepository);
    this.findAvailableTransportsUseCase = new FindAvailableTransportsUseCase(this.transportRepository);
    this.updateBatteryLevelUseCase = new UpdateBatteryLevelUseCase(this.transportRepository);
    this.getTransportStatsUseCase = new GetTransportStatsUseCase(this.transportRepository);
    this.deleteTransportUseCase = new DeleteTransportUseCase(this.transportRepository);

        
    // ====================================================================
    // ESTACIONES - Use Cases (nuevos)
    // ====================================================================

    this.createStationUseCase = new CreateStationUseCase(this.stationRepository);
    this.getStationUseCase = new GetStationUseCase(this.stationRepository);
    this.getAllStationsUseCase = new GetAllStationsUseCase(this.stationRepository);
    this.updateStationUseCase = new UpdateStationUseCase(this.stationRepository);
    this.findNearbyStationsUseCase = new FindNearbyStationsUseCase(this.stationRepository);
    this.getStationAvailabilityUseCase = new GetStationAvailabilityUseCase(this.stationRepository);
    this.calculateRouteUseCase = new CalculateRouteUseCase(this.stationRepository);
    this.getStationStatsUseCase = new GetStationStatsUseCase(this.stationRepository);
    this.findStationsWithTransportsUseCase = new FindStationsWithTransportsUseCase(this.stationRepository);
    this.activateStationUseCase = new ActivateStationUseCase(this.stationRepository);
    this.deactivateStationUseCase = new DeactivateStationUseCase(this.stationRepository);
    this.getOccupancyRankingUseCase = new GetOccupancyRankingUseCase(this.stationRepository);
  }

  private initializeControllers(): void {
    // ====================================================================
    // USUARIOS - Controllers (existentes - sin cambios)
    // ====================================================================
    
    // Controlador de autenticación
    this.authController = new AuthController(
      this.registerUserUseCase,
      this.loginUserUseCase
    );

    // Controlador de perfil
    this.userProfileController = new UserProfileController(
      this.getUserProfileUseCase,
      this.updateUserProfileUseCase,
      this.changePasswordUseCase
    );

    // Controlador de administración
    this.userAdminController = new UserAdminController(
      this.getAllUsersUseCase,
      this.searchUsersUseCase,
      this.getUserStatsUseCase,
      this.getUserByIdUseCase,
      this.activateUserUseCase,
      this.deactivateUserUseCase,
      this.updateUserByIdUseCase
    );

    // ====================================================================
    // TRANSPORTES - Controllers (nuevos)
    // ====================================================================
    
    this.transportController = new TransportController(
      this.createBicycleUseCase,
      this.createElectricScooterUseCase,
      this.getTransportUseCase,
      this.getAllTransportsUseCase,
      this.updateTransportUseCase,
      this.changeTransportStatusUseCase,
      this.moveTransportToStationUseCase,
      this.findAvailableTransportsUseCase,
      this.updateBatteryLevelUseCase,
      this.getTransportStatsUseCase,
      this.deleteTransportUseCase
    );

        
    // ====================================================================
    // ESTACIONES - Controllers (nuevos)
    // ====================================================================

    this.stationController = new StationController(
      this.createStationUseCase,
      this.getStationUseCase,
      this.getAllStationsUseCase,
      this.updateStationUseCase,
      this.findNearbyStationsUseCase,
      this.getStationAvailabilityUseCase,
      this.calculateRouteUseCase,
      this.getStationStatsUseCase,
      this.findStationsWithTransportsUseCase,
      this.activateStationUseCase,
      this.deactivateStationUseCase,
      this.getOccupancyRankingUseCase
    );
  }

  private initializeMiddleware(): void {
    this.authenticationMiddleware = new AuthenticationMiddleware(
      this.tokenService,
      this.userRepository
    );
  }

  // ========== GETTERS - USUARIOS (existentes - sin cambios) ==========

  // Database
  getPool(): Pool {
    return this.pool;
  }

  // Repositories
  getUserRepository(): UserRepository {
    return this.userRepository;
  }

  // Services
  getPasswordService(): PasswordService {
    return this.passwordService;
  }

  getTokenService(): TokenService {
    return this.tokenService;
  }

  // Controllers especializados
  getAuthController(): AuthController {
    return this.authController;
  }

  getUserProfileController(): UserProfileController {
    return this.userProfileController;
  }

  getUserAdminController(): UserAdminController {
    return this.userAdminController;
  }

  // Middleware
  getAuthMiddleware(): AuthenticationMiddleware {
    return this.authenticationMiddleware;
  }

  // ========== GETTERS - TRANSPORTES (nuevos) ==========

  // Repositories
  getTransportRepository(): TransportRepository {
    return this.transportRepository;
  }

  // Controllers
  getTransportController(): TransportController {
    return this.transportController;
  }

  // Repositories
  getStationRepository(): StationRepository {
    return this.stationRepository;
  }

  // Controllers
  getStationController(): StationController {
    return this.stationController;
  }

  // ========== UTILIDADES (existentes - sin cambios) ==========

    async healthCheck(): Promise<{
    status: string;
    dependencies: Record<string, boolean>;
  }> {
    try {
      await this.pool.query('SELECT 1');
      
      return {
        status: 'healthy',
        dependencies: {
          database: true,
          userRepositories: !!this.userRepository,
          transportRepositories: !!this.transportRepository,
          stationRepositories: !!this.stationRepository,
          services: !!this.passwordService && !!this.tokenService,
          userControllers: !!this.authController && !!this.userProfileController && !!this.userAdminController,
          transportControllers: !!this.transportController,
          stationControllers: !!this.stationController,
          middleware: !!this.authenticationMiddleware
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        dependencies: {
          database: false,
          userRepositories: !!this.userRepository,
          transportRepositories: !!this.transportRepository,
          stationRepositories: !!this.stationRepository,
          services: !!this.passwordService && !!this.tokenService,
          userControllers: !!this.authController && !!this.userProfileController && !!this.userAdminController,
          transportControllers: !!this.transportController,
          stationControllers: !!this.stationController,
          middleware: !!this.authenticationMiddleware
        }
      };
    }
  }
}