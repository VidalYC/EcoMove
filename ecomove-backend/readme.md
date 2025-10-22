/**
   * Invalida cachés de disponibilidad (cuando cambia el estado)
   */
  private invalidateAvailabilityCaches(): void {
    this.logger.debug('Invalidating availability caches');
    // Todas las claves que comienzan con 'transport:available-station:*'
  }

  /**
   * Genera hash de filtros para la clave de caché
   */
  private hashFilters(filters: TransportFilters): string {
    return JSON.stringify({
      type: filters.type || null,
      status: filters.status || null,
      stationId: filters.stationId || null,
      minRate: filters.minRate || null,
      maxRate: filters.maxRate || null
    });
  }

  // ========== DELEGACIÓN DIRECTA (sin caché) ==========
  
  // Estos métodos simplemente delegan al repositorio base
  // porque son operaciones especializadas o de escritura
  
  async createBicycle(data: any): Promise<Bicycle> {
    const result = await this.baseRepository.createBicycle(data);
    this.invalidateListCaches();
    return result;
  }

  async createElectricScooter(data: any): Promise<ElectricScooter> {
    const result = await this.baseRepository.createElectricScooter(data);
    this.invalidateListCaches();
    return result;
  }

  async updateBatteryLevel(id: number, level: number): Promise<boolean> {
    const result = await this.baseRepository.updateBatteryLevel(id, level);
    if (result) {
      this.invalidateTransportCaches(id);
    }
    return result;
  }

  async getStats(): Promise<TransportStats> {
    const cacheKey = MemoryCacheService.generateKey('transport', 'stats');
    
    const cached = this.cache.get<TransportStats>(cacheKey);
    if (cached) {
      this.logger.debug('Transport stats cache HIT');
      return cached;
    }

    const stats = await this.baseRepository.getStats();
    this.cache.set(cacheKey, stats, this.CACHE_TTL.STATS);
    
    return stats;
  }
}
```

### 🔍 Configuración y Uso en el Proyecto

**Configuración en DIContainer (Composición de Decorators)**
```typescript
// src/config/container.ts
export class DIContainer {
  private transportRepository!: TransportRepository;
  private cache!: CacheService;
  private logger!: LoggerService;

  private initializeRepositories(): void {
    // 1. Crear el repositorio BASE (PostgreSQL)
    const baseTransportRepository = new PostgreSQLTransportRepository(this.pool);
    
    // 2. "Decorar" el repositorio base con caché
    this.transportRepository = new CachedTransportRepository(
      baseTransportRepository,  // ← El repositorio que decoramos
      this.cache,
      this.logger
    );
    
    // ✅ Ahora transportRepository tiene:
    // - Toda la funcionalidad de PostgreSQLTransportRepository
    // - PLUS: Caché automático
    // - PLUS: Logging de operaciones de caché
    
    console.log('✅ CachedTransportRepository created');
  }

