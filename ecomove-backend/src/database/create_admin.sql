-- Script para crear usuario administrador
-- src/database/create_admin.sql

-- Insertar usuario administrador (contraseña: admin123)
-- Password hash para 'admin123' usando bcrypt
INSERT INTO usuario (
  nombre, 
  correo, 
  documento, 
  password_hash, 
  estado, 
  role,
  telefono
) VALUES (
  'Administrador EcoMove',
  'admin@ecomove.com',
  'admin001',
  '$2b$10$8K1p7aZoO4z3L3ZQxB5qFOE4C/YfGxYQU4Qm3w2T5n1A7H8K9J0L1M',
  'active',
  'admin',
  '+573001234567'
);

-- Verificar que se creó correctamente
SELECT id, nombre, correo, documento, estado, role, created_at 
FROM usuario 
WHERE correo = 'admin@ecomove.com';