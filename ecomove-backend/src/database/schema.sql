-- Esquema completo y limpio para EcoMove

-- ==============================================
-- EXTENSIONES
-- ==============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- TABLA: USUARIOS
-- ==============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    document_number VARCHAR(15) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT check_name_length CHECK (length(name) >= 2),
    CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT check_document_format CHECK (document_number ~* '^[0-9]{8,15}$'),
    CONSTRAINT check_phone_format CHECK (phone ~* '^[0-9+\-\s()]{10,20}$')
);

-- ==============================================
-- TABLA: ESTACIONES
-- ==============================================
CREATE TABLE IF NOT EXISTS estaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    capacidad_total INTEGER NOT NULL DEFAULT 10,
    capacidad_bicicletas INTEGER NOT NULL DEFAULT 5,
    capacidad_patinetas INTEGER NOT NULL DEFAULT 5,
    estado VARCHAR(20) DEFAULT 'active' CHECK (estado IN ('active', 'inactive', 'maintenance')),
    zona VARCHAR(50),
    descripcion TEXT,
    horario_apertura TIME DEFAULT '05:00:00',
    horario_cierre TIME DEFAULT '23:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT check_capacidades CHECK (
        capacidad_total > 0 AND 
        capacidad_bicicletas >= 0 AND 
        capacidad_patinetas >= 0 AND
        (capacidad_bicicletas + capacidad_patinetas) <= capacidad_total
    ),
    CONSTRAINT check_coordenadas CHECK (
        latitud BETWEEN -90 AND 90 AND 
        longitud BETWEEN -180 AND 180
    ),
    CONSTRAINT check_horarios CHECK (horario_apertura < horario_cierre)
);

-- ==============================================
-- TABLA: TRANSPORTES
-- ==============================================
CREATE TABLE IF NOT EXISTS transportes (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('bicycle', 'electric-scooter', 'scooter', 'electric-vehicle')),
    modelo VARCHAR(50) NOT NULL,
    marca VARCHAR(30),
    estado VARCHAR(20) DEFAULT 'available' CHECK (estado IN ('available', 'in-use', 'maintenance', 'out-of-service')),
    estacion_actual_id INTEGER REFERENCES estaciones(id),
    tarifa_por_hora DECIMAL(8, 2) NOT NULL DEFAULT 2500.00,
    fecha_adquisicion DATE NOT NULL DEFAULT CURRENT_DATE,
    ultima_revision DATE,
    kilometraje DECIMAL(8, 2) DEFAULT 0.0,
    nivel_bateria INTEGER,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    atributos_especificos JSONB,
    
    CONSTRAINT check_tarifa CHECK (tarifa_por_hora > 0),
    CONSTRAINT check_kilometraje CHECK (kilometraje >= 0),
    CONSTRAINT check_nivel_bateria CHECK (nivel_bateria IS NULL OR (nivel_bateria BETWEEN 0 AND 100)),
    CONSTRAINT check_codigo_format CHECK (codigo ~* '^[A-Z0-9\-]+$')
);

-- ==============================================
-- TABLA: PRESTAMOS
-- ==============================================
CREATE TABLE IF NOT EXISTS prestamos (
    id SERIAL PRIMARY KEY,
    codigo_prestamo VARCHAR(20) UNIQUE NOT NULL,
    usuario_id INTEGER NOT NULL REFERENCES users(id),
    transporte_id INTEGER NOT NULL REFERENCES transportes(id),
    estacion_origen_id INTEGER NOT NULL REFERENCES estaciones(id),
    estacion_destino_id INTEGER REFERENCES estaciones(id),
    fecha_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    fecha_limite TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'active' CHECK (estado IN ('active', 'completed', 'cancelled', 'extended', 'overdue')),
    duracion_minutos INTEGER,
    tarifa_por_hora DECIMAL(8, 2) NOT NULL,
    costo_total DECIMAL(10, 2),
    costo_adicional DECIMAL(8, 2) DEFAULT 0.00,
    metodo_pago VARCHAR(30) CHECK (metodo_pago IN ('cash', 'credit-card', 'pse', 'digital-wallet')),
    comentarios TEXT,
    calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT check_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    CONSTRAINT check_costos CHECK (costo_total IS NULL OR costo_total >= 0 AND costo_adicional >= 0),
    CONSTRAINT check_duracion CHECK (duracion_minutos IS NULL OR duracion_minutos >= 0)
);

