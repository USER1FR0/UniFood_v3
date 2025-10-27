import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecomendacionService } from '../services/recomendacion.service';
import {
  CrearRecomendacionDto,
  ActualizarRecomendacionDto,
  RegistrarInteraccionDto,
  FiltrosRecomendacionDto,
} from '../models/recomendacion.model';

@Controller('recomendaciones')
export class RecomendacionController {
  constructor(private readonly recomendacionService: RecomendacionService) {}

  // ============================================
  // ENDPOINTS PÚBLICOS (Para clientes)
  // ============================================

  /**
   * GET /unifood/api/recomendaciones/publicas
   * Obtener recomendaciones activas para mostrar en el home
   */
  @Get('publicas')
  async obtenerRecomendacionesPublicas(@Query() filtros: FiltrosRecomendacionDto) {
    // Forzar que solo sean activas
    const filtrosPublicos: FiltrosRecomendacionDto = {
      ...filtros,
      activo: true,
      incluir_producto: true,
      incluir_metricas: true,
    };

    return this.recomendacionService.obtenerRecomendaciones(filtrosPublicos);
  }

  /**
   * GET /unifood/api/recomendaciones/publicas/tipo/:tipo
   * Obtener recomendaciones por tipo específico
   */
  @Get('publicas/tipo/:tipo')
  async obtenerRecomendacionesPorTipo(
    @Param('tipo') tipo: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.recomendacionService.obtenerRecomendaciones({
      tipo: tipo as any,
      activo: true,
      limit: limit || 10,
      incluir_producto: true,
      incluir_metricas: true,
    });
  }

  /**
   * POST /unifood/api/recomendaciones/interaccion
   * Registrar interacción del cliente con una recomendación
   */
  @Post('interaccion')
  @HttpCode(HttpStatus.CREATED)
  async registrarInteraccion(@Body() dto: RegistrarInteraccionDto) {
    return this.recomendacionService.registrarInteraccion(dto);
  }

  // ============================================
  // ENDPOINTS DE SUPERVISOR
  // ============================================

  /**
   * GET /unifood/api/recomendaciones
   * Obtener todas las recomendaciones (incluyendo inactivas)
   * Requiere autenticación de supervisor
   */
  @Get()
  async obtenerTodasRecomendaciones(@Query() filtros: FiltrosRecomendacionDto) {
    const filtrosCompletos: FiltrosRecomendacionDto = {
      ...filtros,
      incluir_producto: true,
      incluir_metricas: true,
      ignorar_fechas: true, // El supervisor puede ver todas las recomendaciones, vigentes o no
    };

    return this.recomendacionService.obtenerRecomendaciones(filtrosCompletos);
  }

  /**
   * GET /unifood/api/recomendaciones/resumen
   * Obtener resumen estadístico de recomendaciones
   */
  @Get('resumen')
  async obtenerResumen() {
    return this.recomendacionService.obtenerResumenRecomendaciones();
  }

  /**
   * GET /unifood/api/recomendaciones/:id
   * Obtener una recomendación específica
   */
  @Get(':id')
  async obtenerRecomendacionPorId(@Param('id', ParseIntPipe) id: number) {
    return this.recomendacionService.obtenerRecomendacionPorId(id);
  }

  /**
   * GET /unifood/api/recomendaciones/:id/estadisticas
   * Obtener estadísticas de interacciones de una recomendación
   */
  @Get(':id/estadisticas')
  async obtenerEstadisticas(@Param('id', ParseIntPipe) id: number) {
    return this.recomendacionService.obtenerEstadisticasRecomendacion(id);
  }

  /**
   * POST /unifood/api/recomendaciones
   * Crear una nueva recomendación manual
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crearRecomendacion(
    @Body() dto: CrearRecomendacionDto,
    @Req() req: any,
  ) {
    // TODO: Extraer supervisor_id del JWT cuando se implemente auth
    // const supervisorId = req.user?.id_rol;
    const supervisorId = undefined; // Por ahora undefined

    return this.recomendacionService.crearRecomendacion(dto, supervisorId);
  }

  /**
   * PUT /unifood/api/recomendaciones/:id
   * Actualizar una recomendación existente
   */
  @Put(':id')
  async actualizarRecomendacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarRecomendacionDto,
  ) {
    return this.recomendacionService.actualizarRecomendacion(id, dto);
  }

  /**
   * DELETE /unifood/api/recomendaciones/:id
   * Eliminar una recomendación
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async eliminarRecomendacion(@Param('id', ParseIntPipe) id: number) {
    return this.recomendacionService.eliminarRecomendacion(id);
  }

  // ============================================
  // ENDPOINTS DE CÁLCULO AUTOMÁTICO
  // ============================================

  /**
   * POST /unifood/api/recomendaciones/generar/mas-vendidos
   * Generar automáticamente recomendaciones de productos más vendidos
   */
  @Post('generar/mas-vendidos')
  @HttpCode(HttpStatus.CREATED)
  async generarMasVendidos(
    @Query('limite', new ParseIntPipe({ optional: true })) limite?: number,
  ) {
    return this.recomendacionService.generarRecomendacionesMasVendidos(
      limite || 5,
    );
  }

  /**
   * POST /unifood/api/recomendaciones/generar/mejor-calificados
   * Generar automáticamente recomendaciones de productos mejor calificados
   */
  @Post('generar/mejor-calificados')
  @HttpCode(HttpStatus.CREATED)
  async generarMejorCalificados(
    @Query('limite', new ParseIntPipe({ optional: true })) limite?: number,
  ) {
    return this.recomendacionService.generarRecomendacionesMejorCalificados(
      limite || 5,
    );
  }

  /**
   * PUT /unifood/api/recomendaciones/producto/:productoId/metricas
   * Actualizar manualmente las métricas de un producto
   */
  @Put('producto/:productoId/metricas')
  async actualizarMetricas(
    @Param('productoId', ParseIntPipe) productoId: number,
  ) {
    return this.recomendacionService.actualizarMetricasProducto(productoId);
  }

  /**
   * POST /unifood/api/recomendaciones/generar/inteligentes
   * Generar recomendaciones usando IA del microservicio de chatbot
   * Este endpoint usa el chatbot para obtener análisis más precisos
   */
  @Post('generar/inteligentes')
  @HttpCode(HttpStatus.CREATED)
  async generarRecomendacionesInteligentes(
    @Query('limite', new ParseIntPipe({ optional: true })) limite?: number,
  ) {
    return this.recomendacionService.generarRecomendacionesInteligentes(
      limite || 10,
    );
  }

  /**
   * GET /unifood/api/recomendaciones/chatbot/estado
   * Verificar si el microservicio del chatbot está disponible
   */
  @Get('chatbot/estado')
  async verificarChatbot() {
    const disponible = await this.recomendacionService.verificarChatbotDisponible();
    return {
      chatbot_disponible: disponible, // ✅ Cambio de 'disponible' a 'chatbot_disponible'
      mensaje: disponible
        ? 'Microservicio de chatbot disponible'
        : 'Microservicio de chatbot no disponible',
      chatbot_url: 'http://localhost:6000',
    };
  }
}

