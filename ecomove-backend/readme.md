# 🚴 EcoMove Backend - Sistema de Préstamo de Vehículos Ecológicos

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Sistema backend robusto y escalable para la gestión de préstamos de vehículos ecológicos (bicicletas y patinetas eléctricas), construido con **Clean Architecture** y principios **SOLID**.

---

## 📑 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Patrones de Diseño Implementados](#-patrones-de-diseño-implementados)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Endpoints API](#-endpoints-api)
- [Variables de Entorno](#-variables-de-entorno)

---

## 🌟 Características Principales

- ✅ **Gestión completa de usuarios** con autenticación JWT
- ✅ **Sistema de préstamos** con control de estado y tarifas
- ✅ **Inventario de transportes** (bicicletas y patinetas eléctricas)
- ✅ **Red de estaciones** con geolocalización
- ✅ **Cálculo automático de tarifas** y costos adicionales
- ✅ **Sistema de reportes** y estadísticas
- ✅ **Cache en memoria** para optimización de consultas
- ✅ **Logging estructurado** con Winston
- ✅ **Health checks** y monitoreo
- ✅ **Validaciones robustas** con express-validator

---

## 🏗️ Arquitectura del Sistema

El proyecto implementa **Clean Architecture** (Arquitectura Hexagonal), separando claramente las responsabilidades en 4 capas principales:

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  (Controllers, Routes, Middleware, Validators)               │
│  • HTTP Request/Response handling                            │
│  • Input validation                                          │
│  • Authentication & Authorization                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│                    (Use Cases)                               │
│  • Business logic orchestration                              │
│  • Coordinates domain entities and services                  │
│  • Implements specific application flows                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      DOMAIN LAYER                            │
│        (Entities, Value Objects, Repositories)               │
│  • Core business rules                                       │
│  • Domain entities and aggregates                            │
│  • Repository interfaces (contracts)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                        │
│    (Database, External Services, Implementations)            │
│  • Repository implementations                                │
│  • External API integrations                                 │
│  • Database access                                           │
│  • Third-party services                                      │
└─────────────────────────────────────────────────────────────┘
```

### Ventajas de esta Arquitectura

1. **Independencia de Frameworks**: La lógica de negocio no depende de Express, PostgreSQL u otras tecnologías externas
2. **Testabilidad**: Cada capa puede ser testeada independientemente
3. **Mantenibilidad**: Los cambios en una capa no afectan a las demás
4. **Flexibilidad**: Fácil cambio de base de datos, frameworks o servicios externos

---

## 🎨 Patrones de Diseño Implementados

### 1. PATRONES CREACIONALES

#### **Singleton Pattern** 
```typescript
// src/config/container.ts
export class DIContainer {
  private static instance: DIContainer;
  
  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }
}
```

**¿Por qué se implementó?**
- Garantiza una única instancia del contenedor de dependencias en toda la aplicación
- Evita duplicación de conexiones a la base de datos
- Centraliza la configuración de todas las dependencias
- Optimiza el uso de memoria al reutilizar instancias

**Ubicación**: `src/config/container.ts`

---

#### **Factory Pattern**
```typescript
// src/core/domain/entities/user.entity.ts
export class User {
  static fromPersistence(data: any): User {
    return new User(
      data.id,
      data.name,
      Email.fromString(data.email),
      DocumentNumber.fromString(data.document_number),
      // ... más campos
    );
  }
  
