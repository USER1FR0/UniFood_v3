// ============================================
// RESPONSABILIDAD:
// - Agrupar controller, service y dependencias
// - Configurar qué está disponible en este módulo
// - Exportar servicios para otros módulos
// ============================================
// INTERACTÚA CON:
// - app.module.ts: Es importado allí
// - Otros módulos: Puede importar CacheModule, etc.
// ============================================

import { Module } from '@nestjs/common';
import { RecursoController } from '../controllers/ejemplo.controller';
import { RecursoService } from '../services/ejemplo.service';
//import { CacheModule } from './cache.module';
import { Pool } from 'pg';

@Module({
  // IMPORTS: Módulos que este módulo NECESITA
  imports: [
   // CacheModule, // Para usar CacheService
  ],

  // CONTROLLERS: Componentes que exponen endpoints
  controllers: [
    RecursoController,
  ],

  // PROVIDERS: Servicios y recursos inyectables
  providers: [
    RecursoService,
    
    // PROVIDER PERSONALIZADO: Inyectar conexión PostgreSQL
    {
      provide: 'DATABASE_POOL', // Nombre del token de inyección
      useFactory: () => {
        // Factory function: se ejecuta una vez al iniciar
        return new Pool({
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          max: 20, // Pool de 20 conexiones
        });
      },
    },
  ],

  // EXPORTS: Qué puede usar otros módulos
  exports: [
    RecursoService, // Otros módulos pueden inyectar RecursoService
  ],
})
export class RecursoModule {}
/**
 * Los módulos agrupan funcionalidad relacionada
 * Importan otros módulos para reutilizar servicios
 * Registran controllers y providers (servicios)
 * Usan inyección de dependencias para compartir instancias
 * Mantienen el código organizado y modular
 */