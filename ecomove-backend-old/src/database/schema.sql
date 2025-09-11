-- ==========================================
-- ESQUEMA POSTGRESQL - ECOMOVE UML
-- ==========================================

-- Limpiar si existe (para desarrollo)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Enumeraciones (del UML)
CREATE TYPE estado_usuario AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE tipo_transporte AS ENUM ('bicycle', 'electric-scooter', 'scooter', 'electric-vehicle');
CREATE TYPE estado_transporte AS ENUM ('available', 'in-use', 'maintenance', 'out-of-service');
CREATE TYPE estado_prestamo AS ENUM ('active', 'completed', 'cancelled', 'extended');
CREATE TYPE metodo_pago AS ENUM ('cash', 'credit-card', 'pse', 'digital-wallet');
CREATE TYPE rol_usuario AS ENUM ('user', 'admin');

-- ==========================================
-- TABLA USUARIO (Clase Usuario UML)
-- ==========================================
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    documento VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado estado_usuario DEFAULT 'active',
    role rol_usuario DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints del UML
    CONSTRAINT chk_documento_valido CHECK (documento ~ '^\d{8,12}$'),
    CONSTRAINT chk_correo_valido CHECK (correo ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_nombre_no_vacio CHECK (length(trim(nombre)) > 0)
);

-- ==========================================
-- TABLA COORDENADA (Clase Coordenada UML)
-- ==========================================
CREATE TABLE coordenada (
    id SERIAL PRIMARY KEY,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints geográficos
    CONSTRAINT chk_latitud_valida CHECK (latitud >= -90 AND latitud <= 90),
    CONSTRAINT chk_longitud_valida CHECK (longitud >= -180 AND longitud <= 180)
);

-- ==========================================
-- TABLA ESTACION (Clase Estacion UML)
-- ==========================================
CREATE TABLE estacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    coordenada_id INTEGER REFERENCES coordenada(id) ON DELETE CASCADE,
    capacidad_maxima INTEGER NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints del UML
    CONSTRAINT chk_capacidad_positiva CHECK (capacidad_maxima > 0),
    CONSTRAINT chk_nombre_estacion_no_vacio CHECK (length(trim(nombre)) > 0)
);

-- ==========================================
-- TABLA TRANSPORTE (Clase abstracta Transporte UML)
-- ==========================================
CREATE TABLE transporte (
    id SERIAL PRIMARY KEY,
    tipo tipo_transporte NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    estado estado_transporte DEFAULT 'available',
    estacion_actual_id INTEGER REFERENCES estacion(id),
    tarifa_por_hora DECIMAL(10, 2) NOT NULL,
    fecha_adquisicion DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints del UML
    CONSTRAINT chk_tarifa_positiva CHECK (tarifa_por_hora > 0)
);

-- ==========================================
-- HERENCIA: BICICLETA (Hereda de Transporte UML)
-- ==========================================
CREATE TABLE bicicleta (
    num_marchas INTEGER NOT NULL,
    tipo_freno VARCHAR(50) DEFAULT 'Disco',
    
    -- Constraints específicos
    CONSTRAINT chk_marchas_validas CHECK (num_marchas > 0 AND num_marchas <= 30),
    CONSTRAINT chk_tipo_freno_valido CHECK (tipo_freno IN ('Disco', 'Tambor', 'V-Brake'))
) INHERITS (transporte);

-- ==========================================
-- HERENCIA: PATINETA_ELECTRICA (Hereda de Transporte UML)
-- ==========================================
CREATE TABLE patineta_electrica (
    nivel_bateria INTEGER NOT NULL,
    velocidad_maxima DECIMAL(5, 2) DEFAULT 25.0,
    autonomia INTEGER DEFAULT 30, -- km
    
    -- Constraints específicos
    CONSTRAINT chk_bateria_valida CHECK (nivel_bateria >= 0 AND nivel_bateria <= 100),
    CONSTRAINT chk_velocidad_valida CHECK (velocidad_maxima > 0 AND velocidad_maxima <= 50),
    CONSTRAINT chk_autonomia_valida CHECK (autonomia > 0)
) INHERITS (transporte);

-- ==========================================
-- TABLA PRESTAMO (Clase Prestamo UML)
-- ==========================================
CREATE TABLE prestamo (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    transporte_id INTEGER NOT NULL REFERENCES transporte(id) ON DELETE CASCADE,
    estacion_origen_id INTEGER NOT NULL REFERENCES estacion(id),
    estacion_destino_id INTEGER REFERENCES estacion(id),
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    duracion_estimada INTEGER DEFAULT 120, -- minutos
    costo_total DECIMAL(10, 2) DEFAULT 0,
    estado estado_prestamo DEFAULT 'active',
    metodo_pago metodo_pago DEFAULT 'cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints del UML
    CONSTRAINT chk_duracion_positiva CHECK (duracion_estimada > 0),
    CONSTRAINT chk_costo_no_negativo CHECK (costo_total >= 0),
    CONSTRAINT chk_fecha_fin_posterior CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio),
    CONSTRAINT chk_estaciones_diferentes CHECK (estacion_origen_id != estacion_destino_id)
);

-- ==========================================
-- TABLA DESCUENTO (Clase Descuento UML)
-- ==========================================
CREATE TABLE descuento (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    porcentaje DECIMAL(5, 2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints del UML
    CONSTRAINT chk_porcentaje_valido CHECK (porcentaje > 0 AND porcentaje <= 100),
    CONSTRAINT chk_fechas_descuento CHECK (fecha_fin >= fecha_inicio)
);

-- ==========================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================
CREATE INDEX idx_usuario_correo ON usuario(correo);
CREATE INDEX idx_usuario_documento ON usuario(documento);
CREATE INDEX idx_usuario_estado ON usuario(estado);
CREATE INDEX idx_estacion_activa ON estacion(is_active);
CREATE INDEX idx_transporte_tipo ON transporte(tipo);
CREATE INDEX idx_transporte_estado ON transporte(estado);
CREATE INDEX idx_transporte_estacion ON transporte(estacion_actual_id);
CREATE INDEX idx_prestamo_usuario ON prestamo(usuario_id);
CREATE INDEX idx_prestamo_transporte ON prestamo(transporte_id);
CREATE INDEX idx_prestamo_estado ON prestamo(estado);
CREATE INDEX idx_prestamo_fecha_inicio ON prestamo(fecha_inicio);

-- ==========================================
-- TRIGGER PARA UPDATED_AT AUTOMÁTICO
-- ==========================================
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER trg_usuario_updated_at
    BEFORE UPDATE ON usuario
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_estacion_updated_at
    BEFORE UPDATE ON estacion
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_transporte_updated_at
    BEFORE UPDATE ON transporte
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_prestamo_updated_at
    BEFORE UPDATE ON prestamo
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_descuento_updated_at
    BEFORE UPDATE ON descuento
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();