  toPersistence(): any {
    return {
      id: this.id,
      name: this.name,
      email: this.email.getValue(),
      // ... más campos
    };
  }
}
```

**¿Por qué se implementó?**
- Centraliza la lógica de creación y transformación de entidades
- Separa la representación del dominio de la persistencia
- Facilita cambios en el formato de almacenamiento sin afectar la lógica de negocio
- Mejora la legibilidad del código

**Ubicación**: `src/core/domain/entities/*.entity.ts`

---

### 2. PATRONES ESTRUCTURALES

#### **Repository Pattern** ⭐⭐⭐
```typescript
// src/core/domain/repositories/user.repository.ts (INTERFAZ)
export interface UserRepository {
  save(user: User): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  update(user: User): Promise<User>;
  delete(id: number): Promise<void>;
}

// src/infrastructure/persistence/postgresql/user.repository.ts (IMPLEMENTACIÓN)
export class PostgreSQLUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}
  
  async save(user: User): Promise<User> {
    const data = user.toPersistence();
    const query = 'INSERT INTO users (...) VALUES (...)';
    const result = await this.pool.query(query, values);
    return User.fromPersistence(result.rows[0]);
  }
  // ... más métodos
}
```

**¿Por qué se implementó?**
- **Abstracción**: Separa la lógica de negocio del acceso a datos
- **Flexibilidad**: Permite cambiar de PostgreSQL a MongoDB sin tocar los Use Cases
- **Testabilidad**: Fácil crear mocks para testing unitario
- **Mantenibilidad**: Cambios en queries no afectan la lógica de negocio
- **Single Responsibility**: El repositorio solo se encarga de la persistencia

**Ubicación**: 
- Interfaces: `src/core/domain/repositories/`
- Implementaciones: `src/infrastructure/database/repositories/`

---

#### **Decorator Pattern** ⭐⭐
```typescript
// src/infrastructure/database/repositories/cached-transport.repository.ts
export class CachedTransportRepository implements TransportRepository {
  constructor(
    private readonly baseRepository: TransportRepository,  // ← Repositorio decorado
    private readonly cache: CacheService,
    private readonly logger: LoggerService
  ) {}

  async findById(id: number): Promise<Transport | null> {
    // 1. Intenta obtener del caché
    const cached = this.cache.get<Transport>(`transport:${id}`);
    if (cached) {
      this.logger.debug('Cache hit', { id });
      return cached;
    }

    // 2. Si no está en caché, delega al repositorio base
    const transport = await this.baseRepository.findById(id);
    
    // 3. Guarda en caché para futuras consultas
    if (transport) {
      this.cache.set(`transport:${id}`, transport, 300);
    }

    return transport;
  }
}
```

**¿Por qué se implementó?**
- **Extensión sin modificación**: Añade funcionalidad de caché sin tocar el repositorio original (Open/Closed Principle)
- **Transparencia**: Los use cases no saben si están usando caché o no
- **Desacoplamiento**: El caché puede ser activado/desactivado fácilmente
- **Performance**: Reduce significativamente las consultas a la base de datos
- **Composición**: Pueden apilarse múltiples decoradores (logging, metrics, etc.)

**Configuración de TTL (Time To Live)**:
```typescript
private readonly CACHE_TTL = {
  SINGLE_TRANSPORT: 300,      // 5 minutos
  TRANSPORT_LIST: 120,        // 2 minutos  
  AVAILABLE_TRANSPORTS: 60,   // 1 minuto (alta rotación)
  STATS: 180                  // 3 minutos
};
```

**Ubicación**: `src/infrastructure/database/repositories/cached-*.repository.ts`

---

#### **Adapter Pattern**
```typescript
// src/core/domain/services/password.service.ts (INTERFAZ)
export interface PasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hashedPassword: string): Promise<boolean>;
}

// src/infrastructure/services/bcrypt-password.service.ts (ADAPTADOR)
export class BcryptPasswordService implements PasswordService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);  // Adapta bcrypt a nuestra interfaz
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}

// Fácilmente intercambiable con otros algoritmos:
// - ArgonPasswordService (usando argon2)
// - ScryptPasswordService (usando scrypt)
```

**¿Por qué se implementó?**
- **Independencia de bibliotecas**: La lógica de negocio no conoce bcrypt directamente
- **Intercambiabilidad**: Podemos cambiar de bcrypt a argon2 sin tocar los use cases
- **Testabilidad**: Fácil crear un mock del PasswordService
- **Consistencia**: Misma interfaz para diferentes implementaciones

**Otros adaptadores en el proyecto**:
- `JwtTokenService` (adapta jsonwebtoken)
- `WinstonLoggerService` (adapta winston)
- `StripePaymentService` (adapta Stripe SDK)
- `EmailNotificationService` (adapta nodemailer)

**Ubicación**: `src/infrastructure/services/*.service.ts`

---

#### **Dependency Injection** ⭐⭐⭐
```typescript
// src/config/container.ts
export class DIContainer {
  private userRepository!: UserRepository;
  private passwordService!: PasswordService;
  private registerUserUseCase!: RegisterUserUseCase;

  private initializeRepositories(): void {
    this.userRepository = new PostgreSQLUserRepository(this.pool);
  }

  private initializeServices(): void {
    this.passwordService = new BcryptPasswordService();
  }

  private initializeUseCases(): void {
    this.registerUserUseCase = new RegisterUserUseCase(
      this.userRepository,   // ← Inyectado
      this.passwordService,  // ← Inyectado
      this.logger           // ← Inyectado
    );
  }
}

// src/core/use-cases/user/register-user.use-case.ts
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly logger: LoggerService
  ) {}  // ← Dependencias inyectadas en el constructor
}
```

**¿Por qué se implementó?**
- **Desacoplamiento**: Las clases no crean sus propias dependencias
- **Testabilidad**: Fácil inyectar mocks en tests unitarios
- **Flexibilidad**: Cambiar implementaciones sin modificar las clases que las usan
- **Single Responsibility**: Las clases no se preocupan por crear sus dependencias
- **Inversión de dependencias**: Depende de abstracciones (interfaces), no de implementaciones

**Ejemplo de testing**:
```typescript
// En un test
const mockRepository = new MockUserRepository();
const mockPasswordService = new MockPasswordService();
const useCase = new RegisterUserUseCase(mockRepository, mockPasswordService);
```

**Ubicación**: `src/config/container.ts` (configuración) y todas las clases (consumo)

---

### 3. PATRONES COMPORTAMENTALES

#### **Strategy Pattern**
```typescript
// src/core/domain/services/payment.service.ts (ESTRATEGIA)
export interface PaymentService {
  processPayment(amount: number, details: any): Promise<PaymentResult>;
}

// Estrategia 1: Stripe
export class StripePaymentService implements PaymentService {
  async processPayment(amount: number): Promise<PaymentResult> {
    // Lógica específica de Stripe
  }
}

// Estrategia 2: PSE
export class PSEPaymentService implements PaymentService {
  async processPayment(amount: number): Promise<PaymentResult> {
    // Lógica específica de PSE
  }
}

// Estrategia 3: Efectivo
export class CashPaymentService implements PaymentService {
  async processPayment(amount: number): Promise<PaymentResult> {
    // Registro de pago en efectivo
  }
}

// Uso en runtime
const paymentService = getPaymentService(paymentMethod);
await paymentService.processPayment(amount);
```

**¿Por qué se implementó?**
- **Flexibilidad**: Permite cambiar el algoritmo de pago en tiempo de ejecución
- **Extensibilidad**: Fácil añadir nuevos métodos de pago sin modificar código existente (Open/Closed)
- **Mantenibilidad**: Cada estrategia está aislada y puede modificarse independientemente
- **Claridad**: El código cliente no necesita saber los detalles de cada método de pago

**Otras estrategias en el proyecto**:
- `PricingService` (diferentes algoritmos de cálculo de tarifas)
- `NotificationService` (Email, SMS, Push)

**Ubicación**: `src/core/domain/services/*.service.ts` y `src/infrastructure/services/*.service.ts`

---

#### **Chain of Responsibility** ⭐
```typescript
// src/presentation/http/routes/v1/loan.routes.ts
router.post('/loans',
  authMiddleware.authenticate,           // Handler 1: Verifica autenticación
  LoanValidator.validateCreateLoan(),    // Handler 2: Valida datos de entrada
  LoanValidator.handleValidationErrors,  // Handler 3: Maneja errores de validación
  loanController.createLoan              // Handler final: Procesa la solicitud
);
```

**Flujo de la cadena**:
```
Request → [Auth] → [Validate] → [ErrorHandler] → [Controller] → Response
           ↓         ↓             ↓                ↓
         next()    next()        next()          response
```

**Implementación del middleware de autenticación**:
```typescript
// src/presentation/http/middleware/authentication.middleware.ts
export class AuthenticationMiddleware {
  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.substring(7);
      
      if (!token) {
        return res.status(401).json({ message: 'Token requerido' });
      }

      const decoded = await this.tokenService.verify(token);
      req.user = decoded;
      
      next();  // ← Pasa al siguiente handler
    } catch (error) {
      res.status(401).json({ message: 'Token inválido' });
    }
  };
}
```

**¿Por qué se implementó?**
- **Separación de responsabilidades**: Cada middleware tiene una única responsabilidad
- **Reusabilidad**: Los middlewares pueden usarse en múltiples rutas
- **Flexibilidad**: Fácil añadir, quitar o reordenar middlewares
- **Mantenibilidad**: Lógica transversal centralizada (auth, logging, validation)
- **Early return**: Si un handler falla, se detiene la cadena

**Middlewares implementados**:
- `AuthenticationMiddleware`: Verifica JWT y permisos
- `RequestLoggerMiddleware`: Logging de requests
- `ValidationErrorHandler`: Manejo de errores de validación
- `ErrorHandlerMiddleware`: Manejo global de errores
- `RateLimiterMiddleware`: Limitación de tasa de peticiones

**Ubicación**: `src/presentation/http/middleware/*.middleware.ts`

---

#### **Command Pattern** (Use Cases)
```typescript
// src/core/use-cases/loan/create-loan.use-case.ts
export class CreateLoanUseCase {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly userRepository: UserRepository,
    private readonly transportRepository: TransportRepository,
    private readonly stationRepository: StationRepository,
    private readonly logger: LoggerService
  ) {}

  async execute(data: CreateLoanDTO): Promise<Loan> {
    // Comando encapsulado - Toda la lógica de crear un préstamo
    
    // 1. Validar que el usuario existe y está activo
    const user = await this.userRepository.findById(data.usuario_id);
    if (!user || !user.isActive()) {
      throw new Error('Usuario no válido');
    }

    // 2. Verificar que el usuario no tiene préstamos activos
    const hasActiveLoan = await this.loanRepository.hasActiveLoans(data.usuario_id);
    if (hasActiveLoan) {
      throw new Error('Usuario ya tiene un préstamo activo');
    }

    // 3. Validar que el transporte existe y está disponible
    const transport = await this.transportRepository.findById(data.transporte_id);
    if (!transport || transport.status !== 'available') {
      throw new Error('Transporte no disponible');
    }

    // 4. Validar estación de origen
    const station = await this.stationRepository.findById(data.estacion_origen_id);
    if (!station || station.status !== 'active') {
      throw new Error('Estación no válida');
    }

    // 5. Crear el préstamo
    const loan = Loan.create(data);
    const savedLoan = await this.loanRepository.save(loan);

    // 6. Actualizar estado del transporte
    await this.transportRepository.updateStatus(data.transporte_id, 'in-use');

    // 7. Log de auditoría
    this.logger.info('Loan created', { loanId: savedLoan.id, userId: data.usuario_id });

    return savedLoan;
  }
}
```

**¿Por qué se implementó?**
- **Encapsulación**: Toda la lógica de negocio de una operación en un solo lugar
- **Single Responsibility**: Cada use case hace una sola cosa
- **Reusabilidad**: Los use cases pueden ser invocados desde controllers, workers, CLI, etc.
- **Testabilidad**: Fácil testear la lógica de negocio de forma aislada
- **Transaccionalidad**: Toda la operación o nada (puede envolverse en transacciones DB)
- **Auditoría**: Punto central para logging y tracking de operaciones

**Use Cases implementados**:

**Usuarios**: RegisterUser, LoginUser, GetUserProfile, UpdateUserProfile, ChangePassword

**Transportes**: CreateBicycle, CreateElectricScooter, UpdateTransport, ChangeTransportStatus

**Estaciones**: CreateStation, FindNearbyStations, GetStationAvailability

**Préstamos**: CreateLoan, CompleteLoan, CancelLoan, ExtendLoan, CalculateFare

**Ubicación**: `src/core/use-cases/**/*.use-case.ts`

---

### 4. PATRONES DOMAIN-DRIVEN DESIGN (DDD)

#### **Entity Pattern** ⭐⭐
```typescript
// src/core/domain/entities/user.entity.ts
export class User {
  constructor(
    private id: number | null,           // ← Identidad única
    private name: string,
    private email: Email,                // ← Value Object
    private documentNumber: DocumentNumber,
    private phone: string,
    private password: string,
    private role: UserRole = UserRole.USER,
    private status: UserStatus = UserStatus.ACTIVE,
    private registrationDate: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // ========== MÉTODOS DE NEGOCIO (COMPORTAMIENTO) ==========
  
  activate(): void {
    this.status = UserStatus.ACTIVE;
    this.markAsUpdated();
  }

  deactivate(): void {
    this.status = UserStatus.INACTIVE;
    this.markAsUpdated();
  }

  changePassword(newHashedPassword: string): void {
    if (!newHashedPassword) {
      throw new Error('La contraseña no puede estar vacía');
    }
    this.password = newHashedPassword;
    this.markAsUpdated();
  }

  updateProfile(name: string, phone: string): void {
    if (name.trim().length < 2) {
      throw new Error('Nombre inválido');
    }
    this.name = name;
    this.phone = phone;
    this.markAsUpdated();
  }

  // ========== VALIDACIONES DE ESTADO ==========
  
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  canPerformAction(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  private markAsUpdated(): void {
    this.updatedAt = new Date();
  }
}
```

**¿Por qué se implementó?**
- **Identidad**: Cada usuario tiene un ID único que lo identifica
- **Encapsulación**: Los datos y comportamiento están juntos
- **Integridad**: Las reglas de negocio están dentro de la entidad
- **Inmutabilidad parcial**: Los getters exponen datos, los métodos modifican con validaciones
- **Lenguaje ubicuo**: Métodos con nombres del dominio del negocio

**Otras entidades del proyecto**:
- `Loan`: Gestión de préstamos con estados y transiciones
- `Transport`: Herencia (Bicycle, ElectricScooter)
- `Station`: Gestión de estaciones con capacidad

**Ubicación**: `src/core/domain/entities/*.entity.ts`

---

#### **Value Object Pattern** ⭐⭐
```typescript
// src/core/domain/value-objects/email.vo.ts
export class Email {
  private readonly value: string;

  constructor(email: string) {
    const trimmedEmail = email.toLowerCase().trim();
    
    if (!this.isValid(trimmedEmail)) {
      throw new Error('Email inválido');
    }
    
    this.value = trimmedEmail;  // ← Inmutable
  }

  getValue(): string {
    return this.value;
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
  }

  // Igualdad por valor, no por referencia
  equals(other: Email): boolean {
    return this.value === other.value;
  }
}

// Uso
const email1 = new Email('user@example.com');
const email2 = new Email('USER@EXAMPLE.COM');  // Se normaliza a minúsculas
console.log(email1.equals(email2));  // true
```

**Características de Value Objects**:
```typescript
// ✅ Inmutables - No tienen setters
// ✅ Sin identidad - Se comparan por valor
// ✅ Auto-validables - Validación en el constructor
// ✅ Intercambiables - Dos instancias con el mismo valor son equivalentes
```

**Otro ejemplo**:
```typescript
// src/core/domain/value-objects/document-number.vo.ts
export class DocumentNumber {
  private readonly value: string;

  constructor(document: string) {
    const cleanDocument = document.replace(/[^\d]/g, '');
    
    if (!this.isValid(cleanDocument)) {
      throw new Error('Número de documento inválido');
    }
    
    this.value = cleanDocument;
  }

  getValue(): string {
    return this.value;
  }

  private isValid(document: string): boolean {
    return /^\d{8,15}$/.test(document);
  }
}
```

**¿Por qué se implementó?**
- **Validación centralizada**: La validación está en un solo lugar
- **Inmutabilidad**: No pueden ser modificados después de creados
- **Type Safety**: TypeScript distingue entre string y Email
- **Reutilización**: El mismo value object se usa en toda la aplicación
- **Expresividad**: El código es más legible (`email: Email` vs `email: string`)

**Value Objects implementados**:
- `Email`: Validación y normalización de emails
- `DocumentNumber`: Validación de documentos de identidad
- `Coordinate`: Latitud y longitud validadas
- `TransportFilters`: Filtros de búsqueda encapsulados
- `StationFilters`: Filtros de estaciones

**Ubicación**: `src/core/domain/value-objects/*.vo.ts`

---

#### **Aggregate Pattern**
```typescript
// src/core/domain/entities/loan.entity.ts
export class Loan {  // ← Aggregate Root
  constructor(
    private id: number | null,
    private userId: number,              // ← Referencia externa
    private transportId: number,         // ← Referencia externa
    private originStationId: number,     // ← Referencia externa
    private destinationStationId: number | null,
    private startDate: Date,
    private endDate: Date | null,
    private estimatedDuration: number | null,
    private totalCost: number | null,
    private status: LoanStatus,
    private paymentMethod: PaymentMethod | null,
    private createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // ========== COMPORTAMIENTO DEL AGREGADO ==========

  complete(destinationStationId: number, totalCost: number): void {
    if (this.status !== LoanStatus.ACTIVE) {
      throw new Error('Solo préstamos activos pueden completarse');
    }

    this.destinationStationId = destinationStationId;
    this.endDate = new Date();
    this.totalCost = totalCost;
    this.status = LoanStatus.COMPLETED;
    this.markAsUpdated();
  }

  cancel(reason?: string): void {
    if (this.status === LoanStatus.COMPLETED) {
      throw new Error('No se puede cancelar un préstamo completado');
    }

    this.status = LoanStatus.CANCELLED;
    this.endDate = new Date();
    this.markAsUpdated();
  }

  extend(additionalMinutes: number): void {
    if (this.status !== LoanStatus.ACTIVE) {
      throw new Error('Solo préstamos activos pueden extenderse');
    }

    this.estimatedDuration = (this.estimatedDuration || 0) + additionalMinutes;
    this.status = LoanStatus.EXTENDED;
    this.markAsUpdated();
  }

  // ========== INVARIANTES DEL AGREGADO ==========

  isActive(): boolean {
    return this.status === LoanStatus.ACTIVE;
  }

  isOverdue(): boolean {
    if (!this.isActive() || !this.estimatedDuration) return false;
    
    const elapsedMinutes = (Date.now() - this.startDate.getTime()) / 60000;
    return elapsedMinutes > this.estimatedDuration;
  }
}
```

**¿Por qué se implementó?**
- **Consistencia**: El agregado garantiza que todas las reglas de negocio se cumplen
- **Boundary transaccional**: Todas las operaciones dentro del agregado son atómicas
- **Encapsulación**: Solo se puede modificar el préstamo a través de sus métodos
- **Invariantes**: Las reglas de negocio siempre se validan (ej: solo activos pueden completarse)
- **Referencias**: Mantiene IDs de otras entidades, no objetos completos (evita cargar todo el grafo)

**Reglas del Aggregate en el proyecto**:
1. Solo el Aggregate Root puede ser referenciado directamente desde fuera
2. Las modificaciones al agregado deben pasar por el root
3. Los repositorios solo persisten Aggregate Roots
4. Las transacciones de base de datos se alinean con los boundaries del agregado

**Ubicación**: `src/core/domain/entities/loan.entity.ts`

---

### 5. OTROS PATRONES

#### **Middleware Pattern**
Ya explicado en **Chain of Responsibility**

#### **DTO (Data Transfer Object) Pattern**
```typescript
// src/presentation/http/dtos/loan.dto.ts
export interface CreateLoanDTO {
  usuario_id: number;
  transporte_id: number;
  estacion_origen_id: number;
  duracion_estimada?: number;
  metodo_pago?: string;
}

export interface LoanResponseDTO {
  id: number;
  usuario_id: number;
  transporte_id: number;
  estado: string;
  fecha_inicio: string;
  costo_total?: number;
}
```

**¿Por qué se implementó?**
- **Separación de capas**: La presentación no expone entidades de dominio directamente
- **Versionado**: Cambios en DTOs no afectan al dominio
- **Optimización**: Solo se transfieren los datos necesarios
- **Seguridad**: Evita exponer información sensible (ej: passwords hasheados)

**Ubicación**: `src/presentation/http/dtos/*.dto.ts`

---

## 📊 Resumen de Patrones por Categoría

| Categoría | Patrón | Implementado | Complejidad | Impacto |
|-----------|--------|:------------:|:-----------:|:-------:|
| **Creacionales** | Singleton | ✅ | 🟢 Baja | ⭐⭐ |
| | Factory | ✅ | 🟢 Baja | ⭐⭐ |
| **Estructurales** | Repository | ✅ | 🟡 Media | ⭐⭐⭐ |
| | Decorator | ✅ | 🟡 Media | ⭐⭐ |
| | Adapter | ✅ | 🟢 Baja | ⭐⭐ |
| | Dependency Injection | ✅ | 🟡 Media | ⭐⭐⭐ |
| **Comportamentales** | Strategy | ✅ | 🟢 Baja | ⭐⭐ |
| | Chain of Responsibility | ✅ | 🟢 Baja | ⭐⭐ |
| | Command (Use Cases) | ✅ | 🟡 Media | ⭐⭐⭐ |
| **DDD** | Entity | ✅ | 🟡 Media | ⭐⭐⭐ |
| | Value Object | ✅ | 🟢 Baja | ⭐⭐ |
| | Aggregate | ✅ | 🔴 Alta | ⭐⭐ |

**Leyenda**:
- 🟢 Baja: Fácil de entender e implementar
- 🟡 Media: Requiere comprensión de principios SOLID
- 🔴 Alta: Requiere experiencia en DDD

---

## 💻 Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Lenguaje**: TypeScript 5.x
- **Framework**: Express.js 4.x
- **Base de Datos**: PostgreSQL 14+
- **ORM**: pg (PostgreSQL client nativo)

### Seguridad y Autenticación
- **JWT**: jsonwebtoken
- **Encriptación**: bcryptjs
- **Validación**: express-validator
- **Rate Limiting**: express-rate-limit

### Logging y Monitoreo
- **Logger**: Winston
- **Rotación de logs**: winston-daily-rotate-file

### Utilidades
- **Variables de Entorno**: dotenv
- **CORS**: cors
- **Date handling**: Nativo de JavaScript

---

## 🚀 Instalación

### Prerrequisitos

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd ecomove-backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Crear la base de datos**
```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE ecomove;

# Salir de psql
\q
```

5. **Ejecutar migraciones**
```bash
# Aplicar schema
npm run db:migrate

# (Opcional) Cargar datos de prueba
npm run db:seed
```

6. **Crear usuario administrador**
```bash
npm run create-admin
```

7. **Iniciar el servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

El servidor estará disponible en `http://localhost:3000`

---

## 📁 Estructura del Proyecto

```
ecomove-backend/
│
├── src/
│   ├── config/                      # Configuración global
│   │   ├── container.ts            # DI Container (Singleton)
│   │   └── database.config.ts      # Configuración de BD
│   │
│   ├── core/                        # Capa de Dominio y Aplicación
│   │   ├── domain/                 # CAPA DE DOMINIO
│   │   │   ├── entities/           # Entidades del dominio
│   │   │   │   ├── user.entity.ts
│   │   │   │   ├── transport.entity.ts
│   │   │   │   ├── bicycle.entity.ts
│   │   │   │   ├── electric-scooter.entity.ts
│   │   │   │   ├── station.entity.ts
│   │   │   │   └── loan.entity.ts
│   │   │   │
│   │   │   ├── value-objects/      # Value Objects (DDD)
│   │   │   │   ├── email.vo.ts
│   │   │   │   ├── document-number.vo.ts
│   │   │   │   ├── coordinate.vo.ts
│   │   │   │   ├── transport-filters.ts
│   │   │   │   └── station-filters.ts
│   │   │   │
│   │   │   ├── repositories/       # Interfaces de repositorios
│   │   │   │   ├── user.repository.ts
│   │   │   │   ├── transport.repository.ts
│   │   │   │   ├── station.repository.ts
│   │   │   │   └── loan.repository.ts
│   │   │   │
│   │   │   └── services/           # Interfaces de servicios de dominio
│   │   │       ├── password.service.ts
│   │   │       ├── token.service.ts
│   │   │       ├── pricing.service.ts
│   │   │       ├── payment.service.ts
│   │   │       └── notification.service.ts
│   │   │
│   │   └── use-cases/              # CAPA DE APLICACIÓN (Command Pattern)
│   │       ├── user/
│   │       │   ├── register-user.use-case.ts
│   │       │   ├── login-user.use-case.ts
│   │       │   ├── get-user-profile.use-case.ts
│   │       │   └── update-user-profile.use-case.ts
│   │       │
│   │       ├── transport/
│   │       │   ├── create-bicycle.use-case.ts
│   │       │   ├── create-electric-scooter.use-case.ts
│   │       │   ├── get-transport.use-case.ts
│   │       │   └── update-transport-status.use-case.ts
│   │       │
│   │       ├── station/
│   │       │   ├── create-station.use-case.ts
│   │       │   ├── find-nearby-stations.use-case.ts
│   │       │   └── get-station-availability.use-case.ts
│   │       │
│   │       ├── loan/
│   │       │   ├── create-loan.use-case.ts
│   │       │   ├── complete-loan.use-case.ts
│   │       │   ├── cancel-loan.use-case.ts
│   │       │   ├── extend-loan.use-case.ts
│   │       │   └── calculate-fare.use-case.ts
│   │       │
│   │       └── system/
│   │           └── health-check.use-case.ts
│   │
│   ├── infrastructure/              # CAPA DE INFRAESTRUCTURA
│   │   ├── database/
│   │   │   └── repositories/       # Implementaciones de repositorios
│   │   │       ├── postgresql-user.repository.ts
│   │   │       ├── postgresql-transport.repository.ts
│   │   │       ├── postgresql-station.repository.ts
│   │   │       ├── postgresql-loan.repository.ts
│   │   │       ├── cached-transport.repository.ts  # Decorator Pattern
│   │   │       └── cached-station.repository.ts    # Decorator Pattern
│   │   │
│   │   └── services/               # Implementaciones de servicios (Adapter Pattern)
│   │       ├── bcrypt-password.service.ts          # Adapter para bcrypt
│   │       ├── jwt-token.service.ts                # Adapter para JWT
│   │       ├── winston-logger.service.ts           # Adapter para Winston
│   │       ├── memory-cache.service.ts
│   │       ├── stripe-payment.service.ts           # Adapter para Stripe
│   │       ├── email-notification.service.ts       # Adapter para Nodemailer
│   │       └── consolidated-pricing.service.ts
│   │
│   ├── presentation/                # CAPA DE PRESENTACIÓN
│   │   └── http/
│   │       ├── controllers/        # Controladores HTTP
│   │       │   ├── auth.controller.ts
│   │       │   ├── user-profile.controller.ts
│   │       │   ├── user-admin.controller.ts
│   │       │   ├── transport.controller.ts
│   │       │   ├── station.controller.ts
│   │       │   ├── loan.controller.ts
│   │       │   └── health.controller.ts
│   │       │
│   │       ├── routes/             # Definición de rutas
│   │       │   └── v1/
│   │       │       ├── user.routes.ts
│   │       │       ├── transport.routes.ts
│   │       │       ├── station.routes.ts
│   │       │       ├── loan.routes.ts
│   │       │       └── health.routes.ts
│   │       │
│   │       ├── middleware/         # Chain of Responsibility
│   │       │   ├── authentication.middleware.ts
│   │       │   ├── request-logger.middleware.ts
│   │       │   ├── error-handler.middleware.ts
│   │       │   ├── validation-error-handler.middleware.ts
│   │       │   └── rate-limiter.middleware.ts
│   │       │
│   │       ├── validators/         # Validaciones de entrada
│   │       │   ├── user.validator.ts
│   │       │   ├── transport.validator.ts
│   │       │   ├── station.validator.ts
│   │       │   └── loan.validator.ts
│   │       │
│   │       └── dtos/              # Data Transfer Objects
│   │           ├── user.dto.ts
│   │           ├── transport.dto.ts
│   │           ├── station.dto.ts
│   │           └── loan.dto.ts
│   │
│   ├── shared/                     # Código compartido
│   │   ├── enums/
│   │   │   ├── user.enums.ts
│   │   │   ├── transport.enums.ts
│   │   │   ├── station.enums.ts
│   │   │   └── loan.enums.ts
│   │   │
│   │   └── interfaces/
│   │       ├── api-response.interface.ts
│   │       └── coordinate.interface.ts
│   │
│   ├── database/                   # Scripts de base de datos
│   │   ├── schema.sql             # Definición del schema
│   │   └── seed.sql               # Datos de prueba
│   │
│   ├── scripts/                   # Scripts de utilidad
│   │   └── create-admin.ts        # Crear usuario admin
│   │
│   └── main.ts                    # Punto de entrada de la aplicación
│
├── logs/                          # Logs de la aplicación (generados)
│   ├── error-YYYY-MM-DD.log
│   └── combined-YYYY-MM-DD.log
│
├── .env                          # Variables de entorno (no commitear)
├── .env.example                  # Plantilla de variables de entorno
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Explicación de las capas

#### **Domain Layer** (`src/core/domain/`)
- **Responsabilidad**: Reglas de negocio puras
- **Sin dependencias**: No conoce infraestructura ni frameworks
- **Contiene**: Entidades, Value Objects, interfaces de repositorios

#### **Application Layer** (`src/core/use-cases/`)
- **Responsabilidad**: Casos de uso y orquestación
- **Depende de**: Domain Layer
- **Contiene**: Lógica de aplicación, coordinación entre entidades

#### **Infrastructure Layer** (`src/infrastructure/`)
- **Responsabilidad**: Implementaciones técnicas
- **Depende de**: Domain Layer (interfaces)
- **Contiene**: Acceso a BD, servicios externos, adaptadores

#### **Presentation Layer** (`src/presentation/`)
- **Responsabilidad**: Interacción con el mundo exterior
- **Depende de**: Application Layer
- **Contiene**: Controllers, routes, middleware, validadores

---

## 🔌 Endpoints API

### Health Check
```
GET  /api/v1/health              - Health check básico
GET  /api/v1/health/detailed     - Health check detallado
GET  /api/v1/health/ping         - Ping rápido
```

### Autenticación y Usuarios
```
POST   /api/v1/users/auth/register     - Registrar usuario
POST   /api/v1/users/auth/login        - Iniciar sesión
GET    /api/v1/users/profile           - Obtener perfil (requiere auth)
PUT    /api/v1/users/profile           - Actualizar perfil (requiere auth)
PUT    /api/v1/users/profile/password  - Cambiar contraseña (requiere auth)
```

### Administración de Usuarios (Admin)
```
GET    /api/v1/users/admin/all         - Listar usuarios (admin)
GET    /api/v1/users/admin/search      - Buscar usuarios (admin)
GET    /api/v1/users/admin/stats       - Estadísticas (admin)
GET    /api/v1/users/admin/:id         - Usuario por ID (admin)
PUT    /api/v1/users/admin/:id         - Actualizar usuario (admin)
PUT    /api/v1/users/admin/:id/activate    - Activar usuario (admin)
PUT    /api/v1/users/admin/:id/deactivate  - Desactivar usuario (admin)
```

### Transportes
```
GET    /api/v1/transports                      - Listar transportes
GET    /api/v1/transports/:id                  - Obtener transporte
POST   /api/v1/transports/bicycle              - Crear bicicleta (admin)
POST   /api/v1/transports/electric-scooter    - Crear patineta (admin)
PUT    /api/v1/transports/:id                  - Actualizar transporte (admin)
PUT    /api/v1/transports/:id/status          - Cambiar estado (admin)
PUT    /api/v1/transports/:id/battery         - Actualizar batería (admin)
GET    /api/v1/transports/available/:stationId - Transportes disponibles
GET    /api/v1/transports/stats                - Estadísticas (admin)
DELETE /api/v1/transports/:id                  - Eliminar transporte (admin)
```

### Estaciones
```
GET    /api/v1/stations                   - Listar estaciones
GET    /api/v1/stations/:id               - Obtener estación
POST   /api/v1/stations                   - Crear estación (admin)
PUT    /api/v1/stations/:id               - Actualizar estación (admin)
GET    /api/v1/stations/nearby            - Estaciones cercanas
GET    /api/v1/stations/:id/availability  - Disponibilidad de estación
GET    /api/v1/stations/:id/transports    - Transportes en estación
POST   /api/v1/stations/route             - Calcular ruta
GET    /api/v1/stations/stats              - Estadísticas (admin)
PUT    /api/v1/stations/:id/activate      - Activar estación (admin)
PUT    /api/v1/stations/:id/deactivate    - Desactivar estación (admin)
```

### Préstamos
```
GET    /api/v1/loans                          - Listar préstamos (admin)
GET    /api/v1/loans/:id                      - Obtener préstamo
POST   /api/v1/loans                          - Crear préstamo (auth)
PUT    /api/v1/loans/:id/completar           - Completar préstamo (auth)
PUT    /api/v1/loans/:id/cancelar            - Cancelar préstamo (auth)
PUT    /api/v1/loans/:id/extender            - Extender préstamo (auth)
GET    /api/v1/loans/:id/detalles            - Préstamo con detalles (auth)
GET    /api/v1/loans/usuario/activo          - Préstamo activo del usuario (auth)
GET    /api/v1/loans/usuario/historial/:id   - Historial de usuario (admin)
POST   /api/v1/loans/calcular-tarifa         - Calcular tarifa
GET    /api/v1/loans/admin/estadisticas      - Estadísticas (admin)
GET    /api/v1/loans/admin/reporte           - Reporte por período (admin)
GET    /api/v1/loans/admin/activos           - Préstamos activos (admin)
```

---

## 🔐 Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Servidor
NODE_ENV=development
PORT=3000

# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecomove
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=info

# Cache
CACHE_TTL=300

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm run test

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests en modo watch
npm run test:watch
```

---

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor en modo desarrollo con hot-reload

# Producción
npm run build        # Compila TypeScript a JavaScript
npm start            # Inicia servidor en producción

# Base de datos
npm run db:migrate   # Aplica schema de base de datos
npm run db:seed      # Carga datos de prueba
npm run create-admin # Crea usuario administrador

# Utilidades
npm run lint         # Ejecuta ESLint
npm run format       # Formatea código con Prettier
```

---

## 🎯 Principios SOLID Aplicados

### **S - Single Responsibility Principle**
Cada clase tiene una única responsabilidad:
- `UserRepository`: Solo gestiona persistencia de usuarios
- `RegisterUserUseCase`: Solo maneja el registro de usuarios
- `AuthenticationMiddleware`: Solo verifica autenticación

### **O - Open/Closed Principle**
El código está abierto a extensión pero cerrado a modificación:
- Nuevos tipos de transporte se añaden sin modificar `TransportRepository`
- Decorator Pattern permite añadir caché sin modificar repositorios base
- Nuevas estrategias de pricing sin modificar el código existente

### **L - Liskov Substitution Principle**
Las implementaciones son intercambiables:
- Cualquier `UserRepository` puede usarse sin cambiar los use cases
- `BcryptPasswordService` puede reemplazarse por `ArgonPasswordService`
- Los repositorios cacheados son drop-in replacements

### **I - Interface Segregation Principle**
Interfaces específicas y cohesivas:
- `PasswordService` solo tiene hash y compare
- `TokenService` solo tiene generate y verify
- No hay interfaces "God" con muchos métodos

### **D - Dependency Inversion Principle**
Dependencias apuntan hacia abstracciones:
- Use cases dependen de interfaces, no de implementaciones
- Controllers dependen de use cases, no de repositorios
- Toda la configuración está en `DIContainer`

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👥 Autores

- **Tu Nombre** - *Desarrollo inicial*

---

## 🙏 Agradecimientos

- Inspirado por los principios de Clean Architecture de Robert C. Martin
- Patrones de diseño basados en "Design Patterns" de Gang of Four
- Domain-Driven Design de Eric Evans

---

## 📚 Recursos Adicionales

### Documentación de Patrones
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Design Patterns](https://refactoring.guru/design-patterns)
- [Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)

### Libros Recomendados
- **Clean Architecture** - Robert C. Martin
- **Domain-Driven Design** - Eric Evans
- **Patterns of Enterprise Application Architecture** - Martin Fowler
- **Design Patterns: Elements of Reusable Object-Oriented Software** - Gang of Four

---

## 📞 Contacto

Para preguntas o sugerencias, abre un issue en el repositorio.

---

**¡Gracias por usar EcoMove Backend! 🚴‍♂️🛴**
