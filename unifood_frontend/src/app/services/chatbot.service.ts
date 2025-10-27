import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';

/**
 * Interfaces para el Microservicio del Chatbot
 */
export interface ProductoChatbot {
  posicion: number;
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen_url: string;
  total_ventas: number;
  promedio_calificacion: number;
  total_resenas: number;
}

export interface RankingVentasResponse {
  exito: boolean;
  tipo_respuesta: string;
  datos: {
    tipo: string;
    total_productos: number;
    tiempo_consulta_ms: number;
    productos: ProductoChatbot[];
  };
  timestamp: string;
}

export interface RankingCalificacionesResponse {
  exito: boolean;
  tipo_respuesta: string;
  datos: {
    tipo: string;
    total_productos: number;
    tiempo_consulta_ms: number;
    criterio: string;
    productos: ProductoChatbot[];
  };
  timestamp: string;
}

export interface RecomendacionPersonalizadaChatbot {
  posicion: number;
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen_url: string;
  total_ventas: number;
  promedio_calificacion: number;
  razon_recomendacion: string;
}

export interface RecomendacionesPersonalizadasResponse {
  exito: boolean;
  tipo_respuesta: string;
  datos: {
    usuario_id: number;
    tiene_historial: boolean;
    total_compras_previas?: number;
    categorias_preferidas?: string[];
    total_recomendaciones: number;
    recomendaciones: RecomendacionPersonalizadaChatbot[];
    mensaje: string;
  };
  timestamp: string;
}

export interface ConsultaChatbotRequest {
  mensaje: string;
  userId?: number;
}

export interface ConsultaChatbotResponse {
  exito: boolean;
  tipo_respuesta: string;
  mensaje_usuario?: string;
  respuesta: string;
  datos?: any;
  timestamp: string;
}

/**
 * Servicio para comunicarse con el Microservicio de Chatbot
 * Puerto 6000 - Análisis de datos y recomendaciones inteligentes
 */
@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  // URL del microservicio del chatbot (puerto 6000)
  private chatbotUrl = 'http://localhost:6000/chatbot';

  constructor(private http: HttpClient) {}

  // ============================================
  // MÉTODOS DE RANKINGS
  // ============================================

  /**
   * Obtener ranking de productos más vendidos desde el chatbot
   */
  obtenerRankingVentas(): Observable<RankingVentasResponse> {
    return this.http.get<RankingVentasResponse>(
      `${this.chatbotUrl}/rankings/ventas`
    );
  }

  /**
   * Obtener ranking de productos mejor calificados desde el chatbot
   */
  obtenerRankingCalificaciones(): Observable<RankingCalificacionesResponse> {
    return this.http.get<RankingCalificacionesResponse>(
      `${this.chatbotUrl}/rankings/calificaciones`
    );
  }

  // ============================================
  // RECOMENDACIONES PERSONALIZADAS
  // ============================================

  /**
   * Obtener recomendaciones personalizadas basadas en historial del usuario
   * @param userId - ID del cliente
   */
  obtenerRecomendacionesPersonalizadas(
    userId: number
  ): Observable<RecomendacionesPersonalizadasResponse> {
    return this.http.get<RecomendacionesPersonalizadasResponse>(
      `${this.chatbotUrl}/recomendaciones/${userId}`
    );
  }

  // ============================================
  // CONSULTA EN LENGUAJE NATURAL
  // ============================================

  /**
   * Enviar consulta en lenguaje natural al chatbot
   * @param mensaje - Pregunta del usuario
   * @param userId - ID del usuario (opcional)
   */
  consultarChatbot(
    mensaje: string,
    userId?: number
  ): Observable<ConsultaChatbotResponse> {
    const request: ConsultaChatbotRequest = { mensaje, userId };
    return this.http.post<ConsultaChatbotResponse>(
      `${this.chatbotUrl}/consulta`,
      request
    );
  }

  // ============================================
  // ESTADÍSTICAS GENERALES
  // ============================================

  /**
   * Obtener estadísticas generales del sistema
   */
  obtenerEstadisticas(): Observable<any> {
    return this.http.get(`${this.chatbotUrl}/estadisticas`);
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  /**
   * Verificar si el microservicio del chatbot está activo
   */
  verificarEstadoChatbot(): Observable<any> {
    return this.http.get(`${this.chatbotUrl}/health`);
  }
}

