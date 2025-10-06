// ============================================
// RESPONSABILIDAD:
// - Orquestar la lógica de negocio
// - Llamar funciones almacenadas en PostgreSQL
// - Coordinar con otros servicios (cache, microservicios)
// - Manejar errores de negocio
// ============================================
// INTERACTÚA CON:
// - Controller: Recibe llamadas desde aquí
// - PostgreSQL: Ejecuta funciones SQL
// - CacheService: Invalida/consulta caché
// - MicroservicesGateway: Comunica con otros servicios
// ============================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateRecursoDto, UpdateRecursoDto } from '../models/ejemplo.model';
//import { CacheService } from './cache.service';

@Injectable() // Marca como inyectable
export class RecursoService {
  
  constructor(
    @Inject('DATABASE_POOL') private db: Pool, // Conexión BD
   // private cacheService: CacheService, // Otro servicio
  ) {}

  // ===== MÉTODO CREATE =====
  async metodoCrear(dto: CreateRecursoDto) {
    try {
      // 1. LLAMAR FUNCIÓN ALMACENADA EN BD
      const resultado = await this.db.query(
        'SELECT * FROM funcion_crear_recurso($1, $2)',
        [dto.campo1, dto.campo2] // Parámetros posicionales
      );

      const nuevoRecurso = resultado.rows[0];

      // 2. OPERACIONES SECUNDARIAS (caché, notificaciones, etc.)
      //await this.cacheService.invalidar('clave-cache');

      // 3. RETORNAR RESPUESTA ESTRUCTURADA
      return {
        success: true,
        data: nuevoRecurso,
        message: 'Recurso creado exitosamente',
      };
    } catch (error) {
      // MANEJO DE ERRORES
      throw new Error(`Error al crear: ${error.message}`);
    }
  }

  // ===== MÉTODO READ ALL =====
  async metodoObtenerTodos(filtro?: string, page?: number) {
    try {
      // 1. VERIFICAR CACHÉ
      const cacheKey = `recursos-${filtro || 'todos'}-${page || 1}`;
      //const cached = await this.cacheService.obtener(cacheKey);
      
      //if (cached) {
        //return { success: true, data: cached, from: 'cache' };
      //}

      // 2. CONSULTAR BD
      const query = filtro
        ? 'SELECT * FROM obtener_recursos_filtrados($1, $2)'
        : 'SELECT * FROM obtener_todos_recursos($1)';
      
      const params = filtro ? [filtro, page || 1] : [page || 1];
      const resultado = await this.db.query(query, params);

      // 3. GUARDAR EN CACHÉ
      //await this.cacheService.guardar(cacheKey, resultado.rows, 300);

      return { success: true, data: resultado.rows };
    } catch (error) {
      throw new Error(`Error al obtener recursos: ${error.message}`);
    }
  }

  // ===== MÉTODO READ ONE =====
  async metodoObtenerPorId(id: number) {
    const resultado = await this.db.query(
      'SELECT * FROM obtener_recurso_por_id($1)',
      [id]
    );

    if (resultado.rows.length === 0) {
      // LANZAR EXCEPCIÓN HTTP
      throw new NotFoundException(`Recurso con ID ${id} no encontrado`);
    }

    return { success: true, data: resultado.rows[0] };
  }

  // ===== MÉTODO UPDATE =====
  async metodoActualizar(id: number, dto: UpdateRecursoDto | Partial<UpdateRecursoDto>) {
    // Convertir DTO a JSON para enviarlo a la función SQL
    const datosJson = JSON.stringify(dto);
    
    const resultado = await this.db.query(
      'SELECT * FROM actualizar_recurso($1, $2)',
      [id, datosJson]
    );

    if (resultado.rows.length === 0) {
      throw new NotFoundException(`Recurso con ID ${id} no encontrado`);
    }

    // INVALIDAR CACHÉ RELACIONADO
    //await this.cacheService.invalidar('recursos-todos');

    return { success: true, data: resultado.rows[0] };
  }

  // ===== MÉTODO DELETE =====
  async metodoEliminar(id: number) {
    const resultado = await this.db.query(
      'SELECT eliminar_recurso($1) as eliminado',
      [id]
    );

    if (!resultado.rows[0].eliminado) {
      throw new NotFoundException(`Recurso con ID ${id} no encontrado`);
    }

   // await this.cacheService.invalidar('recursos-todos');

    return { success: true, message: 'Recurso eliminado' };
  }

  // ===== MÉTODO PERSONALIZADO =====
  async metodoAccionEspecifica(id: number, datos: any) {
    // Lógica específica del negocio
    const resultado = await this.db.query(
      'SELECT * FROM ejecutar_accion_especifica($1, $2)',
      [id, JSON.stringify(datos)]
    );

    return { success: true, data: resultado.rows };
  }
}

/**
 * Los servicios contienen la lógica de negocio y se comunican con la BD
 * Usan inyección de dependencias para obtener el cliente de BD y otros servicios
 * Cada función maneja un caso de uso específico (CRUD)
 * Manejan errores y lanzan excepciones HTTP cuando es necesario
 * Siempre invalidan o actualizan la caché tras cambios en los datos
 */