  getTransportRepository(): TransportRepository {
    return this.transportRepository;
  }
}
```

**Activar/Desactivar Caché según Entorno**
```typescript
// src/config/container.ts
private initializeRepositories(): void {
  const baseTransportRepository = new PostgreSQLTransportRepository(this.pool);
  
  // Decorator Pattern permite configuración flexible
  if (process.env.ENABLE_CACHE === 'true') {
    // Producción: Con caché
    this.transportRepository = new CachedTransportRepository(
      baseTransportRepository,
      this.cache,
      this.logger
    );
    console.log('✅ Cache enabled for TransportRepository');
  } else {
    // Desarrollo/Testing: Sin caché
    this.transportRepository = baseTransportRepository;
    console.log('⚠️  Cache disabled for TransportRepository');
  }
}
```

**Composición de Múltiples Decorators (futuro)**
```typescript
// Podemos apilar decorators para añadir múltiples comportamientos
private initializeRepositories(): void {
  let repository: TransportRepository = new PostgreSQLTransportRepository(this.pool);
  
  // Decorator 1: Logging
  repository = new LoggingTransportRepository(repository, this.logger);
  
  // Decorator 2: Caché (sobre el logging)
  repository = new CachedTransportRepository(repository, this.cache, this.logger);
  
  // Decorator 3: Métricas (sobre el caché)
  repository = new MetricsTransportRepository(repository, this.metricsService);
  
  this.transportRepository = repository;
  
  // Resultado: PostgreSQL → Logging → Caché → Métricas
  // Cada capa añade funcionalidad sin modificar las anteriores
}
```

### 📊 Diagrama de Flujo del Decorator

```
┌────────────────────────────────────────────────────────────────┐
│                    USE CASE / CONTROLLER                        │
│  transportRepository.findById(5)                                │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│              CachedTransportRepository (DECORATOR)              │
│                                                                 │
│  findById(5) {                                                  │
│    1. Generar clave: "transport:id:5"                           │
│    2. ¿Existe en caché?                                         │
│       │                                                          │
│       ├─ SÍ ──────────────────────┐                            │
│       │                            ▼                            │
│       │                    ┌──────────────┐                    │
│       │                    │ CACHE HIT ✅ │                    │
│       │                    │ Return cached│                    │
│       │                    └──────────────┘                    │
│       │                            │                            │
│       └─ NO ──────────────┐        │                           │
│                            ▼        │                           │
│                    ┌──────────────┐ │                          │
│                    │ CACHE MISS ❌│ │                          │
│                    └──────┬───────┘ │                          │
│                           │         │                           │
│                           ▼         │                           │
│    3. Llamar al baseRepository.findById(5)                      │
│                           │         │                           │
└───────────────────────────┼─────────┼───────────────────────────┘
                            │         │
                            ▼         │
┌────────────────────────────────────────────────────────────────┐
│         PostgreSQLTransportRepository (BASE/DECORADO)           │
│                                                                 │
│  findById(5) {                                                  │
│    const query = 'SELECT * FROM transportes WHERE id = $1';     │
│    const result = await this.pool.query(query, [5]);           │
│    return Transport.fromPersistence(result.rows[0]);           │
│  }                                                              │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │   Database   │
                    └──────┬───────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│              CachedTransportRepository (DECORATOR)              │
│                                                                 │
│    4. Recibe resultado del base repository                      │
│    5. Guardar en caché:                                         │
│       cache.set("transport:id:5", transport, 300)              │
│    6. Return transport                                          │
│                                                                 │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                    USE CASE / CONTROLLER                        │
│  Recibe: Transport { id: 5, model: "...", ... }                │
└────────────────────────────────────────────────────────────────┘

PRÓXIMA LLAMADA (dentro de 5 minutos):
  findById(5) → CACHE HIT ✅ → Return inmediato (sin DB query)
```

### 🎯 Ventajas Específicas en EcoMove

**1. Performance Mejorado Drásticamente**
```typescript
// Escenario: Página de dashboard que muestra transportes disponibles

// SIN CACHÉ (primera versión):
// - Query a BD: ~50ms
// - 1000 requests/hora = 50,000ms = 50 segundos de DB time
// - DB sobrecargada

// CON CACHÉ (Decorator Pattern):
// Primera request: 50ms (cache miss)
// Siguientes 999 requests: ~1ms (cache hit)
// Total: 50ms + 999ms = 1,049ms ≈ 1 segundo
// ✅ 50x más rápido
// ✅ 999 queries menos a la BD
```

**2. Zero Código Cambiado en Use Cases**
```typescript
// src/core/use-cases/transport/get-all-transports.use-case.ts

// El use case NO CAMBIÓ EN ABSOLUTO
export class GetAllTransportsUseCase {
  constructor(
    private readonly transportRepository: TransportRepository
  ) {}

  async execute(page: number, limit: number, filters?: TransportFilters) {
    // Esta línea es EXACTAMENTE la misma
    return await this.transportRepository.findAll(page, limit, filters);
    
    // Pero ahora tiene caché gracias al Decorator
    // Sin modificar ni una línea de este código
  }
}

// ✅ Open/Closed Principle: Extendido sin modificación
```

**3. Invalidación Inteligente**
```typescript
// Cuando se actualiza un transporte, el caché se invalida automáticamente
await transportRepository.updateStatus(5, 'maintenance');

// El decorator automáticamente:
// 1. Actualiza en la BD
// 2. Invalida cache.get('transport:id:5')
// 3. Invalida cache de listas que podrían incluir este transporte
// 4. Invalida cache de estadísticas
// 5. Invalida cache de disponibilidad

// Próxima consulta: Cache miss → datos frescos de BD ✅
```

**4. Métricas y Observabilidad**
```typescript
// El decorator logea todas las operaciones de caché
this.logger.debug('Transport cache HIT', { id: 5, cacheKey: 'transport:id:5' });
this.logger.debug('Transport cache MISS', { id: 10 });

// Podemos medir:
// - Hit rate del caché
// - Qué queries son más frecuentes
// - Efectividad del TTL
// - Cuánta carga quitamos de la BD

// Ejemplo de análisis:
// Cache hit rate: 85%
// Significa: 85% de requests NO tocan la BD
// Si tenemos 10,000 requests/hora → 8,500 evitan la BD
```

**5. TTL Diferenciado por Tipo de Dato**
```typescript
private readonly CACHE_TTL = {
  SINGLE_TRANSPORT: 300,      // 5 min - Datos estables (modelo, marca)
  TRANSPORT_LIST: 120,        // 2 min - Puede cambiar (nuevos transportes)
  AVAILABLE_TRANSPORTS: 60,   // 1 min - Alta rotación (préstamos)
  STATS: 180                  // 3 min - Cálculos costosos pero no críticos
};

// Balanceo entre:
// - Frescura de datos (lower TTL)
// - Performance (higher TTL)
// - Naturaleza de cada dato
```

**6. Testing Sigue Siendo Simple**
```typescript
// En tests, simplemente NO usamos el decorator
describe('CreateTransportUseCase', () => {
  let mockRepo: MockTransportRepository;
  
  beforeEach(() => {
    // Mock SIN caché
    mockRepo = new MockTransportRepository();
    useCase = new CreateTransportUseCase(mockRepo);
  });
  
  // Tests rápidos, predecibles, sin caché
});

// En tests de integración, SÍ podemos usar el decorator
describe('CachedTransportRepository Integration', () => {
  let cachedRepo: CachedTransportRepository;
  
  beforeEach(() => {
    const baseRepo = new PostgreSQLTransportRepository(testPool);
    cachedRepo = new CachedTransportRepository(baseRepo, cache, logger);
  });
  
  it('should cache transport after first query', async () => {
    const first = await cachedRepo.findById(1);  // Cache miss
    const second = await cachedRepo.findById(1); // Cache hit
    
    // Verificar que solo hubo 1 query a BD
    expect(queriesMade).toBe(1);
  });
});
```

### ⚠️ Consideraciones y Trade-offs

**Ventajas:**
- ✅ **Open/Closed Principle**: Añade funcionalidad sin modificar código existente
- ✅ **Composición sobre Herencia**: Más flexible que subclassing
- ✅ **Runtime Flexibility**: Puede añadirse/quitarse en tiempo de ejecución
- ✅ **Single Responsibility**: Cada decorator tiene una responsabilidad
- ✅ **Combinable**: Múltiples decorators pueden apilarse

**Desventajas:**
- ⚠️ **Complejidad**: Más objetos en memoria
- ⚠️ **Debugging**: Stack traces más largos (multiple layers)
- ⚠️ **Overhead**: Pequeña penalización en performance por cada capa
- ⚠️ **Orden importa**: El orden de los decorators afecta el comportamiento

**Problemas Potenciales y Soluciones:**

```typescript
// PROBLEMA 1: Caché desincronizado
// Si otro servicio/proceso actualiza la BD directamente

// SOLUCIÓN 1: TTL corto para datos críticos
private readonly CACHE_TTL = {
  AVAILABLE_TRANSPORTS: 30,  // Solo 30 segundos
};

// SOLUCIÓN 2: Invalidación activa con eventos
eventEmitter.on('transport-updated', (id) => {
  this.invalidateTransportCaches(id);
});

// SOLUCIÓN 3: En producción, usar Redis con pub/sub
// Múltiples instancias de la app pueden invalidar caché compartido
```

```typescript
// PROBLEMA 2: Memoria del caché crece indefinidamente

// SOLUCIÓN: Límite de keys + LRU eviction
export class MemoryCacheService {
  constructor(
    private readonly maxKeys = 10000  // Máximo 10k keys
  ) {}
  
  set(key: string, value: any, ttl: number): void {
    // Si llegamos al límite, remover las más antiguas
    if (this.cache.size >= this.maxKeys) {
      this.evictOldest();
    }
    // Guardar nueva entry
  }
}
```

**Cuándo NO usar Decorator:**
- Sistema muy simple sin necesidad de extensión
- Performance crítico (cada capa añade microsegundos)
- Equipo sin experiencia en patrones (puede confundir)

**Cuándo SÍ usar Decorator (como en EcoMove):**
- Necesitas añadir funcionalidad sin modificar código
- Quieres mantener Open/Closed Principle
- Necesitas activar/desactivar features dinámicamente
- Múltiples comportamientos transversales (cache, logging, metrics)

### 🔄 Variaciones Implementadas

**1. Decorator para Estaciones (similar)**
```typescript
// src/infrastructure/database/repositories/cached-station.repository.ts
export class CachedStationRepository implements StationRepository {
  private readonly CACHE_TTL = {
    SINGLE_STATION: 600,       // 10 min (estaciones cambian poco)
    STATION_LIST: 300,         // 5 min
    NEARBY_STATIONS: 180,      // 3 min (consulta muy frecuente)
    AVAILABILITY: 60,          // 1 min (cambia con cada préstamo)
    STATS: 300                 // 5 min
  };
  
  // Misma estructura que CachedTransportRepository
  // TTL más largos porque estaciones son más estables
}
```

**2. Posibles Decorators Futuros**
```typescript
// Logging Decorator (registra todas las operaciones)
export class LoggingTransportRepository implements TransportRepository {
  constructor(
    private readonly baseRepository: TransportRepository,
    private readonly logger: LoggerService
  ) {}
  
  async findById(id: number): Promise<Transport | null> {
    this.logger.info('Finding transport by ID', { id });
    const start = Date.now();
    
    const result = await this.baseRepository.findById(id);
    
    this.logger.info('Transport found', { 
      id, 
      found: !!result,
      duration: Date.now() - start 
    });
    
    return result;
  }
}

// Metrics Decorator (recolecta métricas)
export class MetricsTransportRepository implements TransportRepository {
  constructor(
    private readonly baseRepository: TransportRepository,
    private readonly metrics: MetricsService
  ) {}
  
  async findById(id: number): Promise<Transport | null> {
    const timer = this.metrics.startTimer('transport.findById');
    
    const result = await this.baseRepository.findById(id);
    
    timer.end();
    this.metrics.increment('transport.queries');
    
    return result;
  }
}

// Composición de todos:
const repo = new MetricsTransportRepository(
  new CachedTransportRepository(
    new LoggingTransportRepository(
      new PostgreSQLTransportRepository(pool),
      logger
    ),
    cache,
    logger
  ),
  metrics
);

// Flujo: PostgreSQL → Logging → Caché → Métricas
```

### 📍 Ubicación en el Proyecto
- **Implementación**: `src/infrastructure/database/repositories/cached-*.repository.ts`
- **Configuración**: `src/config/container.ts` (método `initializeRepositories`)
- **Transparente para**: `src/core/use-cases/**/*.use-case.ts` (no saben del caché)

---

Continúo con los siguientes patrones. ¿Quieres que siga con Adapter Pattern y los demás, o prefieres que profundice más en alguno de los que ya expliqué?  async findByEmail(email: Email): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [email.getValue()]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return User.fromPersistence(result.rows[0]);
  }

  async findByDocument(document: DocumentNumber): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE document_number = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [document.getValue()]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return User.fromPersistence(result.rows[0]);
  }

  async update(user: User): Promise<User> {
    const data = user.toPersistence();
    
    const query = `
      UPDATE users
      SET name = $1, phone = $2, role = $3, status = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [
      data.name,
      data.phone,
      data.role,
      data.status,
      data.id
    ]);
    
    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    return User.fromPersistence(result.rows[0]);
  }

  async delete(id: number): Promise<void> {
    // Soft delete: marca como eliminado sin borrar físicamente
    const query = 'UPDATE users SET deleted_at = NOW() WHERE id = $1';
    await this.pool.query(query, [id]);
  }

  async exists(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }

  async findAll(page: number, limit: number): Promise<PaginatedResponse<User>> {
    const offset = (page - 1) * limit;
    
    // Query con paginación
    const dataQuery = `
      SELECT * FROM users 
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    const countQuery = 'SELECT COUNT(*) FROM users WHERE deleted_at IS NULL';
    
    // Ejecutar ambas queries en paralelo
    const [dataResult, countResult] = await Promise.all([
      this.pool.query(dataQuery, [limit, offset]),
      this.pool.query(countQuery)
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    const users = dataResult.rows.map(row => User.fromPersistence(row));
    
    return {
      users,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async search(term: string, page: number, limit: number): Promise<PaginatedResponse<User>> {
    const offset = (page - 1) * limit;
    const searchTerm = `%${term}%`;
    
    const dataQuery = `
      SELECT * FROM users 
      WHERE deleted_at IS NULL 
        AND (
          name ILIKE $1 
          OR email ILIKE $1 
          OR document_number ILIKE $1
        )
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) FROM users 
      WHERE deleted_at IS NULL 
        AND (name ILIKE $1 OR email ILIKE $1 OR document_number ILIKE $1)
    `;
    
    const [dataResult, countResult] = await Promise.all([
      this.pool.query(dataQuery, [searchTerm, limit, offset]),
      this.pool.query(countQuery, [searchTerm])
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    const users = dataResult.rows.map(row => User.fromPersistence(row));
    
    return {
      users,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async getStats(): Promise<UserStats> {
    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (
          WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
        ) as new_users_this_month
      FROM users
      WHERE deleted_at IS NULL
    `;
    
    const result = await this.pool.query(query);
    const row = result.rows[0];
    
    return {
      totalUsers: parseInt(row.total_users),
      activeUsers: parseInt(row.active_users),
      admins: parseInt(row.admins),
      newUsersThisMonth: parseInt(row.new_users_this_month)
    };
  }
}
```

### 🔍 Uso en el Proyecto

**Caso 1: Use Case usando el Repository**
```typescript
// src/core/use-cases/user/get-user-profile.use-case.ts
export class GetUserProfileUseCase {
  constructor(
    private readonly userRepository: UserRepository  // ← Interfaz, no implementación
  ) {}