-- ==============================================
-- TABLA: MOVIMIENTOS
-- ==============================================
CREATE TABLE IF NOT EXISTS movimientos_transporte (
    id SERIAL PRIMARY KEY,
    transporte_id INTEGER NOT NULL REFERENCES transportes(id),
    estacion_origen_id INTEGER REFERENCES estaciones(id),
    estacion_destino_id INTEGER REFERENCES estaciones(id),
    usuario_id INTEGER REFERENCES users(id),
    prestamo_id INTEGER REFERENCES prestamos(id),
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN ('loan', 'return', 'maintenance', 'relocation')),
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDICES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_document ON users(document_number);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

CREATE INDEX IF NOT EXISTS idx_estaciones_estado ON estaciones(estado);
CREATE INDEX IF NOT EXISTS idx_estaciones_zona ON estaciones(zona);
CREATE INDEX IF NOT EXISTS idx_estaciones_deleted_at ON estaciones(deleted_at);

CREATE INDEX IF NOT EXISTS idx_transportes_codigo ON transportes(codigo);
CREATE INDEX IF NOT EXISTS idx_transportes_tipo ON transportes(tipo);
CREATE INDEX IF NOT EXISTS idx_transportes_estado ON transportes(estado);
CREATE INDEX IF NOT EXISTS idx_transportes_estacion ON transportes(estacion_actual_id);
CREATE INDEX IF NOT EXISTS idx_transportes_deleted_at ON transportes(deleted_at);

CREATE INDEX IF NOT EXISTS idx_prestamos_codigo ON prestamos(codigo_prestamo);
CREATE INDEX IF NOT EXISTS idx_prestamos_usuario ON prestamos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_prestamos_deleted_at ON prestamos(deleted_at);

-- ==============================================
-- TRIGGERS
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_estaciones_updated_at ON estaciones;
CREATE TRIGGER update_estaciones_updated_at
    BEFORE UPDATE ON estaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transportes_updated_at ON transportes;
CREATE TRIGGER update_transportes_updated_at
    BEFORE UPDATE ON transportes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prestamos_updated_at ON prestamos;
CREATE TRIGGER update_prestamos_updated_at
    BEFORE UPDATE ON prestamos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- DATOS DE PRUEBA
-- ==============================================
INSERT INTO users (name, email, document_number, phone, password, role, status) 
VALUES (
  'Administrador EcoMove',
  'admin@ecomove.com',
  '12345678',
  '3001234567',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO estaciones (nombre, direccion, latitud, longitud, zona, capacidad_total, capacidad_bicicletas, capacidad_patinetas) 
VALUES 
(
  'Universidad Nacional',
  'Carrera 30 # 45-03, Bogota',
  4.636239,
  -74.083056,
  'Centro',
  15,
  8,
  7
),
(
  'Zona Rosa',
  'Carrera 13 # 82-71, Bogota',
  4.673856,
  -74.055653,
  'Norte',
  20,
  12,
  8
),
(
  'Centro Historico',
  'Plaza Bolivar, Bogota',
  4.598333,
  -74.075833,
  'Centro',
  12,
  6,
  6
) ON CONFLICT DO NOTHING;

INSERT INTO transportes (codigo, tipo, modelo, marca, tarifa_por_hora, atributos_especificos)
VALUES 
(
  'BIKE-001',
  'bicycle',
  'Urban Pro',
  'EcoBike',
  2500.00,
  '{"material": "aluminio", "cambios": 21, "frenos": "disco"}'
),
(
  'BIKE-002', 
  'bicycle',
  'City Comfort',
  'EcoBike',
  2500.00,
  '{"material": "acero", "cambios": 7, "frenos": "v-brake"}'
),
(
  'SCOOT-001',
  'electric-scooter',
  'Lightning X1',
  'EcoScoot',
  3500.00,
  '{"velocidad_maxima": 25, "autonomia_km": 30, "peso_kg": 15.5}'
) ON CONFLICT (codigo) DO NOTHING;