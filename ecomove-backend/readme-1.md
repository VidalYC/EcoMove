# 🚴 EcoMove - Documentación de Patrones de Diseño

## 📋 Tabla de Contenidos
- [Introducción](#introducción)
- [Arquitectura General](#arquitectura-general)
- [Patrones de Diseño Implementados](#patrones-de-diseño-implementados)
  - [1. Singleton Pattern](#1-singleton-pattern)
  - [2. Repository Pattern](#2-repository-pattern)
  - [3. Factory Method Pattern](#3-factory-method-pattern)
  - [4. Dependency Injection (DI)](#4-dependency-injection-di)
  - [5. Strategy Pattern](#5-strategy-pattern)
  - [6. Decorator Pattern](#6-decorator-pattern)
  - [7. Value Object Pattern](#7-value-object-pattern)
- [Principios SOLID](#principios-solid)
- [Conclusiones](#conclusiones)

---

## 📖 Introducción

**EcoMove** es un sistema backend para la gestión de préstamos de transporte ecológico (bicicletas y patinetas eléctricas). El proyecto está construido siguiendo **Clean Architecture** y principios **SOLID**, implementando múltiples patrones de diseño para garantizar:

- ✅ Código mantenible y escalable
- ✅ Bajo acoplamiento entre componentes
- ✅ Alta cohesión
- ✅ Facilidad para testing
- ✅ Extensibilidad sin modificar código existente

---

## 🏗️ Arquitectura General

El proyecto sigue **Clean Architecture** (Arquitectura Hexagonal) con las siguientes capas:

```
ecomove-backend/
├── src/
│   ├── core/                    # Capa de dominio (lógica de negocio)
│   │   ├── domain/
│   │   │   ├── entities/        # Entidades del dominio
│   │   │   ├── repositories/    # Interfaces de repositorios
│   │   │   ├── services/        # Servicios del dominio
│   │   │   └── value-objects/   # Value Objects
│   │   └── use-cases/           # Casos de uso (aplicación)
│   ├── infrastructure/          # Capa de infraestructura
│   │   ├── database/            # Implementaciones de repositorios
│   │   ├── services/            # Implementaciones de servicios
│   │   └── persistence/         # Acceso a datos
│   ├── presentation/            # Capa de presentación
│   │   └── http/
│   │       ├── controllers/     # Controladores HTTP
│   │       ├── middleware/      # Middlewares
│   │       └── routes/          # Definición de rutas
│   ├── config/                  # Configuración
│   │   └── container.ts         # Contenedor de DI
│   └── shared/                  # Código compartido
```

---

## 🎯 Patrones de Diseño Implementados

### 1. Singleton Pattern

#### 📍 Ubicación
**Archivo:** `src/config/container.ts`

#### 🎨 Propósito
Garantizar que exista **una única instancia** del contenedor de dependencias (`DIContainer`) durante toda la ejecución de la aplicación, proporcionando un punto de acceso global a todos los servicios y repositorios.

#### 💡 Explicación del Patrón
El patrón **Singleton** restringe la instanciación de una clase a un único objeto. Es útil cuando se necesita coordinar acciones en todo el sistema desde un único punto.

**Características:**
- Constructor privado (no se puede instanciar desde fuera)
- Método estático `getInstance()` que devuelve siempre la misma instancia
- La instancia se crea de forma lazy (cuando se solicita por primera vez)

#### 📝 Implementación

```typescript
export class DIContainer {
  private static instance: DIContainer;  // ✅ Instancia única estática
  private pool: Pool;
  private cache!: CacheService;
  // ... otras dependencias

  private constructor() {  // ✅ Constructor privado
    this.pool = DatabaseConfig.createPool();
    this.initializeDependencies();
  }

  static getInstance(): DIContainer {  // ✅ Método estático de acceso
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }
  
  // ... métodos de gestión de dependencias
}
```

#### ✨ Beneficios
- **Punto único de acceso:** Todas las dependencias se obtienen desde un lugar centralizado
- **Gestión de recursos:** Evita crear múltiples conexiones a la base de datos
- **Consistencia:** Garantiza que todos los componentes usen las mismas instancias

#### 🔧 Uso en el Proyecto
```typescript
// En cualquier parte del código
const container = DIContainer.getInstance();
const userRepository = container.getUserRepository();
const loanController = container.getLoanController();
```

---

### 2. Repository Pattern

#### 📍 Ubicación
**Interfaces:** `src/core/domain/repositories/*.repository.ts`  
**Implementaciones:** `src/infrastructure/database/repositories/*.repository.ts`

#### 🎨 Propósito
Abstraer el acceso a datos, desacoplando la lógica de negocio de los detalles de persistencia (PostgreSQL en este caso).

#### 💡 Explicación del Patrón
El patrón **Repository** actúa como una colección en memoria de objetos del dominio, proporcionando una interfaz para operaciones CRUD sin exponer los detalles de la base de datos.

**Características:**
- Define una interfaz con operaciones de acceso a datos
- Oculta las queries SQL y la lógica de base de datos
- Permite cambiar la implementación sin afectar la lógica de negocio

#### 📝 Implementación

**Interfaz (Dominio):**
```typescript
// src/core/domain/repositories/user.repository.ts
export interface UserRepository {
  save(user: User): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findAll(page: number, limit: number): Promise<PaginatedResponse<User>>;
  update(user: User): Promise<User>;
  delete(id: number): Promise<void>;
  getStats(): Promise<UserStats>;
}
```

**Implementación (Infraestructura):**
```typescript
// src/infrastructure/persistence/postgresql/user.repository.ts
export class PostgreSQLUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async save(user: User): Promise<User> {
    const userData = user.toPersistence();
    const query = `
      INSERT INTO usuarios (nombre, correo, documento, telefono, password_hash, rol, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at, updated_at
    `;
    const result = await this.pool.query(query, [
      userData.nombre, userData.correo, userData.documento,
      userData.telefono, userData.password, userData.rol, userData.estado
    ]);
    
    return User.fromPersistence({ ...userData, ...result.rows[0] });
  }
  
  // ... otras implementaciones
}
```

#### ✨ Beneficios
- **Testabilidad:** Se pueden crear mocks de repositorios para testing
- **Flexibilidad:** Cambiar de PostgreSQL a MongoDB solo requiere nueva implementación
- **Separación de responsabilidades:** La lógica de negocio no conoce SQL

#### 🔧 Repositorios Implementados
1. **UserRepository** - Gestión de usuarios
2. **TransportRepository** - Gestión de transportes
3. **StationRepository** - Gestión de estaciones
4. **LoanRepository** - Gestión de préstamos

---

### 3. Factory Method Pattern

#### 📍 Ubicación
**Archivos:** 
- `src/core/domain/entities/loan.entity.ts`
- `src/core/domain/entities/transport.entity.ts`
- `src/core/domain/entities/user.entity.ts`

#### 🎨 Propósito
Encapsular la lógica de creación de entidades del dominio, asegurando que siempre se creen en un estado válido y consistente.

#### 💡 Explicación del Patrón
El patrón **Factory Method** define una interfaz para crear objetos, pero permite que las subclases decidan qué clase instanciar. Delega la instanciación a métodos especializados.

**Características:**
- Métodos estáticos que crean instancias
- Validación en el momento de creación
- Diferentes métodos para diferentes formas de creación

#### 📝 Implementación

```typescript
// src/core/domain/entities/loan.entity.ts
export class Loan {
  private constructor(
    private id: number | null,
    private userId: number,
    private transportId: number,
    private originStationId: number,
    // ... otros campos
  ) {}

  // ✅ Factory Method: Crear un préstamo nuevo
  static create(
    userId: number,
    transportId: number,
    originStationId: number,
    estimatedDuration?: number
  ): Loan {
    // Validaciones
    if (userId <= 0) throw new Error('ID de usuario inválido');
    if (transportId <= 0) throw new Error('ID de transporte inválido');
    
    return new Loan(
      null,                    // ID aún no asignado
      userId,
      transportId,
      originStationId,
      null,                    // Sin estación destino
      new Date(),              // Fecha actual
      null,                    // Sin fecha fin
      estimatedDuration || null,
      null,                    // Sin costo
      LoanStatus.ACTIVE,       // Estado inicial
      null,                    // Sin método de pago
      new Date(),
      new Date()
    );
  }

  // ✅ Factory Method: Reconstruir desde base de datos
  static fromPersistence(data: any): Loan {
    return new Loan(
      data.id,
      data.usuario_id,
      data.transporte_id,
      data.estacion_origen_id,
      data.estacion_destino_id,
      new Date(data.fecha_inicio),
      data.fecha_fin ? new Date(data.fecha_fin) : null,
      data.duracion_estimada,
      data.costo_total,
      data.estado as LoanStatus,
      data.metodo_pago as PaymentMethod | null,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }
}
```

#### ✨ Beneficios
- **Validación centralizada:** Toda entidad se crea validada
- **Intención clara:** `Loan.create()` vs `Loan.fromPersistence()`
- **Encapsulación:** El constructor es privado, solo los factory methods pueden crear instancias

#### 🔧 Factory Methods en el Proyecto
- `User.create()` - Crear usuario nuevo
- `User.fromPersistence()` - Reconstruir desde BD
- `Loan.create()` - Crear préstamo
- `Transport.create()` - Crear transporte
- `Station.create()` - Crear estación

---

### 4. Dependency Injection (DI)

#### 📍 Ubicación
**Archivo principal:** `src/config/container.ts`  
**Uso en:** Todos los use cases, controllers, y servicios

#### 🎨 Propósito
Invertir el control de las dependencias, permitiendo que los objetos reciban sus dependencias desde el exterior en lugar de crearlas ellos mismos.

#### 💡 Explicación del Patrón
**Dependency Injection** es un patrón donde un objeto recibe otros objetos de los que depende (sus dependencias) en lugar de crearlos internamente.

**Características:**
- Las dependencias se inyectan a través del constructor
- Reduce el acoplamiento
- Facilita el testing (se pueden inyectar mocks)

#### 📝 Implementación

**Contenedor de DI:**
```typescript
// src/config/container.ts
export class DIContainer {
  private userRepository!: UserRepository;
  private loanRepository!: LoanRepository;
  private createLoanUseCase!: CreateLoanUseCase;
  private loanController!: LoanController;
  
  private initializeRepositories(): void {
    this.userRepository = new PostgreSQLUserRepository(this.pool);
    this.loanRepository = new PostgreSQLLoanRepository(this.pool);
  }
  
  private initializeUseCases(): void {
    // ✅ Inyectando dependencias al Use Case
    this.createLoanUseCase = new CreateLoanUseCase(
      this.loanRepository,
      this.userRepository,
      this.transportRepository,
      this.stationRepository,
      this.logger
    );
  }
  
  private initializeControllers(): void {
    // ✅ Inyectando use cases al Controller
    this.loanController = new LoanController(
      this.createLoanUseCase,
      this.completeLoanUseCase,
      this.cancelLoanUseCase,
      // ... otros use cases
    );
  }
}
```

**Use Case con DI:**
```typescript
// src/core/use-cases/loan/create-loan.use-case.ts
export class CreateLoanUseCase {
  constructor(
    private readonly loanRepository: LoanRepository,      // ✅ Inyectado
    private readonly userRepository: UserRepository,      // ✅ Inyectado
    private readonly transportRepository: TransportRepository, // ✅ Inyectado
    private readonly stationRepository: StationRepository, // ✅ Inyectado
    private readonly logger: LoggerService                // ✅ Inyectado
  ) {}
  
  async execute(data: CreateLoanDto): Promise<Loan> {
    // Usa las dependencias inyectadas
    const user = await this.userRepository.findById(data.usuario_id);
    const transport = await this.transportRepository.findById(data.transporte_id);
    // ... lógica del caso de uso
  }
}
```

#### ✨ Beneficios
- **Testabilidad:** Fácil inyectar mocks en los tests
- **Bajo acoplamiento:** Los componentes no dependen de implementaciones concretas
- **Configuración centralizada:** Todas las dependencias se gestionan en un lugar

#### 🔧 Ejemplo de Testing
```typescript
// En un test
const mockLoanRepo = {
  save: jest.fn(),
  findById: jest.fn()
};

const useCase = new CreateLoanUseCase(
  mockLoanRepo,      // ✅ Mock inyectado
  mockUserRepo,
  mockTransportRepo,
  mockStationRepo,
  mockLogger
);
```

---

### 5. Strategy Pattern

#### 📍 Ubicación
**Archivos:**
- `src/core/domain/services/password.service.ts` (interfaz)
- `src/infrastructure/services/bcrypt-password.service.ts` (estrategia concreta)
- `src/core/domain/services/payment.service.ts` (interfaz)
- `src/infrastructure/services/stripe-payment.service.ts` (estrategia concreta)

#### 🎨 Propósito
Definir una familia de algoritmos intercambiables, permitiendo que el algoritmo varíe independientemente de los clientes que lo usan.

#### 💡 Explicación del Patrón
El patrón **Strategy** define una familia de algoritmos, encapsula cada uno y los hace intercambiables. Permite que el algoritmo varíe independientemente de los clientes que lo usan.

**Características:**
- Define una interfaz común para todas las estrategias
- Cada estrategia implementa la interfaz de forma diferente
- El cliente trabaja con la interfaz, no con implementaciones concretas

#### 📝 Implementación

**Interfaz de Estrategia:**
```typescript
// src/core/domain/services/password.service.ts
export interface PasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hashedPassword: string): Promise<boolean>;
  generateTemporary(): string;
}
```

**Estrategia Concreta (Bcrypt):**
```typescript
// src/infrastructure/services/bcrypt-password.service.ts
export class BcryptPasswordService implements PasswordService {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateTemporary(): string {
    return Math.random().toString(36).slice(-8);
  }
}
```

**Otra Estrategia de Pago:**
```typescript
// src/core/domain/services/payment.service.ts
export interface PaymentService {
  processPayment(amount: number, paymentMethod: PaymentMethod): Promise<boolean>;
  refundPayment(transactionId: string): Promise<boolean>;
}

// src/infrastructure/services/stripe-payment.service.ts
export class StripePaymentService implements PaymentService {
  async processPayment(amount: number, method: PaymentMethod): Promise<boolean> {
    // Implementación con Stripe API
    return true;
  }
  
  async refundPayment(transactionId: string): Promise<boolean> {
    // Lógica de reembolso con Stripe
    return true;
  }
}
```

#### ✨ Beneficios
- **Extensibilidad:** Fácil agregar nuevas estrategias sin modificar código existente
- **Open/Closed Principle:** Abierto a extensión, cerrado a modificación
- **Flexibilidad:** Cambiar de algoritmo en tiempo de ejecución

#### 🔧 Uso en el Proyecto
```typescript
// Se inyecta la estrategia
const passwordService: PasswordService = new BcryptPasswordService();
const hashedPassword = await passwordService.hash('myPassword');

// Si mañana queremos usar Argon2:
const passwordService: PasswordService = new Argon2PasswordService();
// El código cliente no cambia
```

---

### 6. Decorator Pattern

#### 📍 Ubicación
**Archivos:**
- `src/infrastructure/database/repositories/cached-transport.repository.ts`
- `src/infrastructure/database/repositories/cached-station.repository.ts`

#### 🎨 Propósito
Agregar funcionalidad de **caching** a los repositorios sin modificar su código original, envolviendo el repositorio base con una capa de caché.

#### 💡 Explicación del Patrón
El patrón **Decorator** permite agregar funcionalidades a objetos de forma dinámica, envolviendo el objeto original en un objeto decorador que implementa la misma interfaz.

**Características:**
- El decorador implementa la misma interfaz que el objeto decorado
- Agrega comportamiento antes/después de delegar al objeto original
- Múltiples decoradores pueden apilarse

#### 📝 Implementación

```typescript
// src/infrastructure/database/repositories/cached-transport.repository.ts
export class CachedTransportRepository implements TransportRepository {
  private readonly CACHE_TTL = {
    SINGLE_TRANSPORT: 600,    // 10 minutos
    TRANSPORT_LIST: 300,      // 5 minutos
    AVAILABILITY: 120         // 2 minutos
  };

  constructor(
    private readonly baseRepository: TransportRepository,  // ✅ Repositorio original
    private readonly cache: CacheService,                   // ✅ Servicio de cache
    private readonly logger: LoggerService
  ) {}

  async findById(id: number): Promise<Transport | null> {
    const cacheKey = `transport:id:${id}`;
    
    // ✅ Intentar obtener del cache
    const cached = this.cache.get<Transport>(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit', { id });
      return cached;
    }

    // ✅ Cache miss: delegar al repositorio original
    this.logger.debug('Cache miss', { id });
    const transport = await this.baseRepository.findById(id);
    
    // ✅ Guardar en cache
    if (transport) {
      this.cache.set(cacheKey, transport, this.CACHE_TTL.SINGLE_TRANSPORT);
    }

    return transport;
  }

  // Delegar todos los métodos agregando caching
  async save(transport: Transport): Promise<Transport> {
    const result = await this.baseRepository.save(transport);
    
    // ✅ Invalidar cache relacionado
    this.cache.del(`transport:id:${result.getId()}`);
    
    return result;
  }
  
  // ... otros métodos decorados
}
```

**Configuración del Decorator:**
```typescript
// src/config/container.ts
private initializeRepositories(): void {
  const baseTransportRepository = new PostgreSQLTransportRepository(this.pool);
  
  // ✅ Decorar el repositorio base con caching
  this.transportRepository = new CachedTransportRepository(
    baseTransportRepository,
    this.cache,
    this.logger
  );
}
```

#### ✨ Beneficios
- **No modifica el original:** El repositorio base no sabe del caching
- **Composición:** Se puede agregar/quitar decoradores fácilmente
- **Single Responsibility:** Cada clase tiene una responsabilidad
- **Rendimiento:** Reduce consultas a la base de datos

#### 🔧 Decoradores Implementados
1. **CachedTransportRepository** - Cachea transportes
2. **CachedStationRepository** - Cachea estaciones

---

### 7. Value Object Pattern

#### 📍 Ubicación
**Archivos:**
- `src/core/domain/value-objects/email.vo.ts`
- `src/core/domain/value-objects/document-number.vo.ts`
- `src/core/domain/value-objects/phone-number.vo.ts`

#### 🎨 Propósito
Representar conceptos del dominio que se definen por su **valor** y no por su identidad, asegurando validación y comportamiento consistente.

#### 💡 Explicación del Patrón
Un **Value Object** es un objeto inmutable que representa un concepto del dominio definido por sus atributos, no por una identidad única.

**Características:**
- **Inmutabilidad:** No puede cambiar después de creado
- **Validación:** Siempre en estado válido
- **Igualdad por valor:** Dos value objects con los mismos valores son iguales
- **Sin identidad:** No tienen ID, se identifican por su contenido

#### 📝 Implementación

```typescript
// src/core/domain/value-objects/email.vo.ts
export class Email {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value.toLowerCase().trim();
  }

  get value(): string {
    return this._value;  // ✅ Solo getter, no setter (inmutable)
  }

  private validate(email: string): void {
    if (!email || !email.trim()) {
      throw new ValidationException('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationException('Invalid email format');
    }
  }

  equals(other: Email): boolean {
    return this._value === other._value;  // ✅ Igualdad por valor
  }

  toString(): string {
    return this._value;
  }
}
```

```typescript
// src/core/domain/value-objects/phone-number.vo.ts
export class PhoneNumber {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = this.normalize(value);
  }

  private validate(phone: string): void {
    if (!phone || !phone.trim()) {
      throw new ValidationException('Phone number is required');
    }

    // Formato colombiano
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^(\+57)?[3][0-9]{9}$/.test(cleanPhone)) {
      throw new ValidationException('Invalid Colombian phone number');
    }
  }

  private normalize(phone: string): string {
    let clean = phone.replace(/[\s\-\(\)]/g, '');
    if (!clean.startsWith('+57')) {
      clean = '+57' + clean;
    }
    return clean;
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }
}
```

#### ✨ Beneficios
- **Validación automática:** No puede existir un Email inválido
- **Semántica clara:** `Email` es más expresivo que `string`
- **Reutilización:** La lógica de validación está centralizada
- **Type Safety:** El sistema de tipos ayuda a prevenir errores

#### 🔧 Uso en el Proyecto
```typescript
// En lugar de:
const email: string = "user@example.com";  // ❌ Puede ser inválido

// Usamos:
const email = new Email("user@example.com");  // ✅ Siempre válido
const emailValue = email.value;  // Obtener el string

// En las entidades:
export class User {
  constructor(
    private email: Email,           // ✅ Value Object
    private phoneNumber: PhoneNumber,  // ✅ Value Object
    private document: DocumentNumber   // ✅ Value Object
  ) {}
}
```

---

## 🎓 Principios SOLID

### 1. **Single Responsibility Principle (SRP)**
Cada clase tiene una única responsabilidad:
- `CreateLoanUseCase`: Solo crea préstamos
- `PostgreSQLLoanRepository`: Solo maneja persistencia de préstamos
- `LoanController`: Solo maneja requests HTTP de préstamos

### 2. **Open/Closed Principle (OCP)**
Abierto a extensión, cerrado a modificación:
- Nuevas estrategias de pago sin modificar `PaymentService`
- Nuevas implementaciones de repositorios sin cambiar interfaces

### 3. **Liskov Substitution Principle (LSP)**
Las implementaciones son sustituibles:
```typescript
const repo: TransportRepository = new PostgreSQLTransportRepository(pool);
// O
const repo: TransportRepository = new CachedTransportRepository(base, cache);
// Ambos funcionan igual para el cliente
```

### 4. **Interface Segregation Principle (ISP)**
Interfaces específicas por módulo:
- `UserRepository` solo métodos de usuarios
- `LoanRepository` solo métodos de préstamos

### 5. **Dependency Inversion Principle (DIP)**
Depender de abstracciones, no de concreciones:
```typescript
// Use Case depende de la interfaz, no de la implementación
constructor(private readonly loanRepository: LoanRepository) {}
```

---

## 🏆 Conclusiones

### Ventajas de la Arquitectura Implementada

1. **Mantenibilidad**
   - Código organizado por responsabilidades
   - Fácil localizar y corregir bugs
   - Cambios aislados no afectan otros módulos

2. **Testabilidad**
   - Inyección de dependencias facilita mocking
   - Cada componente se puede probar aisladamente
   - Alta cobertura de tests posible

3. **Escalabilidad**
   - Fácil agregar nuevas funcionalidades
   - Patrones permiten extensión sin modificación
   - Clean Architecture permite crecer ordenadamente

4. **Flexibilidad**
   - Cambiar base de datos: nueva implementación de repositorio
   - Cambiar servicio de pago: nueva estrategia
   - Agregar caching: decorador adicional

### Patrones Aplicados por Capa

| Capa | Patrones |
|------|----------|
| **Domain** | Value Object, Factory Method |
| **Use Cases** | Dependency Injection |
| **Infrastructure** | Repository, Strategy, Decorator |
| **Presentation** | MVC (Controllers) |
| **Configuration** | Singleton (DI Container) |

### Resultado Final

El proyecto EcoMove demuestra cómo la combinación de:
- ✅ Clean Architecture
- ✅ Principios SOLID
- ✅ Patrones de Diseño

Resultan en un sistema backend **robusto**, **mantenible**, **testeable** y **preparado para el crecimiento**.

---

## 📚 Referencias

- **Clean Architecture** - Robert C. Martin
- **Design Patterns** - Gang of Four
- **Domain-Driven Design** - Eric Evans
- **SOLID Principles** - Robert C. Martin

---

**Autor:** Equipo EcoMove  
**Fecha:** 2025  
**Versión:** 2.0.0