  async execute(userId: number): Promise<User> {
    // ✅ Código limpio, sin SQL
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    if (!user.isActive()) {
      throw new Error('Usuario inactivo');
    }
    
    return user;
  }
}

// ✅ Este use case NO SABE que estamos usando PostgreSQL
// ✅ Podría ser MongoDB, MySQL, una API externa, o un mock
```

**Caso 2: Configuración en DIContainer**
```typescript
// src/config/container.ts
export class DIContainer {
  private userRepository!: UserRepository;
  
  private initializeRepositories(): void {
    // Aquí decidimos QUÉ implementación usar
    this.userRepository = new PostgreSQLUserRepository(this.pool);
    
    // En el futuro, podríamos cambiar a:
    // this.userRepository = new MongoDBUserRepository(this.mongoClient);
    // this.userRepository = new APIUserRepository(this.httpClient);
    
    // Y NINGÚN use case necesitaría cambiar
  }
  
  getUserRepository(): UserRepository {
    return this.userRepository;
  }
}
```

**Caso 3: Testing con Mock Repository**
```typescript
// tests/unit/use-cases/get-user-profile.use-case.test.ts

// Mock del repositorio
class MockUserRepository implements UserRepository {
  private users: Map<number, User> = new Map();
  
  async save(user: User): Promise<User> {
    this.users.set(user.getId()!, user);
    return user;
  }
  
  async findById(id: number): Promise<User | null> {
    return this.users.get(id) || null;
  }
  
  async findByEmail(email: Email): Promise<User | null> {
    // Mock implementation
    return null;
  }
  
  // ... resto de métodos mock
}

describe('GetUserProfileUseCase', () => {
  let useCase: GetUserProfileUseCase;
  let mockRepo: MockUserRepository;
  
  beforeEach(() => {
    mockRepo = new MockUserRepository();
    useCase = new GetUserProfileUseCase(mockRepo);
  });
  
  it('should return user profile when user exists', async () => {
    // Arrange: Preparar datos de prueba
    const testUser = User.createNew(
      'Test User',
      'test@example.com',
      '12345678',
      '3001234567',
      'hashedPassword'
    );
    await mockRepo.save(testUser);
    
    // Act: Ejecutar el caso de uso
    const result = await useCase.execute(testUser.getId()!);
    
    // Assert: Verificar resultado
    expect(result).toBeDefined();
    expect(result.getName()).toBe('Test User');
  });
  
  it('should throw error when user does not exist', async () => {
    // Act & Assert
    await expect(
      useCase.execute(999)
    ).rejects.toThrow('Usuario no encontrado');
  });
});

// ✅ Tests rápidos: sin BD real, sin I/O
// ✅ Tests aislados: cada test es independiente
// ✅ Tests controlables: datos predecibles
```

### 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │ Controller 1 │      │ Controller 2 │      │ Controller 3 │ │
│  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘ │
│         │                     │                     │          │
└─────────┼─────────────────────┼─────────────────────┼──────────┘
          │                     │                     │
          ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │  Use Case 1  │      │  Use Case 2  │      │  Use Case 3  │ │
│  │              │      │              │      │              │ │
│  │ Depende de:  │      │ Depende de:  │      │ Depende de:  │ │
│  │ UserRepository│      │ UserRepository│      │ UserRepository│ │
│  │  (interfaz)  │      │  (interfaz)  │      │  (interfaz)  │ │
│  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘ │
│         │                     │                     │          │
│         └─────────────────────┼─────────────────────┘          │
│                               │                                │
└───────────────────────────────┼────────────────────────────────┘
                                │
                                │ Inyección de Dependencias
                                │
┌───────────────────────────────▼────────────────────────────────┐
│                      DOMAIN LAYER                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │          UserRepository (INTERFAZ)                      │    │
│  │                                                          │    │
│  │  + save(user: User): Promise<User>                      │    │
│  │  + findById(id: number): Promise<User | null>           │    │
│  │  + findByEmail(email: Email): Promise<User | null>      │    │
│  │  + update(user: User): Promise<User>                    │    │
│  │  + delete(id: number): Promise<void>                    │    │
│  │  + findAll(page, limit): Promise<PaginatedResponse>     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                                ▲
                                │ Implementa
                                │
┌───────────────────────────────┼────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                            │
│                               │                                 │
│  ┌────────────────────────────┴──────────────────────────────┐ │
│  │     PostgreSQLUserRepository (IMPLEMENTACIÓN)             │ │
│  │                                                            │ │
│  │  - pool: Pool                                             │ │
│  │                                                            │ │
│  │  + save(user): Promise<User> {                            │ │
│  │      const query = 'INSERT INTO users...'                 │ │
│  │      await this.pool.query(query, values)                 │ │
│  │  }                                                         │ │
│  │                                                            │ │
│  │  + findById(id): Promise<User | null> {                   │ │
│  │      const query = 'SELECT * FROM users WHERE...'         │ │
│  │      await this.pool.query(query, [id])                   │ │
│  │  }                                                         │ │
│  │  ... resto de implementaciones SQL                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          PostgreSQL Database                                │ │
│  │          ┌──────────┐                                       │ │
│  │          │  users   │                                       │ │
│  │          │  table   │                                       │ │
│  │          └──────────┘                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 🎯 Ventajas Específicas en EcoMove

**1. Cambiar de Base de Datos sin Dolor**
```typescript
// ANTES (sin Repository Pattern):
// Si cambiamos de PostgreSQL a MongoDB:
// - Modificar 50+ use cases ❌
// - Reescribir todas las queries SQL a NoSQL ❌
// - Actualizar tests ❌
// Estimado: 2-3 semanas de trabajo 😱

