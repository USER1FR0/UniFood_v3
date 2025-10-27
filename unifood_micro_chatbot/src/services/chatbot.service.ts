import { Injectable } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RecomendacionesService } from './recomendaciones.service';

/**
 * Tipo de intenciones que el chatbot puede detectar
 */
enum IntencionUsuario {
  RANKING_VENTAS = 'ranking_ventas',
  RANKING_CALIFICACIONES = 'ranking_calificaciones',
  RECOMENDACIONES = 'recomendaciones',
  ESTADISTICAS_GENERALES = 'estadisticas_generales',
  INFORMACION_PRODUCTO = 'informacion_producto',
  SALUDO = 'saludo',
  AYUDA = 'ayuda',
  DESCONOCIDO = 'desconocido'
}

/**
 * Servicio principal del Chatbot
 * Maneja procesamiento de lenguaje natural y enrutamiento de consultas
 */
@Injectable()
export class ChatbotService {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly recomendacionesService: RecomendacionesService,
  ) {}

  /**
   * Procesa un mensaje en lenguaje natural del usuario
   * @param mensaje - Texto enviado por el usuario
   * @param userId - ID del usuario (opcional para recomendaciones personalizadas)
   * @returns Respuesta estructurada del chatbot
   */
  async procesarMensaje(mensaje: string, userId?: number) {
    try {
      console.log(`💬 Procesando mensaje: "${mensaje}"`);
      
      // Detectar intención del usuario
      const intencion = this.detectarIntencion(mensaje);
      console.log(`🎯 Intención detectada: ${intencion}`);

      // Enrutar según intención
      switch (intencion) {
        case IntencionUsuario.RANKING_VENTAS:
          return await this.manejarConsultaRankingVentas(mensaje);

        case IntencionUsuario.RANKING_CALIFICACIONES:
          return await this.manejarConsultaRankingCalificaciones(mensaje);

        case IntencionUsuario.RECOMENDACIONES:
          return await this.manejarConsultaRecomendaciones(userId);

        case IntencionUsuario.ESTADISTICAS_GENERALES:
          return await this.manejarConsultaEstadisticas();

        case IntencionUsuario.SALUDO:
          return this.responderSaludo();

        case IntencionUsuario.AYUDA:
          return this.responderAyuda();

        case IntencionUsuario.DESCONOCIDO:
        default:
          return this.responderIntentNoComprendido(mensaje);
      }
    } catch (error) {
      console.error('Error en procesarMensaje:', error);
      return this.responderError();
    }
  }

  /**
   * Detecta la intención del usuario mediante análisis de palabras clave
   * @param mensaje - Mensaje del usuario en minúsculas
   * @returns Intención detectada
   */
  private detectarIntencion(mensaje: string): IntencionUsuario {
    const mensajeLower = mensaje.toLowerCase().trim();

    // Patrones de ranking de ventas
    if (
      mensajeLower.match(/más vendido|top.*venta|producto.*popular|qué se vende más|más comprado|ranking.*venta|bestseller/) ||
      mensajeLower.match(/cuáles.*más.*vend|cuál.*vend.*más/)
    ) {
      return IntencionUsuario.RANKING_VENTAS;
    }

    // Patrones de ranking de calificaciones
    if (
      mensajeLower.match(/mejor.*calificad|top.*calificacion|producto.*mejor.*valorad|más.*estrella|mejor.*rating|mejor.*puntuad/) ||
      mensajeLower.match(/cuáles.*mejor.*calif|cuál.*más.*estrella/)
    ) {
      return IntencionUsuario.RANKING_CALIFICACIONES;
    }

    // Patrones de recomendaciones
    if (
      mensajeLower.match(/recomienda|recomendación|sugerencia|qué me.*recomiendas|qué debería.*comprar|qué puedo.*comer|qué me.*aconsejas/) ||
      mensajeLower.match(/para mí|personalizado/)
    ) {
      return IntencionUsuario.RECOMENDACIONES;
    }

    // Patrones de estadísticas generales
    if (
      mensajeLower.match(/estadística|análisis.*general|resumen|panorama|visión.*general|métricas/)
    ) {
      return IntencionUsuario.ESTADISTICAS_GENERALES;
    }

    // Patrones de saludo
    if (
      mensajeLower.match(/^(hola|buenos días|buenas tardes|buenas noches|hey|hi|hello|saludos)/)
    ) {
      return IntencionUsuario.SALUDO;
    }

    // Patrones de ayuda
    if (
      mensajeLower.match(/ayuda|help|qué puedes hacer|cómo funciona|qué sabes hacer/)
    ) {
      return IntencionUsuario.AYUDA;
    }

    return IntencionUsuario.DESCONOCIDO;
  }

  /**
   * Maneja consultas sobre ranking de ventas
   */
  private async manejarConsultaRankingVentas(mensaje: string) {
    const limite = this.extraerNumeroLimite(mensaje) || 10;
    const ranking = await this.analyticsService.calcularRankingVentas(limite);
    
    return {
      tipo_respuesta: 'ranking_ventas',
      mensaje_usuario: mensaje,
      respuesta: `Aquí están los ${ranking.total_productos} productos más vendidos en UniFood:`,
      datos: ranking,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Maneja consultas sobre ranking de calificaciones
   */
  private async manejarConsultaRankingCalificaciones(mensaje: string) {
    const limite = this.extraerNumeroLimite(mensaje) || 10;
    const ranking = await this.analyticsService.calcularRankingCalificaciones(limite);
    
    return {
      tipo_respuesta: 'ranking_calificaciones',
      mensaje_usuario: mensaje,
      respuesta: `Estos son los ${ranking.total_productos} productos mejor calificados por nuestros estudiantes:`,
      datos: ranking,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Maneja consultas sobre recomendaciones personalizadas
   */
  private async manejarConsultaRecomendaciones(userId?: number) {
    if (!userId) {
      return {
        tipo_respuesta: 'error',
        mensaje: 'Para darte recomendaciones personalizadas necesito saber quién eres. Por favor, inicia sesión primero.',
        sugerencia: 'También puedes preguntarme por los productos más vendidos o mejor calificados.',
        timestamp: new Date().toISOString()
      };
    }

    const recomendaciones = await this.recomendacionesService.generarRecomendaciones(userId);
    
    return {
      tipo_respuesta: 'recomendaciones',
      mensaje_usuario: 'Quiero recomendaciones personalizadas',
      respuesta: recomendaciones.mensaje,
      datos: recomendaciones,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Maneja consultas sobre estadísticas generales
   */
  private async manejarConsultaEstadisticas() {
    const estadisticas = await this.analyticsService.obtenerEstadisticasGenerales();
    
    return {
      tipo_respuesta: 'estadisticas_generales',
      respuesta: 'Aquí tienes un resumen completo de las estadísticas de UniFood:',
      datos: estadisticas,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Responde a saludos del usuario
   */
  private responderSaludo() {
    const saludos = [
      '¡Hola! 👋 Soy el asistente virtual de UniFood. ¿En qué puedo ayudarte hoy?',
      '¡Hola! 😊 Pregúntame sobre productos populares, recomendaciones o estadísticas.',
      '¡Bienvenido a UniFood! ¿Quieres saber qué productos están de moda?',
    ];
    
    return {
      tipo_respuesta: 'saludo',
      respuesta: saludos[Math.floor(Math.random() * saludos.length)],
      sugerencias: [
        '¿Cuáles son los productos más vendidos?',
        '¿Qué productos tienen mejor calificación?',
        'Dame recomendaciones personalizadas',
      ],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Responde a solicitudes de ayuda
   */
  private responderAyuda() {
    return {
      tipo_respuesta: 'ayuda',
      respuesta: '¡Claro! Puedo ayudarte con varias cosas:',
      capacidades: [
        {
          titulo: '📊 Rankings de Productos',
          ejemplos: ['¿Cuáles son los productos más vendidos?', '¿Qué productos tienen mejor calificación?']
        },
        {
          titulo: '🎯 Recomendaciones Personalizadas',
          ejemplos: ['Recomiéndame algo', '¿Qué debería comprar?']
        },
        {
          titulo: '📈 Estadísticas Generales',
          ejemplos: ['Muéstrame las estadísticas', '¿Cuál es el panorama general?']
        }
      ],
      nota: 'Puedes preguntarme en lenguaje natural, ¡intenta con cualquier pregunta!',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Responde cuando no se comprende la intención
   */
  private responderIntentNoComprendido(mensaje: string) {
    return {
      tipo_respuesta: 'intent_no_comprendido',
      mensaje_usuario: mensaje,
      respuesta: 'Disculpa, no estoy seguro de entender tu pregunta. 🤔',
      sugerencias: [
        'Prueba preguntando: "¿Cuáles son los productos más vendidos?"',
        'O: "¿Qué productos tienen mejor calificación?"',
        'También: "Dame recomendaciones personalizadas"',
        'Escribe "ayuda" para ver todas mis capacidades'
      ],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Responde en caso de error del sistema
   */
  private responderError() {
    return {
      tipo_respuesta: 'error_sistema',
      respuesta: 'Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente en unos momentos.',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Extrae un número límite del mensaje (ej: "top 5", "10 productos")
   * @param mensaje - Mensaje del usuario
   * @returns Número encontrado o null
   */
  private extraerNumeroLimite(mensaje: string): number | null {
    const match = mensaje.match(/\b(\d+)\b/);
    if (match) {
      const num = parseInt(match[1]);
      return num > 0 && num <= 50 ? num : null;
    }
    return null;
  }
}

