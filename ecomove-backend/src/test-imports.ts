// src/test-imports.ts (CORREGIDO)
console.log('Testing imports...');

try {
  console.log('1. Testing express...');
  const express = require('express');
  console.log('✅ Express OK');

  console.log('2. Testing cors...');
  const cors = require('cors');
  console.log('✅ CORS OK');

  console.log('3. Testing dotenv...');
  const dotenv = require('dotenv');
  console.log('✅ Dotenv OK');

  console.log('4. Testing pg...');
  const { Pool } = require('pg');
  console.log('✅ PostgreSQL OK');

  console.log('5. Testing bcryptjs...');
  const bcrypt = require('bcryptjs');
  console.log('✅ Bcrypt OK');

  console.log('6. Testing jsonwebtoken...');
  const jwt = require('jsonwebtoken');
  console.log('✅ JWT OK');

  console.log('✅ All basic imports working!');

} catch (error: any) {  // ← CORREGIDO: tipado explícito
  console.error('❌ Import error:', error.message);
  console.error(error.stack);
}