// DESPUÉS (con Repository Pattern):
// Si cambiamos de PostgreSQL a MongoDB:
// 1. Crear MongoDBUserRepository implementando UserRepository
// 2. Cambiar UNA línea en DIContainer:
this.userRepository = new MongoDBUserRepository(this.mongoClient);
// 3. ¡Listo! ✅
// Estimado: 1-2 días de trabajo 🎉

// Los use cases NO CAMBIAN en absoluto
```

**2. Testing sin Base de Datos Real**
```typescript
// SIN Repository: Tests lentos
// - Cada test necesita BD corriendo
// - Setup/teardown de datos
// - Tests toman 30+ segundos
describe('Loan Tests', () => {
  beforeAll(async () => {
    await startPostgresContainer();  // 10 segundos
    await runMigrations();            // 5 segundos
  });
  // ...
});

// CON Repository: Tests rápidos
// - Mock en memoria
// - Sin I/O
// - Tests toman < 1 segundo
describe('Loan Tests', () => {
  beforeEach(() => {
    mockRepo = new MockLoanRepository();  // Instantáneo
  });
  // ...
});

// 100 tests: 50 minutos → 2 minutos 🚀
```

**3. Queries Complejas Encapsuladas**
```typescript
// En el repositorio: SQL complejo centralizado
async getUserLoanHistory(
  userId: number, 
  page: number, 
  limit: number
): Promise<UserLoanHistory> {
  const query = `
    SELECT 
      l.*,
      u.name as user_name,
      u.email as user_email,
      t.model as transport_model,
      t.type as transport_type,
      s1.name as origin_station_name,
      s2.name as destination_station_name,
      COUNT(*) OVER() as total_count
    FROM prestamos l
    INNER JOIN users u ON l.usuario_id = u.id
    INNER JOIN transportes t ON l.transporte_id = t.id
    INNER JOIN estaciones s1 ON l.estacion_origen_id = s1.id
    LEFT JOIN estaciones s2 ON l.estacion_destino_id = s2.id
    WHERE l.usuario_id = $1
    ORDER BY l.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  // Implementación compleja encapsulada
  // Los use cases solo llaman: repository.getUserLoanHistory(userId, page, limit)
}

// En el use case: Simple y limpio
const history = await this.loanRepository.getUserLoanHistory(userId, 1, 10);
// ✅ Sin SQL en la lógica de negocio
// ✅ Fácil de leer y mantener
```

**4. Caché Transparente (preparado para Decorator)**
```typescript
// El repository es la capa perfecta para añadir caché
// (Veremos esto en detalle en el patrón Decorator)

// Sin cambiar NADA en los use cases:
const user = await userRepository.findById(1);  
// Primera llamada: va a BD
// Segunda llamada: devuelve desde caché
// Los use cases ni siquiera saben que hay caché
```

**5. Estadísticas y Analytics Centralizadas**
```typescript
// Todas las consultas analíticas en un solo lugar
interface UserRepository {
  // Queries simples
  findById(id: number): Promise<User | null>;
  
  // Queries complejas/analytics
  getStats(): Promise<UserStats>;
  getGrowthRate(): Promise<GrowthMetrics>;
  getTopActiveUsers(limit: number): Promise<User[]>;
  getUsersByRegistrationMonth(): Promise<MonthlyStats[]>;
}

// Los controladores de admin solo llaman:
const stats = await userRepository.getStats();
// No necesitan saber SQL, agregaciones, etc.
```

### ⚠️ Consideraciones y Trade-offs

**Ventajas:**
- ✅ **Separación de responsabilidades**: Lógica de negocio vs acceso a datos
- ✅ **Testabilidad**: Fácil mockear para tests unitarios
- ✅ **Mantenibilidad**: Cambios en BD no afectan lógica de negocio
- ✅ **Flexibilidad**: Fácil cambiar de tecnología de persistencia
- ✅ **Reutilización**: Mismo repositorio para múltiples use cases
- ✅ **Optimización**: Lugar perfecto para añadir caché

**Desventajas:**
- ⚠️ **Capa adicional**: Más código y abstracción
- ⚠️ **Overhead**: Pequeño impacto en performance por la abstracción
- ⚠️ **Curva de aprendizaje**: Desarrolladores deben entender el patrón
- ⚠️ **Over-engineering**: Para apps muy simples puede ser excesivo

**Cuándo NO usar Repository:**
- Aplicaciones CRUD muy simples (< 5 entidades)
- Prototipos o MVPs temporales
- Scripts de un solo uso
- Cuando NO se prevén cambios de BD

**Cuándo SÍ usar Repository (como en EcoMove):**
- Aplicaciones medianas/grandes
- Múltiples fuentes de datos
- Testing importante
- Equipo de múltiples desarrolladores
- Lógica de negocio compleja
- Posibilidad de cambio de BD en el futuro

### 🔄 Variaciones del Patrón en el Proyecto

**1. Repository con Queries Especializadas**
```typescript
// LoanRepository tiene queries muy específicas del dominio
interface LoanRepository {
  // CRUD básico
  save(loan: Loan): Promise<Loan>;
  findById(id: number): Promise<Loan | null>;
  
  // Queries de negocio
  findActiveByUserId(userId: number): Promise<Loan | null>;
  findOverdueLoans(): Promise<Loan[]>;
  getMostUsedTransports(startDate: Date, endDate: Date): Promise<any[]>;
  getMostActiveStations(startDate: Date, endDate: Date): Promise<any[]>;
}

// Cada query tiene sentido en el dominio de préstamos
```

**2. Repository con Paginación**
```typescript
// Todos los métodos de listado retornan objetos paginados
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Consistencia en toda la API
const users = await userRepository.findAll(1, 10);
const loans = await loanRepository.findAll(1, 10);
const transports = await transportRepository.findAll(1, 10);
```

**3. Repository con Filtros Complejos**
```typescript
// Uso de Value Objects para filtros
const filters = TransportFilters.create({
  type: 'bicycle',
  status: 'available',
  stationId: 5,
  minRate: 1000,
  maxRate: 5000
});

const transports = await transportRepository.findAll(1, 10, filters);

// El repositorio interpreta el filtro y construye la query apropiada
```

### 📍 Ubicación en el Proyecto
- **Interfaces**: `src/core/domain/repositories/*.repository.ts`
- **Implementaciones PostgreSQL**: `src/infrastructure/database/repositories/postgresql-*.repository.ts`
- **Implementaciones con Caché**: `src/infrastructure/database/repositories/cached-*.repository.ts`
- **Uso**: `src/core/use-cases/**/*.use-case.ts`

---

## Decorator Pattern

### 📖 Definición
El patrón Decorator permite añadir responsabilidades adicionales a un objeto de forma dinámica, proporcionando una alternativa flexible a la herencia para extender funcionalidad.

### 🎯 Problema que Resuelve

**Problema 1: Extender funcionalidad sin modificar código existente**
```typescript
// ❌ PROBLEMA: Modificar el repositorio original para añadir caché
export class PostgreSQLTransportRepository {
  async findById(id: number): Promise<Transport | null> {
    // ❓ ¿Añadir caché aquí?
    // Viola Open/Closed Principle
    // Si luego queremos logging, ¿modificamos de nuevo?
    
    const query = 'SELECT * FROM transportes WHERE id = $1';
    return await this.pool.query(query, [id]);
  }
}
```

**Problema 2: Combinar múltiples comportamientos**
```typescript
// ❌ PROBLEMA: ¿Caché + Logging + Métricas?
// ¿Herencia múltiple? No existe en TypeScript
// ¿Modificar la clase base? Viola SOLID

class TransportRepositoryWithCacheAndLoggingAndMetrics {
  // Pesadilla de mantenimiento 😱
}
```

**Problema 3: Activar/desactivar features dinámicamente**
```typescript
// ❌ PROBLEMA: ¿Cómo tener caché solo en producción?
if (process.env.NODE_ENV === 'production') {
  // usar versión con caché
} else {
  // usar versión sin caché
}
// Código disperso y confuso
```

### ✅ Solución Implementada

```typescript
// src/infrastructure/database/repositories/cached-transport.repository.ts

/**
 * Decorator que añade funcionalidad de caché a cualquier TransportRepository
 * SIN MODIFICAR el repositorio original
 */
export class CachedTransportRepository implements TransportRepository {
  // Configuración de TTL para diferentes tipos de datos
  private readonly CACHE_TTL = {
    SINGLE_TRANSPORT: 300,      // 5 minutos - datos estables
    TRANSPORT_LIST: 120,        // 2 minutos - lista puede cambiar
    AVAILABLE_TRANSPORTS: 60,   // 1 minuto - alta rotación
    STATS: 180                  // 3 minutos - cálculos costosos
  };

  constructor(
    private readonly baseRepository: TransportRepository,  // ← Repositorio "decorado"
    private readonly cache: CacheService,                  // ← Servicio de caché
    private readonly logger: LoggerService                 // ← Logging opcional
  ) {}

  // ========== OPERACIONES DE LECTURA (con caché) ==========

  async findById(id: number): Promise<Transport | null> {
    // 1. Generar clave única de caché
    const cacheKey = MemoryCacheService.generateKey('transport', 'id', id);
    
    // 2. Intentar obtener del caché primero
    const cached = this.cache.get<Transport>(cacheKey);
    if (cached) {
      this.logger.debug('Transport cache HIT', { id, cacheKey });
      return cached;  // ✅ Cache hit - return rápido
    }

    // 3. Cache miss - delegar al repositorio base
    this.logger.debug('Transport cache MISS', { id, cacheKey });
    const transport = await this.baseRepository.findById(id);
    
    // 4. Si encontró resultado, guardarlo en caché para futuras consultas
    if (transport) {
      this.cache.set(cacheKey, transport, this.CACHE_TTL.SINGLE_TRANSPORT);
      this.logger.debug('Transport cached', { 
        id, 
        cacheKey,
        ttl: this.CACHE_TTL.SINGLE_TRANSPORT 
      });
    }

    return transport;
  }

  async findAll(
    page: number, 
    limit: number, 
    filters?: TransportFilters
  ): Promise<PaginatedResponse<Transport>> {
    // Generar clave que incluya todos los parámetros
    const filterHash = filters ? this.hashFilters(filters) : 'none';
    const cacheKey = MemoryCacheService.generateKey(
      'transport', 
      'list', 
      page, 
      limit, 
      filterHash
    );

    // Intentar caché
    const cached = this.cache.get<PaginatedResponse<Transport>>(cacheKey);
    if (cached) {
      this.logger.debug('Transport list cache HIT', { 
        page, 
        limit, 
        filterHash 
      });
      return cached;
    }

    // Delegar al repositorio base
    this.logger.debug('Transport list cache MISS', { page, limit });
    const result = await this.baseRepository.findAll(page, limit, filters);
    
    // Cachear resultado
    this.cache.set(cacheKey, result, this.CACHE_TTL.TRANSPORT_LIST);
    
    return result;
  }

  async findAvailableByStation(
    stationId: number, 
    type?: TransportType
  ): Promise<Transport[]> {
    const cacheKey = MemoryCacheService.generateKey(
      'transport', 
      'available-station', 
      stationId, 
      type || 'all'
    );

    const cached = this.cache.get<Transport[]>(cacheKey);
    if (cached) {
      this.logger.debug('Available transports cache HIT', { stationId, type });
      return cached;
    }

    const transports = await this.baseRepository.findAvailableByStation(
      stationId, 
      type
    );
    
    // TTL corto porque disponibilidad cambia frecuentemente
    this.cache.set(cacheKey, transports, this.CACHE_TTL.AVAILABLE_TRANSPORTS);
    
    return transports;
  }

  // ========== OPERACIONES DE ESCRITURA (invalidan caché) ==========

  async create(transport: Transport): Promise<Transport> {
    // Crear en el repositorio base
    const result = await this.baseRepository.create(transport);
    
    // Invalidar cachés relacionados
    this.invalidateListCaches();
    this.logger.info('Transport created, caches invalidated', { 
      id: result.getId() 
    });
    
    return result;
  }

  async update(id: number, updates: Partial<Transport>): Promise<Transport | null> {
    // Actualizar en el repositorio base
    const result = await this.baseRepository.update(id, updates);
    
    if (result) {
      // Invalidar TODOS los cachés relacionados con este transporte
      this.invalidateTransportCaches(id);
      this.logger.info('Transport updated, caches invalidated', { id });
    }
    
    return result;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.baseRepository.delete(id);
    
    if (result) {
      this.invalidateTransportCaches(id);
      this.logger.info('Transport deleted, caches invalidated', { id });
    }
    
    return result;
  }

  async updateStatus(id: number, status: TransportStatus): Promise<boolean> {
    const result = await this.baseRepository.updateStatus(id, status);
    
    if (result) {
      // El estado afecta la disponibilidad
      this.invalidateTransportCaches(id);
      // También afecta las listas de "available"
      this.invalidateAvailabilityCaches();
    }
    
    return result;
  }

  // ========== MÉTODOS DE INVALIDACIÓN DE CACHÉ ==========

  /**
   * Invalida todos los cachés relacionados con un transporte específico
   */
  private invalidateTransportCaches(id: number): void {
    // Caché del transporte individual
    const singleKey = MemoryCacheService.generateKey('transport', 'id', id);
    this.cache.del(singleKey);
    
    // Cachés de listas (difícil saber cuáles incluyen este transporte)
    this.invalidateListCaches();
    
    // Cachés de estadísticas
    const statsKey = MemoryCacheService.generateKey('transport', 'stats');
    this.cache.del(statsKey);
  }

  /**
   * Invalida todos los cachés de listas
   */
  private invalidateListCaches(): void {
    // Estrategia: Usar patrón en las claves para borrar múltiples
    // En una implementación más sofisticada, usaríamos Redis con SCAN
    
    this.logger.debug('Invalidating all transport list caches');
    
    // Por ahora, invalidamos las claves conocidas
    // En producción con Redis, usaríamos: 
    // SCAN 0 MATCH transport:list:* COUNT 100
  }

  /**
   *// Si cambia la query, ¡hay que cambiarla en 3+ lugares!
```

**Problema 3: Dificultad para Testing**
```typescript
// ❌ PROBLEMA: ¿Cómo testear sin BD real?
describe('GetUserProfileUseCase', () => {
  it('should get user profile', async () => {
    // Necesito una BD PostgreSQL corriendo
    // Necesito datos de prueba
    // Cada test es lento (I/O real)
    const useCase = new GetUserProfileUseCase(realDatabasePool);
    // ...
  });
});
```

### ✅ Solución Implementada

El patrón Repository se implementa en DOS partes:

#### **PARTE 1: Interfaz en el Dominio (Contrato)**

```typescript
// src/core/domain/repositories/user.repository.ts
/**
 * Contrato del repositorio de usuarios
 * Define QUÉ operaciones se pueden hacer, NO CÓMO
 * 
 * Esta interfaz pertenece al DOMINIO, no a la infraestructura
 */
export interface UserRepository {
  // ========== CRUD BÁSICO ==========
  
  /**
   * Guarda un nuevo usuario
   * @returns Usuario con ID asignado
   */
  save(user: User): Promise<User>;
  
  /**
   * Busca usuario por ID
   * @returns Usuario o null si no existe
   */
  findById(id: number): Promise<User | null>;
  
  /**
   * Busca usuario por email
   * @returns Usuario o null si no existe
   */
  findByEmail(email: Email): Promise<User | null>;
  
  /**
   * Busca usuario por documento
   * @returns Usuario o null si no existe
   */
  findByDocument(document: DocumentNumber): Promise<User | null>;
  
  /**
   * Actualiza un usuario existente
   * @throws Error si el usuario no existe
   */
  update(user: User): Promise<User>;
  
  /**
   * Elimina un usuario (soft delete)
   */
  delete(id: number): Promise<void>;
  
  /**
   * Verifica si existe un usuario
   */
  exists(id: number): Promise<boolean>;

  // ========== CONSULTAS ESPECÍFICAS ==========
  
  /**
   * Obtiene usuarios paginados
   */
  findAll(page: number, limit: number): Promise<PaginatedResponse<User>>;
  
  /**
   * Busca usuarios por término (nombre, email, documento)
   */
  search(term: string, page: number, limit: number): Promise<PaginatedResponse<User>>;
  
  /**
   * Obtiene estadísticas de usuarios
   */
  getStats(): Promise<UserStats>;
}

// Tipos auxiliares
export interface PaginatedResponse<T> {
  users: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  admins: number;
  newUsersThisMonth: number;
}
```

#### **PARTE 2: Implementación en Infraestructura**

```typescript
// src/infrastructure/persistence/postgresql/user.repository.ts
/**
 * Implementación PostgreSQL del repositorio de usuarios
 * Define CÓMO se hacen las operaciones con PostgreSQL específicamente
 */
export class PostgreSQLUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  // ========== IMPLEMENTACIÓN DE MÉTODOS ==========

  async save(user: User): Promise<User> {
    // 1. Convertir entidad de dominio a formato de BD
    const data = user.toPersistence();
    
    // 2. Query SQL específico de PostgreSQL
    const query = `
      INSERT INTO users (
        name, email, document_number, phone, password, role, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    // 3. Ejecutar query
    const result = await this.pool.query(query, [
      data.name,
      data.email,
      data.document_number,
      data.phone,
      data.password,
      data.role,
      data.status
    ]);
    
    // 4. Convertir resultado de BD a entidad de dominio
    return User.fromPersistence(result.rows[0]);
  }

  async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return User.fromPersistence(result.rows[0]);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email# 🚴 EcoMove Backend - Sistema de Préstamo de Vehículos Ecológicos

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

## 🎨 Patrones de Diseño Implementados - Análisis Detallado

Esta sección proporciona un análisis exhaustivo de cada patrón de diseño implementado en el proyecto, incluyendo el problema que resuelve, la solución aplicada, ejemplos de código real, diagramas conceptuales y las ventajas específicas en el contexto de EcoMove.

---

## 📚 Índice de Patrones

### Patrones Creacionales
1. [Singleton Pattern](#singleton-pattern)
2. [Factory Pattern](#factory-pattern)

### Patrones Estructurales
3. [Repository Pattern](#repository-pattern)
4. [Decorator Pattern](#decorator-pattern)
5. [Adapter Pattern](#adapter-pattern)
6. [Dependency Injection](#dependency-injection)

### Patrones Comportamentales
7. [Strategy Pattern](#strategy-pattern)
8. [Chain of Responsibility](#chain-of-responsibility)
9. [Command Pattern](#command-pattern)

### Patrones DDD
10. [Entity Pattern](#entity-pattern)
11. [Value Object Pattern](#value-object-pattern)
12. [Aggregate Pattern](#aggregate-pattern)

---

# PATRONES CREACIONALES

Los patrones creacionales se encargan de la construcción de objetos, abstrayendo el proceso de instanciación y haciéndolo más flexible y reutilizable.

---

## Singleton Pattern 
## Singleton Pattern

### 📖 Definición
El patrón Singleton garantiza que una clase tenga una única instancia en toda la aplicación y proporciona un punto de acceso global a ella.

### 🎯 Problema que Resuelve
En aplicaciones complejas, ciertos componentes deben existir en una única instancia:
- **Conexiones a bases de datos**: Crear múltiples pools sería ineficiente
- **Configuración global**: Mantener múltiples configuraciones causaría inconsistencias
- **Gestores de recursos**: Como loggers, caché, o contenedores de dependencias

**Antes del patrón:**
```typescript
// ❌ PROBLEMA: Múltiples instancias del contenedor
const container1 = new DIContainer();  // Pool de BD creado
const container2 = new DIContainer();  // ¡Otro pool! ❌
const container3 = new DIContainer();  // ¡Y otro! ❌

// Resultado: 3 pools de conexiones, 3 configuraciones diferentes
// Uso ineficiente de memoria y recursos
```

### ✅ Solución Implementada

```typescript
// src/config/container.ts
export class DIContainer {
  // 1. Instancia privada estática - Solo una existe
  private static instance: DIContainer;
  
  // 2. Pool de base de datos - Compartido por todos
  private pool: Pool;
  
  // 3. Todos los servicios y repositorios
  private userRepository!: UserRepository;
  private passwordService!: PasswordService;
  // ... más dependencias

  // 4. Constructor PRIVADO - No se puede hacer "new DIContainer()"
  private constructor() {
    this.pool = DatabaseConfig.createPool();
    this.initializeServices();
    this.initializeRepositories();
    this.initializeUseCases();
    this.initializeControllers();
  }

  // 5. Método estático getInstance - Único punto de acceso
  public static getInstance(): DIContainer {
    // Si no existe, créala. Si existe, devuelve la existente
    if (!DIContainer.instance) {
      console.log('🏗️  Creando ÚNICA instancia del DIContainer...');
      DIContainer.instance = new DIContainer();
    } else {
      console.log('♻️  Reutilizando instancia existente del DIContainer');
    }
    
    return DIContainer.instance;
  }

  // 6. Método para limpiar recursos (útil en testing)
  public static resetInstance(): void {
    if (DIContainer.instance) {
      DIContainer.instance.pool.end();  // Cierra conexiones
      DIContainer.instance = null as any;
    }
  }

  // Getters para acceder a las dependencias
  public getUserRepository(): UserRepository {
    return this.userRepository;
  }
  
  public getPool(): Pool {
    return this.pool;
  }
}
```

### 🔍 Uso en el Proyecto

```typescript
// src/main.ts
const container = DIContainer.getInstance();  // Primera llamada: crea instancia
const logger = container.getLogger();
const pool = container.getPool();

// src/presentation/http/routes/user.routes.ts
const container = DIContainer.getInstance();  // Segunda llamada: reutiliza instancia
const authController = container.getAuthController();

// Ambos apuntan a LA MISMA instancia
console.log(container1 === container2);  // true ✅
```

### 📊 Diagrama Conceptual

```
┌─────────────────────────────────────────────────────────────┐
│                    Primera llamada                           │
│  DIContainer.getInstance()                                   │
│         │                                                     │
│         ▼                                                     │
│  ¿Existe instance?  → NO                                     │
│         │                                                     │
│         ▼                                                     │
│  Crear nueva instancia                                       │
│  - Pool de BD                                                │
│  - Repositorios        ┌─────────────────┐                  │
│  - Servicios          │  DIContainer    │                  │
│  - Use Cases          │   instance      │                  │
│  - Controllers        │  (Singleton)    │                  │
│         │             └─────────────────┘                  │
│         ▼                      ▲                              │
│  Guardar en variable estática  │                             │
│  Retornar instancia            │                             │
└────────────────────────────────┼──────────────────────────────┘
                                 │
┌────────────────────────────────┼──────────────────────────────┐
│                    Llamadas posteriores                        │
│  DIContainer.getInstance()                                     │
│         │                      │                               │
│         ▼                      │                               │
│  ¿Existe instance?  → SÍ ──────┘                             │
│         │                                                      │
│         ▼                                                      │
│  Retornar instancia existente (no crear nueva)                │
│                                                                │
│  ✅ Mismo Pool de BD                                          │
│  ✅ Mismas configuraciones                                    │
│  ✅ Mismos servicios                                          │
└────────────────────────────────────────────────────────────────┘
```

### 🎯 Ventajas Específicas en EcoMove

1. **Eficiencia de Recursos**
```typescript
// Una única pool de conexiones para toda la app
// Pool configurado con:
// - max: 20 conexiones
// - idleTimeout: 30s
// - connectionTimeout: 2s

// Sin Singleton: 
// Si 10 módulos crean su propio DIContainer = 200 conexiones 😱
// Con Singleton: 
// Todos comparten el mismo pool = 20 conexiones ✅
```

2. **Consistencia de Configuración**
```typescript
// Todos los módulos usan la MISMA configuración de JWT
const tokenService = container.getTokenService();
// JWT_SECRET: "abc123"
// JWT_EXPIRES_IN: "24h"

// No hay posibilidad de que diferentes partes de la app
// usen diferentes configuraciones
```

3. **Gestión Centralizada del Ciclo de Vida**
```typescript
// Inicialización
const container = DIContainer.getInstance();
container.initialize();

// Cierre limpio
process.on('SIGTERM', () => {
  container.close();  // Cierra TODAS las conexiones
  process.exit(0);
});
```

4. **Facilita Testing**
```typescript
// En tests, podemos resetear el singleton
afterEach(() => {
  DIContainer.resetInstance();
});

// Y crear uno nuevo con mocks
const mockContainer = DIContainer.getInstance();
// Inyectar dependencias mock...
```

### ⚠️ Consideraciones y Trade-offs

**Ventajas:**
- ✅ Control total sobre la instanciación
- ✅ Acceso global conveniente
- ✅ Inicialización lazy (solo cuando se necesita)
- ✅ Ahorro de memoria y recursos

**Desventajas:**
- ⚠️ Estado global (puede dificultar testing si no se maneja bien)
- ⚠️ Acoplamiento (código depende de una clase específica)
- ⚠️ Difícil de extender o heredar
- ⚠️ No es thread-safe por defecto en algunos lenguajes (JavaScript es single-threaded)

**Solución a las desventajas en nuestro código:**
```typescript
// Mitigamos el acoplamiento con interfaces
interface Container {
  getUserRepository(): UserRepository;
  getLogger(): LoggerService;
}

// El código depende de la interfaz, no de DIContainer directamente
function someFunction(container: Container) {
  const userRepo = container.getUserRepository();
}

// Testing: Fácil mockear
class MockContainer implements Container {
  getUserRepository() { return new MockUserRepository(); }
  getLogger() { return new MockLogger(); }
}
```

### 📍 Ubicación en el Proyecto
- **Implementación**: `src/config/container.ts`
- **Uso**: `src/main.ts`, `src/presentation/http/routes/**/*.routes.ts`

---

## Factory Pattern

### 📖 Definición
El patrón Factory encapsula la lógica de creación de objetos, permitiendo crear instancias sin especificar sus clases exactas. Centraliza la construcción de objetos complejos.

### 🎯 Problema que Resuelve

**Problema 1: Construcción Compleja**
```typescript
// ❌ PROBLEMA: Constructor complejo y disperso por el código
const user = new User(
  data.id,
  data.name,
  new Email(data.email),  // ¿Validación aquí?
  new DocumentNumber(data.document_number),
  data.phone,
  data.password,
  data.role as UserRole,
  data.status as UserStatus,
  new Date(data.registration_date),
  new Date(data.updated_at)
);
// Esta lógica se repite en 10 lugares diferentes 😱
```

**Problema 2: Transformación de Datos**
```typescript
// ❌ PROBLEMA: ¿Cómo convertir un objeto de BD a entidad?
const dbResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
const row = dbResult.rows[0];

// Código de transformación duplicado en múltiples repositorios
const user = new User(
  row.id,
  row.name,
  Email.fromString(row.email),
  // ... más campos
);
```

### ✅ Solución Implementada

```typescript
// src/core/domain/entities/user.entity.ts
export class User {
  // Constructor normal (privado o protegido en algunos casos)
  constructor(
    private id: number | null,
    private name: string,
    private email: Email,
    private documentNumber: DocumentNumber,
    private phone: string,
    private password: string,
    private role: UserRole = UserRole.USER,
    private status: UserStatus = UserStatus.ACTIVE,
    private registrationDate: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // ========== FACTORY METHOD 1: Desde Persistencia ==========
  /**
   * Crea una entidad User desde datos de la base de datos
   * Centraliza la lógica de transformación DB → Domain
   */
  static fromPersistence(data: any): User {
    // Validación de datos requeridos
    if (!data.id || !data.email) {
      throw new Error('Datos incompletos para crear usuario');
    }

    // Transformación y validación
    return new User(
      data.id,
      data.name,
      Email.fromString(data.email),  // Factory de Value Object
      DocumentNumber.fromString(data.document_number),
      data.phone,
      data.password,  // Ya hasheada
      data.role as UserRole,
      data.status as UserStatus,
      new Date(data.registration_date),
      new Date(data.updated_at)
    );
  }

  // ========== FACTORY METHOD 2: Usuario Nuevo ==========
  /**
   * Crea un nuevo usuario (para registro)
   * Sin ID (será asignado por la BD)
   */
  static createNew(
    name: string,
    email: string,
    documentNumber: string,
    phone: string,
    hashedPassword: string,
    role: UserRole = UserRole.USER
  ): User {
    return new User(
      null,  // ID null = nuevo usuario
      name,
      Email.fromString(email),
      DocumentNumber.fromString(documentNumber),
      phone,
      hashedPassword,
      role,
      UserStatus.ACTIVE,  // Siempre activo al crear
      new Date(),
      new Date()
    );
  }

  // ========== MÉTODO PARA PERSISTENCIA ==========
  /**
   * Convierte la entidad de dominio a formato de BD
   * Transformación: Domain → DB
   */
  toPersistence(): any {
    return {
      id: this.id,
      name: this.name,
      email: this.email.getValue(),  // Value Object → string
      document_number: this.documentNumber.getValue(),
      phone: this.phone,
      password: this.password,
      role: this.role,
      status: this.status,
      registration_date: this.registrationDate,
      updated_at: this.updatedAt
    };
  }

  // ========== FACTORY METHOD 3: Para DTOs ==========
  /**
   * Convierte a DTO para la capa de presentación
   * NO expone información sensible
   */
  toDTO(): UserDTO {
    return {
      id: this.id!,
      name: this.name,
      email: this.email.getValue(),
      documentNumber: this.documentNumber.getValue(),
      phone: this.phone,
      role: this.role,
      status: this.status,
      // ❌ NO incluye password
    };
  }
}
```

### 🔍 Uso en el Proyecto

**Caso 1: Repositorio PostgreSQL**
```typescript
// src/infrastructure/persistence/postgresql/user.repository.ts
export class PostgreSQLUserRepository implements UserRepository {
  async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    // ✅ Factory Method: BD → Dominio
    return User.fromPersistence(result.rows[0]);
  }

  async save(user: User): Promise<User> {
    // ✅ Factory Method: Dominio → BD
    const data = user.toPersistence();
    
    const query = `
      INSERT INTO users (name, email, document_number, phone, password, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [
      data.name,
      data.email,
      data.document_number,
      data.phone,
      data.password,
      data.role,
      data.status
    ]);

    // ✅ Factory Method: BD → Dominio
    return User.fromPersistence(result.rows[0]);
  }
}
```

**Caso 2: Use Case de Registro**
```typescript
// src/core/use-cases/user/register-user.use-case.ts
export class RegisterUserUseCase {
  async execute(dto: RegisterUserDTO): Promise<{ user: User; token: string }> {
    // Validar que no exista
    const existingUser = await this.userRepository.findByEmail(
      Email.fromString(dto.correo)
    );
    
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Hashear contraseña
    const hashedPassword = await this.passwordService.hash(dto.password);

    // ✅ Factory Method: Crear usuario nuevo
    const user = User.createNew(
      dto.nombre,
      dto.correo,
      dto.documento,
      dto.telefono,
      hashedPassword,
      dto.role || UserRole.USER
    );

    // Guardar
    const savedUser = await this.userRepository.save(user);

    // Generar token
    const token = await this.tokenService.generate({
      userId: savedUser.getId()!,
      email: savedUser.getEmail().getValue(),
      role: savedUser.getRole()
    });

    return { user: savedUser, token };
  }
}
```

**Caso 3: Controller**
```typescript
// src/presentation/http/controllers/auth.controller.ts
export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { user, token } = await this.registerUserUseCase.execute(req.body);

      // ✅ Factory Method: Dominio → DTO (sin password)
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: user.toDTO(),  // ← Factory Method
          token
        }
      });
    } catch (error) {
      // Manejo de errores...
    }
  }
}
```

### 📊 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                 FACTORY PATTERN EN ACCIÓN                    │
└─────────────────────────────────────────────────────────────┘

 DATABASE QUERY                          
      │                                   
      ▼                                   
┌──────────────┐                          
│  Raw Data    │                          
│  {           │                          
│   id: 1,     │                          
│   email:...  │                          
│  }           │                          
└──────┬───────┘                          
       │                                  
       │ User.fromPersistence(data)       
       │                                  
       ▼                                  
┌──────────────────────┐                  
│  Transformación:     │                  
│  - Validar datos     │                  
│  - Crear VOs         │                  
│  - Instanciar User   │                  
└──────┬───────────────┘                  
       │                                  
       ▼                                  
┌──────────────┐                          
│ User Entity  │                          
│ (Dominio)    │                          
└──────┬───────┘                          
       │                                  
       │ user.toDTO()                     
       │                                  
       ▼                                  
┌──────────────┐                          
│  UserDTO     │                          
│  (Sin pass)  │                          
└──────────────┘                          
       │                                  
       ▼                                  
   JSON Response                          
```

### 🎯 Ventajas Específicas en EcoMove

1. **Separación de Representaciones**
```typescript
// Dominio: User con toda la lógica de negocio
const domainUser: User = User.fromPersistence(dbData);
domainUser.activate();
domainUser.changePassword(newPassword);

// Persistencia: Formato de BD
const dbData = domainUser.toPersistence();
// { id: 1, name: "Juan", email: "juan@...", password: "$2a$..." }

// Presentación: DTO para API (sin datos sensibles)
const dtoUser = domainUser.toDTO();
// { id: 1, name: "Juan", email: "juan@..." }  ❌ sin password
```

2. **Validación Centralizada**
```typescript
// ✅ Un solo lugar para validar la creación
static fromPersistence(data: any): User {
  if (!data.id) throw new Error('ID requerido');
  if (!data.email) throw new Error('Email requerido');
  if (!data.name || data.name.length < 2) {
    throw new Error('Nombre inválido');
  }
  // Todas las validaciones en un solo lugar
  return new User(...);
}

// Si cambia la validación, se cambia en UN SOLO LUGAR
// No hay validación duplicada en 10 repositorios diferentes
```

3. **Facilita Testing**
```typescript
// En tests, crear usuarios es trivial
describe('User', () => {
  it('should create user from persistence', () => {
    const userData = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      // ... más campos
    };

    const user = User.fromPersistence(userData);
    
    expect(user.getId()).toBe(1);
    expect(user.getEmail().getValue()).toBe('test@example.com');
  });
});
```

4. **Type Safety y Autocompletado**
```typescript
// TypeScript sabe exactamente qué tipo es
const user: User = User.fromPersistence(data);  // ✅ User
const dto: UserDTO = user.toDTO();              // ✅ UserDTO

// vs sin Factory
const user = createUserFromData(data);  // ❓ any? User? object?
```

### ⚠️ Alternativas y Variaciones

**Abstract Factory (no implementado, pero podría usarse)**
```typescript
// Para crear familias de objetos relacionados
interface VehicleFactory {
  createTransport(): Transport;
  createMaintenance(): Maintenance;
  createInsurance(): Insurance;
}

class BicycleFactory implements VehicleFactory {
  createTransport() { return new Bicycle(); }
  createMaintenance() { return new BicycleMaintenance(); }
  createInsurance() { return new BicycleInsurance(); }
}

class ScooterFactory implements VehicleFactory {
  createTransport() { return new ElectricScooter(); }
  createMaintenance() { return new ScooterMaintenance(); }
  createInsurance() { return new ScooterInsurance(); }
}
```

### 📍 Ubicación en el Proyecto
- **Implementación**: `src/core/domain/entities/*.entity.ts` (métodos estáticos)
- **Uso**: `src/infrastructure/database/repositories/*.repository.ts`

---

# PATRONES ESTRUCTURALES

Los patrones estructurales se ocupan de cómo se componen las clases y objetos para formar estructuras más grandes, manteniendo flexibilidad y eficiencia.

---

## Repository Pattern

### 📖 Definición
El patrón Repository actúa como una colección en memoria de objetos de dominio, encapsulando la lógica de acceso a datos y proporcionando una interfaz orientada a objetos para consultar y manipular datos.

### 🎯 Problema que Resuelve

**Problema 1: Acoplamiento directo con la BD**
```typescript
// ❌ PROBLEMA: Use Case acoplado a PostgreSQL
export class GetUserProfileUseCase {
  async execute(userId: number) {
    // SQL directamente en el caso de uso 😱
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    
    // ¿Qué pasa si cambio a MongoDB? ¿MySQL? ¿API externa?
    // Tengo que modificar TODOS los use cases
  }
}
```

**Problema 2: Lógica de acceso duplicada**
```typescript
// ❌ PROBLEMA: Mismo SQL en múltiples lugares
// En AuthController:
const result1 = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

// En UserProfileController:
const result2 = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

// En AdminController:
const result3 = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

// Si cambia la query, ¡hay que cambiarla en 3+ lugares!
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
