import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ChatbotService } from '../services/chatbot.service';
import { AnalyticsService } from '../services/analytics.service';
import { RecomendacionesService } from '../services/recomendaciones.service';

/**
 * DTO para consultas en lenguaje natural
 */
class ConsultaChatbotDto {
  mensaje: string;
  userId?: number;
}

/**
 * Controlador del Microservicio de Chatbot
 * Expone endpoints REST para interacción con el chatbot
 */
@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly analyticsService: AnalyticsService,
    private readonly recomendacionesService: RecomendacionesService,
  ) {}

  /**
   * POST /chatbot/consulta
   * Endpoint principal para procesar mensajes en lenguaje natural
   * 
   * @example
   * Body: { "mensaje": "¿Cuáles son los productos más vendidos?", "userId": 123 }
   */
  @Post('consulta')
  @HttpCode(HttpStatus.OK)
  async procesarConsulta(@Body() dto: ConsultaChatbotDto) {
    try {
      if (!dto.mensaje || dto.mensaje.trim().length === 0) {
        return {
          error: true,
          mensaje: 'El campo "mensaje" es obligatorio y no puede estar vacío',
          codigo: 'MENSAJE_VACIO',
          timestamp: new Date().toISOString()
        };
      }

      const respuesta = await this.chatbotService.procesarMensaje(
        dto.mensaje,
        dto.userId
      );

      return {
        exito: true,
        ...respuesta
      };
    } catch (error) {
      console.error('Error en /consulta:', error);
      return {
        error: true,
        mensaje: 'Error al procesar la consulta',
        detalles: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * GET /chatbot/rankings/:tipo
   * Endpoint directo para obtener rankings sin procesar lenguaje natural
   * 
   * @param tipo - "ventas" o "calificaciones"
   * @example GET /chatbot/rankings/ventas
   */
  @Get('rankings/:tipo')
  async obtenerRanking(@Param('tipo') tipo: string) {
    try {
      if (tipo !== 'ventas' && tipo !== 'calificaciones') {
        return {
          error: true,
          mensaje: 'Tipo de ranking inválido. Usa "ventas" o "calificaciones"',
          tipos_validos: ['ventas', 'calificaciones'],
          timestamp: new Date().toISOString()
        };
      }

      const ranking = tipo === 'ventas'
        ? await this.analyticsService.calcularRankingVentas(10)
        : await this.analyticsService.calcularRankingCalificaciones(10);

      return {
        exito: true,
        tipo_respuesta: `ranking_${tipo}`,
        datos: ranking,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error en /rankings/${tipo}:`, error);
      return {
        error: true,
        mensaje: `Error al obtener ranking de ${tipo}`,
        detalles: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * GET /chatbot/recomendaciones/:userId
   * Endpoint directo para recomendaciones personalizadas
   * 
   * @param userId - ID del usuario
   * @example GET /chatbot/recomendaciones/123
   */
  @Get('recomendaciones/:userId')
  async obtenerRecomendaciones(@Param('userId', ParseIntPipe) userId: number) {
    try {
      if (userId <= 0) {
        return {
          error: true,
          mensaje: 'El userId debe ser un número positivo',
          timestamp: new Date().toISOString()
        };
      }

      const recomendaciones = await this.recomendacionesService.generarRecomendaciones(userId);

      return {
        exito: true,
        tipo_respuesta: 'recomendaciones',
        datos: recomendaciones,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error en /recomendaciones/${userId}:`, error);
      return {
        error: true,
        mensaje: 'Error al generar recomendaciones',
        detalles: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * GET /chatbot/estadisticas
   * Endpoint para obtener estadísticas generales del sistema
   * 
   * @example GET /chatbot/estadisticas
   */
  @Get('estadisticas')
  async obtenerEstadisticas() {
    try {
      const estadisticas = await this.analyticsService.obtenerEstadisticasGenerales();

      return {
        exito: true,
        tipo_respuesta: 'estadisticas_generales',
        datos: estadisticas,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error en /estadisticas:', error);
      return {
        error: true,
        mensaje: 'Error al obtener estadísticas',
        detalles: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * GET /chatbot/health
   * Endpoint de health check para verificar que el microservicio está funcionando
   * 
   * @example GET /chatbot/health
   */
  @Get('health')
  healthCheck() {
    return {
      estado: 'operativo',
      microservicio: 'unifood-chatbot',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      mensaje: '✅ Microservicio de Chatbot funcionando correctamente'
    };
  }
}

