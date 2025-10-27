import { Pool } from 'pg';
import { DatabaseConfig } from './database.config';
import { LoggerService, WinstonLoggerService } from '../infrastructure/services/winston-logger.service';
import { RequestLoggerMiddleware } from '../presentation/http/middleware/request-logger.middleware';
import { HealthCheckUseCase } from '../core/use-cases/system/health-check.use-case';
import { CacheService, CacheStats, MemoryCacheService } from '../infrastructure/services/memory-cache.service';
import { CachedTransportRepository } from '../infrastructure/database/repositories/cached-transport.repository';
import { CachedStationRepository } from '../infrastructure/database/repositories/cached-station.repository';

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

// Repositories - TRANSPORTES (existentes)
import { TransportRepository } from '../core/domain/repositories/transport.repository';
import { PostgreSQLTransportRepository } from '../infrastructure/database/repositories/postgresql-transport.repository';

// Use Cases - TRANSPORTES (existentes)
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

// Controllers - TRANSPORTES (existentes)
import { TransportController } from '../presentation/http/controllers/transport.controller';

// Repositories - ESTACIONES (existentes)
import { StationRepository } from '../core/domain/repositories/station.repository';
import { PostgreSQLStationRepository } from '../infrastructure/database/repositories/postgresql-station.repository';

// Use Cases - ESTACIONES (existentes)
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

// Controllers - ESTACIONES (existentes)
import { StationController } from '../presentation/http/controllers/station.controller';

// Repositories - PRÉSTAMOS (nuevos)
import { LoanRepository } from '../core/domain/repositories/loan.repository';
import { PostgreSQLLoanRepository } from '../infrastructure/database/repositories/postgresql-loan.repository';
import { PricingService } from '../core/domain/services/enhanced-pricing.service';
import { ConsolidatedPricingService } from '../infrastructure/services/consolidated-pricing.service';

// Services - PRÉSTAMOS (nuevos)
import { PaymentService } from '../core/domain/services/payment.service';
import { StripePaymentService } from '../infrastructure/services/stripe-payment.service';
import { NotificationService } from '../core/domain/services/notification.service';
import { EmailNotificationService } from '../infrastructure/services/email-notification.service';

// Use Cases - PRÉSTAMOS (nuevos)
import {
  CreateLoanUseCase,
  CompleteLoanUseCase,
  CancelLoanUseCase,
  ExtendLoanUseCase,
  GetLoanUseCase,
  GetLoanWithDetailsUseCase,
  GetAllLoansUseCase,
  GetActiveLoansUseCase,
  GetUserLoanHistoryUseCase,
  GetLoanStatsUseCase,
  GetPeriodReportUseCase,
  CalculateFareUseCase
} from '../core/use-cases/loan';

// Controllers - PRÉSTAMOS (nuevos)
import { LoanController } from '../presentation/http/controllers/loan.controller';

/**
 * Contenedor de inyección de dependencias
 * Responsabilidad única: Gestionar la creación e inyección de dependencias
 */
export class DIContainer {
  private static instance: DIContainer;
  private pool: Pool;
  private cache!: CacheService;

  private healthCheckUseCase!: HealthCheckUseCase;

  // Repositories
  private userRepository!: UserRepository;
  private transportRepository!: TransportRepository;
  private stationRepository!: StationRepository;
  private loanRepository!: LoanRepository;

  // Services
  private passwordService!: PasswordService;
  private tokenService!: TokenService;
  private logger!: LoggerService;
  private requestLoggerMiddleware!: RequestLoggerMiddleware;
  private paymentService!: PaymentService;
  private notificationService!: NotificationService;
  private pricingService!: PricingService;

  // Use Cases - USUARIOS
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

  // Use Cases - TRANSPORTES
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

  // Use Cases - ESTACIONES
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

