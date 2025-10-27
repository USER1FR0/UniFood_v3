// Cargar variables de entorno ANTES de cualquier import
import * as path from 'path';
import * as dotenv from 'dotenv';

// Determinar la ruta del .env (funciona en desarrollo y producción)
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

console.log(`📁 Cargando variables de entorno desde: ${envPath}\n`);

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { testDatabaseConnection } from './config/database.config';

/**
 * Función principal de arranque del microservicio
 */
async function bootstrap() {

  // Crear aplicación NestJS
  const app = await NestFactory.create(AppModule);

  // Configurar CORS para permitir peticiones del backend principal
  app.enableCors({
    origin: [
      process.env.BACKEND_URL || 'http://localhost:3000',
      'http://localhost:4200', // Frontend Angular
      'http://localhost:3000', // Backend principal
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Configurar prefijo global (opcional)
  // app.setGlobalPrefix('api');

  // Obtener puerto de variables de entorno
  const port = process.env.PORT || 6000;

  // Verificar conexión a base de datos antes de iniciar
  console.log('\n🔍 Verificando conexión a PostgreSQL...');
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.error('\n❌ No se pudo conectar a la base de datos');
    console.error('Verifica las credenciales en el archivo .env');
    process.exit(1);
  }

  // Iniciar servidor
  await app.listen(port);

  console.log('\n' + '='.repeat(60));
  console.log('🤖 MICROSERVICIO DE CHATBOT INTELIGENTE - UNIFOOD');
  console.log('='.repeat(60));
  console.log(`✅ Servidor ejecutándose en: http://localhost:${port}`);
  console.log(`📡 Health check: http://localhost:${port}/chatbot/health`);
  console.log('='.repeat(60));
  console.log('\n📋 Endpoints disponibles:');
  console.log(`   POST   http://localhost:${port}/chatbot/consulta`);
  console.log(`   GET    http://localhost:${port}/chatbot/rankings/:tipo`);
  console.log(`   GET    http://localhost:${port}/chatbot/recomendaciones/:userId`);
  console.log(`   GET    http://localhost:${port}/chatbot/estadisticas`);
  console.log(`   GET    http://localhost:${port}/chatbot/health`);
  console.log('\n💡 Modo: ' + (process.env.NODE_ENV || 'development'));
  console.log('='.repeat(60) + '\n');
}

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar aplicación
bootstrap();

