import { Pool } from 'pg';
import { PostgreSQLUserRepository } from '../infrastructure/database/repositories/postgresql-user.repository';
import { JWTTokenService, JWTConfig } from '../infrastructure/security/jwt.service';
import {
  CreateUserUseCase,
  AuthenticateUserUseCase,
  GetUserProfileUseCase,
  UpdateUserUseCase,
  ChangePasswordUseCase,
  GetAllUsersUseCase,
  SearchUsersUseCase,
  ActivateUserUseCase,
  DeactivateUserUseCase,
  GetUserStatsUseCase
} from '../core/use-cases/user';
import { UserController } from '../presentation/http/controllers/user.controller';
import { AuthenticationMiddleware } from '../presentation/http/middleware/authentication.middleware';
import { UserRoutes } from '../presentation/http/routes/v1/user.routes';

export class DIContainer {
  private static instance: DIContainer;
  
  // Usar definite assignment assertion (!) para indicar que se inicializan en constructor
  private pool!: Pool;
  private userRepository!: PostgreSQLUserRepository;
  private tokenService!: JWTTokenService;
  
  // Use Cases
  private createUserUseCase!: CreateUserUseCase;
  private authenticateUserUseCase!: AuthenticateUserUseCase;
  private getUserProfileUseCase!: GetUserProfileUseCase;
  private updateUserUseCase!: UpdateUserUseCase;
  private changePasswordUseCase!: ChangePasswordUseCase;
  private getAllUsersUseCase!: GetAllUsersUseCase;
  private searchUsersUseCase!: SearchUsersUseCase;
  private activateUserUseCase!: ActivateUserUseCase;
  private deactivateUserUseCase!: DeactivateUserUseCase;
  private getUserStatsUseCase!: GetUserStatsUseCase;

  // Presentation Layer
  private userController!: UserController;
  private authMiddleware!: AuthenticationMiddleware;
  private userRoutes!: UserRoutes;

  private constructor() {
    this.setupInfrastructure();
    this.setupUseCases();
    this.setupPresentation();
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  private setupInfrastructure(): void {
    // Database Pool
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'ecomove',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Repository
    this.userRepository = new PostgreSQLUserRepository(this.pool);

    // JWT Service
    const jwtConfig: JWTConfig = {
      secret: process.env.JWT_SECRET || 'ecomove-secret-key-development',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'ecomove-api'
    };
    this.tokenService = new JWTTokenService(jwtConfig);
  }

  private setupUseCases(): void {
    this.createUserUseCase = new CreateUserUseCase(this.userRepository);
    this.authenticateUserUseCase = new AuthenticateUserUseCase(this.userRepository, this.tokenService);
    this.getUserProfileUseCase = new GetUserProfileUseCase(this.userRepository);
    this.updateUserUseCase = new UpdateUserUseCase(this.userRepository);
    this.changePasswordUseCase = new ChangePasswordUseCase(this.userRepository);
    this.getAllUsersUseCase = new GetAllUsersUseCase(this.userRepository);
    this.searchUsersUseCase = new SearchUsersUseCase(this.userRepository);
    this.activateUserUseCase = new ActivateUserUseCase(this.userRepository);
    this.deactivateUserUseCase = new DeactivateUserUseCase(this.userRepository);
    this.getUserStatsUseCase = new GetUserStatsUseCase(this.userRepository);
  }

  private setupPresentation(): void {
    this.userController = new UserController(
      this.createUserUseCase,
      this.authenticateUserUseCase,
      this.getUserProfileUseCase,
      this.updateUserUseCase,
      this.changePasswordUseCase,
      this.getAllUsersUseCase,
      this.searchUsersUseCase,
      this.activateUserUseCase,
      this.deactivateUserUseCase,
      this.getUserStatsUseCase
    );

    this.authMiddleware = new AuthenticationMiddleware(this.tokenService, this.userRepository);
    this.userRoutes = new UserRoutes(this.userController, this.authMiddleware);
  }

  // Getters para acceder a las instancias
  getPool(): Pool {
    return this.pool;
  }

  getUserRepository(): PostgreSQLUserRepository {
    return this.userRepository;
  }

  getTokenService(): JWTTokenService {
    return this.tokenService;
  }

  getUserController(): UserController {
    return this.userController;
  }

  getUserRoutes(): UserRoutes {
    return this.userRoutes;
  }

  getAuthMiddleware(): AuthenticationMiddleware {
    return this.authMiddleware;
  }
}