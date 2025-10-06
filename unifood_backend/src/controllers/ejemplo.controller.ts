// ============================================
// RESPONSABILIDAD:
// - Exponer endpoints REST (GET, POST, PUT, DELETE)
// - Recibir requests HTTP
// - Validar datos con DTOs
// - Delegar toda la lógica al Service
// - Devolver respuestas JSON
// ============================================
// INTERACTÚA CON:
// - Frontend: Recibe requests HTTP
// - EjemploService: Delega toda la lógica
// - Guards: Valida autenticación (opcional)
// ============================================

import {
  Controller,    // Define que es un controller
  Get,           // HTTP GET
  Post,          // HTTP POST
  Put,           // HTTP PUT
  Delete,        // HTTP DELETE
  Patch,         // HTTP PATCH
  Body,          // Extrae datos del body
  Param,         // Extrae parámetros de ruta
  Query,         // Extrae query parameters
  HttpCode,      // Define código de respuesta HTTP
  HttpStatus,    // Enum de códigos HTTP
  UseGuards,     // Aplica guards (autenticación, etc.)
} from '@nestjs/common';
import { RecursoService } from '../services/ejemplo.service';
import { CreateRecursoDto, UpdateRecursoDto } from '../models/ejemplo.model';
//import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('recursos') // Ruta base: /unifood/api/recursos
//@UseGuards(JwtAuthGuard) // Protege TODOS los endpoints del controller
export class RecursoController {
  
  // INYECCIÓN DE DEPENDENCIAS: NestJS instancia automáticamente
  constructor(private readonly recursoService: RecursoService) {}

  // ===== CREATE =====
  // POST /unifood/api/recursos
  @Post()
  @HttpCode(HttpStatus.CREATED) // Código 201
  async metodoCrear(@Body() dto: CreateRecursoDto) {
    // @Body() → Extrae JSON del cuerpo de la petición
    // dto es validado automáticamente por class-validator
    return this.recursoService.metodoCrear(dto);
  }

  // ===== READ ALL =====
  // GET /unifood/api/recursos
  // GET /unifood/api/recursos?filtro=valor&page=1
  @Get()
  async metodoObtenerTodos(
    @Query('filtro') filtro?: string, // Query param opcional
    @Query('page') page?: number,
  ) {
    // @Query('nombre') → Lee ?nombre=valor de la URL
    return this.recursoService.metodoObtenerTodos(filtro, page);
  }

  // ===== READ ONE =====
  // GET /unifood/api/recursos/123
  @Get(':id') // :id es un parámetro dinámico
  async metodoObtenerUno(@Param('id') id: number) {
    // @Param('id') → Extrae el valor de la ruta
    // NestJS convierte automáticamente a número si transform: true
    return this.recursoService.metodoObtenerPorId(id);
  }

  // ===== UPDATE COMPLETO =====
  // PUT /unifood/api/recursos/123
  @Put(':id')
  async metodoActualizar(
    @Param('id') id: number,
    @Body() dto: UpdateRecursoDto,
  ) {
    // PUT reemplaza todo el recurso
    return this.recursoService.metodoActualizar(id, dto);
  }

  // ===== UPDATE PARCIAL =====
  // PATCH /unifood/api/recursos/123
  @Patch(':id')
  async metodoActualizarParcial(
    @Param('id') id: number,
    @Body() dto: Partial<UpdateRecursoDto>,
  ) {
    // PATCH actualiza solo campos enviados
    // Partial<T> hace todos los campos opcionales
    return this.recursoService.metodoActualizar(id, dto);
  }

  // ===== DELETE =====
  // DELETE /unifood/api/recursos/123
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Código 204 (sin contenido)
  async metodoEliminar(@Param('id') id: number) {
    return this.recursoService.metodoEliminar(id);
  }

  // ===== ENDPOINT PERSONALIZADO =====
  // POST /unifood/api/recursos/123/accion-especifica
  @Post(':id/accion-especifica')
  async metodoAccionEspecifica(
    @Param('id') id: number,
    @Body() datos: any,
  ) {
    return this.recursoService.metodoAccionEspecifica(id, datos);
  }
}

/**
 * Los controllers son responsables de manejar las solicitudes HTTP.
    * Usan decoradores para definir rutas y métodos HTTP
    * Validan datos de entrada usando DTOs
    * Delegan la lógica de negocio a los servicios
    * Devuelven respuestas JSON con códigos HTTP adecuados
    * Mantienen el código limpio y separado de la lógica de negocio
    * Facilitan la creación de APIs RESTful
 */