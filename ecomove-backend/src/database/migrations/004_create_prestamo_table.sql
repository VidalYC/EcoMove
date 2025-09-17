-- Migración para tabla de préstamos
-- Archivo: src/infrastructure/database/migrations/004_create_loan_table.sql

-- Verificar si la tabla prestamo ya existe, si no, crearla
CREATE TABLE IF NOT EXISTS prestamo (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  transporte_id INTEGER NOT NULL,
  estacion_origen_id INTEGER NOT NULL,
  estacion_destino_id INTEGER,
  fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_fin TIMESTAMP WITH TIME ZONE,
  duracion_estimada INTEGER, -- en minutos
  costo_total DECIMAL(10,2),
  estado VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (estado IN ('active', 'completed', 'cancelled', 'extended')),
  metodo_pago VARCHAR(20) CHECK (metodo_pago IN ('cash', 'credit-card', 'pse', 'digital-wallet')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Claves foráneas
  CONSTRAINT fk_prestamo_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
  CONSTRAINT fk_prestamo_transporte FOREIGN KEY (transporte_id) REFERENCES transporte(id) ON DELETE CASCADE,
  CONSTRAINT fk_prestamo_estacion_origen FOREIGN KEY (estacion_origen_id) REFERENCES estacion(id) ON DELETE CASCADE,
  CONSTRAINT fk_prestamo_estacion_destino FOREIGN KEY (estacion_destino_id) REFERENCES estacion(id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_prestamo_usuario_id ON prestamo(usuario_id);
CREATE INDEX IF NOT EXISTS idx_prestamo_transporte_id ON prestamo(transporte_id);
CREATE INDEX IF NOT EXISTS idx_prestamo_estado ON prestamo(estado);
CREATE INDEX IF NOT EXISTS idx_prestamo_fecha_inicio ON prestamo(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_prestamo_estacion_origen ON prestamo(estacion_origen_id);
CREATE INDEX IF NOT EXISTS idx_prestamo_estacion_destino ON prestamo(estacion_destino_id);

-- Índice compuesto para consultas frecuentes de préstamos activos por usuario
CREATE INDEX IF NOT EXISTS idx_prestamo_usuario_estado ON prestamo(usuario_id, estado);

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_prestamo_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trigger_update_prestamo_updated_at ON prestamo;
CREATE TRIGGER trigger_update_prestamo_updated_at
  BEFORE UPDATE ON prestamo
  FOR EACH ROW
  EXECUTE FUNCTION update_prestamo_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE prestamo IS 'Tabla de préstamos de transportes';
COMMENT ON COLUMN prestamo.id IS 'Identificador único del préstamo';
COMMENT ON COLUMN prestamo.usuario_id IS 'ID del usuario que realiza el préstamo';
COMMENT ON COLUMN prestamo.transporte_id IS 'ID del transporte prestado';
COMMENT ON COLUMN prestamo.estacion_origen_id IS 'ID de la estación donde inicia el préstamo';
COMMENT ON COLUMN prestamo.estacion_destino_id IS 'ID de la estación donde termina el préstamo';
COMMENT ON COLUMN prestamo.fecha_inicio IS 'Fecha y hora de inicio del préstamo';
COMMENT ON COLUMN prestamo.fecha_fin IS 'Fecha y hora de finalización del préstamo';
COMMENT ON COLUMN prestamo.duracion_estimada IS 'Duración estimada del préstamo en minutos';
COMMENT ON COLUMN prestamo.costo_total IS 'Costo total del préstamo';
COMMENT ON COLUMN prestamo.estado IS 'Estado actual del préstamo';
COMMENT ON COLUMN prestamo.metodo_pago IS 'Método de pago utilizado';

-- Datos de ejemplo para testing (opcional)
-- INSERT INTO prestamo (usuario_id, transporte_id, estacion_origen_id, duracion_estimada, estado) 
-- VALUES 
-- (1, 1, 1, 60, 'active'),
-- (2, 2, 2, 120, 'completed'),
-- (1, 3, 1, 30, 'cancelled')
-- ON CONFLICT DO NOTHING;