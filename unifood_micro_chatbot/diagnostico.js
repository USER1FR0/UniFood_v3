#!/usr/bin/env node

/**
 * Script de diagnóstico para verificar la configuración del microservicio
 * Ejecutar con: node diagnostico.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 DIAGNÓSTICO DE CONFIGURACIÓN - Microservicio Chatbot\n');
console.log('='.repeat(60));

// 1. Verificar si existe el archivo .env
console.log('\n1️⃣ Verificando archivo .env...');
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('   ✅ Archivo .env encontrado en la ubicación correcta');
  console.log(`   📍 Ruta: ${envPath}`);
} else {
  console.log('   ❌ Archivo .env NO encontrado');
  console.log(`   📍 Se esperaba en: ${envPath}`);
  console.log('\n   💡 Solución: Crea el archivo .env en unifood_micro_chatbot/.env');
  process.exit(1);
}

// 2. Leer y verificar variables de entorno
console.log('\n2️⃣ Verificando variables de entorno...');
require('dotenv').config({ path: envPath });

const requiredVars = {
  'DB_HOST': process.env.DB_HOST,
  'DB_PORT': process.env.DB_PORT,
  'DB_USER': process.env.DB_USER,
  'DB_PASSWORD': process.env.DB_PASSWORD,
  'DB_NAME': process.env.DB_NAME,
  'PORT': process.env.PORT,
};

let allVarsPresent = true;

for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    if (key === 'DB_PASSWORD') {
      console.log(`   ✅ ${key}: ${'*'.repeat(value.length)} (oculto)`);
    } else {
      console.log(`   ✅ ${key}: ${value}`);
    }
  } else {
    console.log(`   ❌ ${key}: NO DEFINIDO`);
    allVarsPresent = false;
  }
}

if (!allVarsPresent) {
  console.log('\n   💡 Solución: Completa todas las variables en el archivo .env');
  process.exit(1);
}

// 3. Verificar si el puerto está disponible
console.log('\n3️⃣ Verificando configuración del puerto...');
const port = process.env.PORT || 6000;
console.log(`   ✅ Puerto configurado: ${port}`);

if (port == 3000) {
  console.log('   ⚠️  ADVERTENCIA: El puerto 3000 puede estar en uso por el backend principal');
  console.log('   💡 Recomendación: Usa PORT=6000 en el archivo .env');
}

// 4. Verificar tipo de conexión
console.log('\n4️⃣ Verificando tipo de conexión...');
const dbHost = process.env.DB_HOST;
const isLocal = dbHost.includes('localhost') || dbHost.includes('127.0.0.1');
const isRender = dbHost.includes('render.com');

if (isLocal) {
  console.log('   🏠 Conexión LOCAL detectada');
  console.log('   ℹ️  SSL: No requerido');
} else if (isRender) {
  console.log('   ☁️  Conexión REMOTA (Render) detectada');
  console.log('   ℹ️  SSL: Habilitado automáticamente');
} else {
  console.log('   ☁️  Conexión REMOTA detectada');
  console.log('   ℹ️  SSL: Habilitado automáticamente');
}

// 5. Verificar que node_modules existe
console.log('\n5️⃣ Verificando dependencias...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
const nodeModulesExists = fs.existsSync(nodeModulesPath);

if (nodeModulesExists) {
  console.log('   ✅ node_modules encontrado');
} else {
  console.log('   ❌ node_modules NO encontrado');
  console.log('   💡 Solución: Ejecuta "npm install"');
  process.exit(1);
}

// 6. Verificar archivos críticos
console.log('\n6️⃣ Verificando archivos críticos del proyecto...');
const criticalFiles = [
  'package.json',
  'tsconfig.json',
  'src/main.ts',
  'src/app.module.ts',
  'src/config/database.config.ts',
  'src/services/chatbot.service.ts',
  'src/controllers/chatbot.controller.ts',
];

let allFilesPresent = true;
for (const file of criticalFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} NO ENCONTRADO`);
    allFilesPresent = false;
  }
}

if (!allFilesPresent) {
  console.log('\n   ⚠️  Algunos archivos críticos faltan. Verifica la integridad del proyecto.');
}

// 7. Intentar conexión a la base de datos
console.log('\n7️⃣ Probando conexión a PostgreSQL...');
console.log('   ⏳ Intentando conectar...');

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_HOST && !process.env.DB_HOST.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
  connectionTimeoutMillis: 10000,
});

pool.query('SELECT NOW() as current_time, version() as pg_version')
  .then(result => {
    console.log('   ✅ CONEXIÓN EXITOSA');
    console.log(`   🕐 Hora del servidor: ${result.rows[0].current_time}`);
    console.log(`   📦 PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
    
    // Verificar tablas necesarias
    return pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('producto', 'pedido', 'pedido_producto', 'producto_calificacion', 'usuario', 'categoria')
      ORDER BY table_name
    `);
  })
  .then(result => {
    console.log('\n8️⃣ Verificando tablas requeridas...');
    const requiredTables = ['producto', 'pedido', 'pedido_producto', 'producto_calificacion', 'usuario', 'categoria'];
    const existingTables = result.rows.map(row => row.table_name);
    
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`   ✅ Tabla "${table}" encontrada`);
      } else {
        console.log(`   ⚠️  Tabla "${table}" NO encontrada (puede causar errores)`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DIAGNÓSTICO COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n💡 El microservicio debería funcionar correctamente.');
    console.log('   Ejecuta: npm run start:dev\n');
    
    pool.end();
    process.exit(0);
  })
  .catch(error => {
    console.log('   ❌ ERROR DE CONEXIÓN');
    console.log(`   📝 Mensaje: ${error.message}`);
    console.log(`   🔢 Código: ${error.code || 'N/A'}`);
    
    console.log('\n💡 Posibles soluciones:');
    
    if (error.code === '28P01') {
      console.log('   • Verifica el usuario y contraseña en el archivo .env');
      console.log('   • Asegúrate de copiar las credenciales correctas desde Render');
    } else if (error.code === '3D000') {
      console.log('   • El nombre de la base de datos es incorrecto');
      console.log('   • Verifica DB_NAME en tu archivo .env');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   • El host de la base de datos no se puede encontrar');
      console.log('   • Verifica DB_HOST en tu archivo .env');
      console.log('   • Verifica tu conexión a internet');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   • Timeout de conexión');
      console.log('   • Verifica tu conexión a internet');
      console.log('   • Verifica que Render esté operativo');
    } else {
      console.log('   • Consulta la documentación: CONFIGURACION_RENDER.md');
      console.log('   • Verifica el archivo .env');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('❌ DIAGNÓSTICO COMPLETADO CON ERRORES');
    console.log('='.repeat(60) + '\n');
    
    pool.end();
    process.exit(1);
  });