  // Use Cases - PRÉSTAMOS
  private createLoanUseCase!: CreateLoanUseCase;
  private completeLoanUseCase!: CompleteLoanUseCase;
  private cancelLoanUseCase!: CancelLoanUseCase;
  private extendLoanUseCase!: ExtendLoanUseCase;
  private getLoanUseCase!: GetLoanUseCase;
  private getLoanWithDetailsUseCase!: GetLoanWithDetailsUseCase;
  private getAllLoansUseCase!: GetAllLoansUseCase;
  private getActiveLoansUseCase!: GetActiveLoansUseCase;
  private getUserLoanHistoryUseCase!: GetUserLoanHistoryUseCase;
  private getLoanStatsUseCase!: GetLoanStatsUseCase;
  private getPeriodReportUseCase!: GetPeriodReportUseCase;
  private calculateFareUseCase!: CalculateFareUseCase;

  // Controllers
  private authController!: AuthController;
  private userProfileController!: UserProfileController;
  private userAdminController!: UserAdminController;
  private transportController!: TransportController;
  private stationController!: StationController;
  private loanController!: LoanController;

  // Middleware
  private authenticationMiddleware!: AuthenticationMiddleware;

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
    this.initializeServices();
    this.initializeRepositories();
    this.initializeUseCases();
    this.initializeControllers();
    this.initializeMiddleware();
  }

  private initializeServices(): void {
    console.log('🏗️ Initializing services...');
    this.logger = new WinstonLoggerService();
    this.cache = new MemoryCacheService(this.logger);
    console.log('✅ Cache initialized:', !!this.cache);
    
    this.passwordService = new BcryptPasswordService();
    this.tokenService = new JwtTokenService(
      process.env.JWT_SECRET || 'your-secret-key',
      process.env.JWT_EXPIRES_IN || '24h'
    );

    // ✅ SERVICIOS DE PRÉSTAMOS CON NOTIFICACIONES
    this.paymentService = new StripePaymentService(
      process.env.STRIPE_SECRET_KEY || 'your-stripe-secret-key'
    );
    this.notificationService = new EmailNotificationService();
    this.pricingService = new ConsolidatedPricingService();
    
    console.log('✅ All services initialized');
  }

  private initializeRepositories(): void {
    console.log('🏗️ Initializing repositories...');
    
    // USUARIOS
    this.userRepository = new PostgreSQLUserRepository(this.pool);
    
    // TRANSPORTES
    const baseTransportRepository = new PostgreSQLTransportRepository(this.pool);
    this.transportRepository = new CachedTransportRepository(
      baseTransportRepository,
      this.cache,
      this.logger
    );

    // ESTACIONES
    const baseStationRepository = new PostgreSQLStationRepository(this.pool);
    this.stationRepository = new CachedStationRepository(
      baseStationRepository,
      this.cache,
      this.logger
    );

    // PRÉSTAMOS
    this.loanRepository = new PostgreSQLLoanRepository(this.pool);

    console.log('✅ All repositories initialized');
  }

  private initializeUseCases(): void {
    console.log('🏗️ Initializing use cases...');
    
    // Health Check
    this.healthCheckUseCase = new HealthCheckUseCase(
      this.pool,
      this.logger
    );

    // ====================================================================
    // USUARIOS - Use Cases
    // ====================================================================
    this.registerUserUseCase = new RegisterUserUseCase(
      this.userRepository,
      this.passwordService,
      this.tokenService,
      this.logger 
    );

    this.loginUserUseCase = new LoginUserUseCase(
      this.userRepository,
      this.passwordService,
      this.tokenService,
      this.logger
    );

    this.getUserProfileUseCase = new GetUserProfileUseCase(this.userRepository);
    
    // ✅ CON NOTIFICACIÓN DE ACTUALIZACIÓN DE PERFIL
    this.updateUserProfileUseCase = new UpdateUserProfileUseCase(
      this.userRepository,
      this.notificationService
    );
    
    this.changePasswordUseCase = new ChangePasswordUseCase(
      this.userRepository,
      this.passwordService
    );

    this.getAllUsersUseCase = new GetAllUsersUseCase(this.userRepository);
    this.searchUsersUseCase = new SearchUsersUseCase(this.userRepository);
    this.getUserStatsUseCase = new GetUserStatsUseCase(this.userRepository);
    this.getUserByIdUseCase = new GetUserByIdUseCase(this.userRepository);
    this.activateUserUseCase = new ActivateUserUseCase(this.userRepository);
    this.deactivateUserUseCase = new DeactivateUserUseCase(this.userRepository);
    this.updateUserByIdUseCase = new UpdateUserByIdUseCase(this.userRepository);

    // ====================================================================
    // TRANSPORTES - Use Cases
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
    // ESTACIONES - Use Cases
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

    // ====================================================================
    // PRÉSTAMOS - Use Cases CON NOTIFICACIONES ✅ ACTUALIZADO
    // ====================================================================

    // ✅ CreateLoan CON NOTIFICACIÓN DE PRÉSTAMO INICIADO
    this.createLoanUseCase = new CreateLoanUseCase(
      this.loanRepository,
      this.userRepository,
      this.transportRepository,
      this.stationRepository,
      this.notificationService,  // ← Agregado
      this.logger
    );

    // ✅ CompleteLoan CON NOTIFICACIONES DE PRÉSTAMO FINALIZADO Y PAGO
    this.completeLoanUseCase = new CompleteLoanUseCase(
      this.loanRepository,
      this.transportRepository,
      this.stationRepository,
      this.notificationService,  // ← Agregado
      this.paymentService,        // ← Agregado
      this.userRepository         // ← Agregado
    );

    // ✅ CancelLoan CON NOTIFICACIÓN DE CANCELACIÓN
    this.cancelLoanUseCase = new CancelLoanUseCase(
      this.loanRepository,
      this.transportRepository,
      this.notificationService,  // ← Agregado
      this.userRepository         // ← Agregado
    );

    // Los demás use cases de préstamos siguen igual
    this.extendLoanUseCase = new ExtendLoanUseCase(this.loanRepository);
    this.getLoanUseCase = new GetLoanUseCase(this.loanRepository);
    this.getLoanWithDetailsUseCase = new GetLoanWithDetailsUseCase(this.loanRepository);
    this.getAllLoansUseCase = new GetAllLoansUseCase(this.loanRepository);
    this.getActiveLoansUseCase = new GetActiveLoansUseCase(this.loanRepository);
    this.getUserLoanHistoryUseCase = new GetUserLoanHistoryUseCase(
      this.loanRepository,
      this.userRepository
    );
    this.getLoanStatsUseCase = new GetLoanStatsUseCase(this.loanRepository);
    this.getPeriodReportUseCase = new GetPeriodReportUseCase(this.loanRepository);
    this.calculateFareUseCase = new CalculateFareUseCase(
      this.transportRepository,
      this.pricingService
    );
    
    console.log('✅ All use cases initialized');
  }

  private initializeControllers(): void {
    console.log('🏗️ Initializing controllers...');
    
    // USUARIOS
    this.authController = new AuthController(
      this.registerUserUseCase,
      this.loginUserUseCase
    );

    this.userProfileController = new UserProfileController(
      this.getUserProfileUseCase,
      this.updateUserProfileUseCase,
      this.changePasswordUseCase
    );

    this.userAdminController = new UserAdminController(
      this.getAllUsersUseCase,
      this.searchUsersUseCase,
      this.getUserStatsUseCase,
      this.getUserByIdUseCase,
      this.activateUserUseCase,
      this.deactivateUserUseCase,
      this.updateUserByIdUseCase
    );

    // TRANSPORTES
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
        
    // ESTACIONES
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

    // PRÉSTAMOS
    this.loanController = new LoanController(
      this.createLoanUseCase,
      this.completeLoanUseCase,
      this.cancelLoanUseCase,
      this.extendLoanUseCase,
      this.getLoanUseCase,
      this.getLoanWithDetailsUseCase,
      this.getAllLoansUseCase,
      this.getActiveLoansUseCase,
      this.getUserLoanHistoryUseCase,
      this.getLoanStatsUseCase,
      this.getPeriodReportUseCase,
      this.calculateFareUseCase,
    );
    
    console.log('✅ All controllers initialized');
  }

  private initializeMiddleware(): void {
    this.requestLoggerMiddleware = new RequestLoggerMiddleware(this.logger);
    
    const { ErrorHandlerMiddleware } = require('../presentation/http/middleware/error-handler.middleware');
    ErrorHandlerMiddleware.setLogger(this.logger);
    
    this.authenticationMiddleware = new AuthenticationMiddleware(
      this.tokenService,
      this.userRepository
    );
  }

  // ========== GETTERS ==========

  getLogger(): LoggerService { return this.logger; }
  getRequestLoggerMiddleware(): RequestLoggerMiddleware { return this.requestLoggerMiddleware; }
  getPool(): Pool { return this.pool; }
  getUserRepository(): UserRepository { return this.userRepository; }
  getPasswordService(): PasswordService { return this.passwordService; }
  getTokenService(): TokenService { return this.tokenService; }
  getAuthController(): AuthController { return this.authController; }
  getUserProfileController(): UserProfileController { return this.userProfileController; }
  getUserAdminController(): UserAdminController { return this.userAdminController; }
  getAuthMiddleware(): AuthenticationMiddleware { return this.authenticationMiddleware; }
  getTransportRepository(): TransportRepository { return this.transportRepository; }
  getTransportController(): TransportController { return this.transportController; }
  getCache(): CacheService { return this.cache; }
  getCacheStats(): CacheStats { return this.cache.getStats(); }
  getStationRepository(): StationRepository { return this.stationRepository; }
  getStationController(): StationController { return this.stationController; }
  getLoanRepository(): LoanRepository { return this.loanRepository; }
  getPaymentService(): PaymentService { return this.paymentService; }
  getNotificationService(): NotificationService { return this.notificationService; }
  getPricingService(): PricingService { return this.pricingService; }
  getLoanController(): LoanController { return this.loanController; }
  getCalculateFareUseCase(): CalculateFareUseCase { return this.calculateFareUseCase; }
  getHealthCheckUseCase(): HealthCheckUseCase { return this.healthCheckUseCase; }

  async healthCheck(): Promise<{
    status: string;
    dependencies: Record<string, boolean>;
  }> {
    try {
      const detailedHealth = await this.healthCheckUseCase.execute();
      
      return {
        status: detailedHealth.status,
        dependencies: {
          database: detailedHealth.dependencies.database.status === 'up',
          pricing: detailedHealth.dependencies.external_services.pricing.status === 'up',
          logging: detailedHealth.dependencies.external_services.logging.status === 'up',
          userRepositories: !!this.userRepository,
          transportRepositories: !!this.transportRepository,
          stationRepositories: !!this.stationRepository,
          loanRepositories: !!this.loanRepository,
          services: !!this.passwordService && !!this.tokenService && !!this.pricingService,
          userControllers: !!this.authController && !!this.userProfileController && !!this.userAdminController,
          transportControllers: !!this.transportController,
          stationControllers: !!this.stationController,
          loanControllers: !!this.loanController,
          middleware: !!this.authenticationMiddleware
        }
      };
    } catch (error) {
      this.logger?.error('Health check failed', error);
      
      return {
        status: 'unhealthy',
        dependencies: {
          database: false,
          pricing: false,
          logging: !!this.logger,
          userRepositories: !!this.userRepository,
          transportRepositories: !!this.transportRepository,
          stationRepositories: !!this.stationRepository,
          loanRepositories: !!this.loanRepository,
          services: !!this.passwordService && !!this.tokenService && !!this.pricingService,
          userControllers: !!this.authController && !!this.userProfileController && !!this.userAdminController,
          transportControllers: !!this.transportController,
          stationControllers: !!this.stationController,
          loanControllers: !!this.loanController,
          middleware: !!this.authenticationMiddleware
        }
      };
    }
  }
}