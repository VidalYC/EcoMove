-- src/database/seed.sql
-- Insertar usuario administrador por defecto
INSERT INTO users (name, email, document_number, phone, password, role, status) 
VALUES (
  'Administrador EcoMove',
  'admin@ecomove.com',
  '12345678',
  '3001234567',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
  'admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Insertar algunos usuarios de prueba
INSERT INTO users (name, email, document_number, phone, password, role, status) 
VALUES 
(
  'Juan Pérez',
  'juan@example.com',
  '87654321',
  '3009876543',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: test123
  'user',
  'active'
),
(
  'María García',
  'maria@example.com',
  '11223344',
  '3007654321',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: test123
  'user',
  'active'
),
(
  'Carlos López',
  'carlos@example.com',
  '55667788',
  '3005432167',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: test123
  'user',
  'inactive'
) ON CONFLICT (email) DO NOTHING;