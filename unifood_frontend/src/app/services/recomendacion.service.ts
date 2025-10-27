import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';
import {
  Recomendacion,
  CrearRecomendacionDto,
  ActualizarRecomendacionDto,
  RegistrarInteraccionDto,
  FiltrosRecomendacionDto,
  TipoRecomendacion,
  ResumenRecomendaciones,
  EstadisticasInteraccion,
} from '../models/recomendacion.model';

@Injectable({
  providedIn: 'root',
})
export class RecomendacionService {
  private apiUrl = `${environment.apiUrl}/recomendaciones`;

  constructor(private http: HttpClient) {}

  // ============================================
  // MÉTODOS PÚBLICOS (Para clientes)
  // ============================================

  /**
   * Obtener recomendaciones públicas activas
   */
  obtenerRecomendacionesPublicas(
    filtros?: FiltrosRecomendacionDto
  ): Observable<Recomendacion[]> {
    let params = new HttpParams();

    if (filtros?.tipo) {
      params = params.set('tipo', filtros.tipo);
    }
    if (filtros?.limit) {
      params = params.set('limit', filtros.limit.toString());
    }

    return this.http.get<Recomendacion[]>(`${this.apiUrl}/publicas`, {
      params,
    });
  }

  /**
   * Obtener recomendaciones por tipo específico
   */
  obtenerRecomendacionesPorTipo(
    tipo: TipoRecomendacion,
    limit?: number
  ): Observable<Recomendacion[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }

    return this.http.get<Recomendacion[]>(
      `${this.apiUrl}/publicas/tipo/${tipo}`,
      { params }
    );
  }

  /**
   * Registrar interacción del cliente con una recomendación
   */
  registrarInteraccion(
    dto: RegistrarInteraccionDto
  ): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(
      `${this.apiUrl}/interaccion`,
      dto
    );
  }

  // ============================================
  // MÉTODOS DE SUPERVISOR
  // ============================================

  /**
   * Obtener todas las recomendaciones (incluye inactivas)
   */
  obtenerTodasRecomendaciones(
    filtros?: FiltrosRecomendacionDto
  ): Observable<Recomendacion[]> {
    let params = new HttpParams();

    if (filtros?.tipo) {
      params = params.set('tipo', filtros.tipo);
    }
    if (filtros?.activo !== undefined) {
      params = params.set('activo', filtros.activo.toString());
    }
    if (filtros?.limit) {
      params = params.set('limit', filtros.limit.toString());
    }

    return this.http.get<Recomendacion[]>(this.apiUrl, { params });
  }

  /**
   * Obtener resumen estadístico
   */
  obtenerResumen(): Observable<ResumenRecomendaciones> {
    return this.http.get<ResumenRecomendaciones>(`${this.apiUrl}/resumen`);
  }

  /**
   * Obtener una recomendación por ID
   */
  obtenerRecomendacionPorId(id: number): Observable<Recomendacion> {
    return this.http.get<Recomendacion>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener estadísticas de interacciones
   */
  obtenerEstadisticas(id: number): Observable<EstadisticasInteraccion> {
    return this.http.get<EstadisticasInteraccion>(
      `${this.apiUrl}/${id}/estadisticas`
    );
  }

  /**
   * Crear nueva recomendación manual
   */
  crearRecomendacion(dto: CrearRecomendacionDto): Observable<Recomendacion> {
    return this.http.post<Recomendacion>(this.apiUrl, dto);
  }

  /**
   * Actualizar recomendación existente
   */
  actualizarRecomendacion(
    id: number,
    dto: ActualizarRecomendacionDto
  ): Observable<Recomendacion> {
    return this.http.put<Recomendacion>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Eliminar recomendación
   */
  eliminarRecomendacion(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`);
  }

  // ============================================
  // MÉTODOS DE CÁLCULO AUTOMÁTICO
  // ============================================

  /**
   * Generar recomendaciones de productos más vendidos
   */
  generarMasVendidos(limite?: number): Observable<Recomendacion[]> {
    let params = new HttpParams();
    if (limite) {
      params = params.set('limite', limite.toString());
    }

    return this.http.post<Recomendacion[]>(
      `${this.apiUrl}/generar/mas-vendidos`,
      {},
      { params }
    );
  }

  /**
   * Generar recomendaciones de productos mejor calificados
   */
  generarMejorCalificados(limite?: number): Observable<Recomendacion[]> {
    let params = new HttpParams();
    if (limite) {
      params = params.set('limite', limite.toString());
    }

    return this.http.post<Recomendacion[]>(
      `${this.apiUrl}/generar/mejor-calificados`,
      {},
      { params }
    );
  }

  /**
   * Actualizar métricas de un producto específico
   */
  actualizarMetricas(productoId: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/producto/${productoId}/metricas`,
      {}
    );
  }

  /**
   * Generar recomendaciones inteligentes usando el microservicio del chatbot
   * Este método usa IA para análisis más precisos
   */
  generarRecomendacionesConIA(limite?: number): Observable<any> {
    let params = new HttpParams();
    if (limite) {
      params = params.set('limite', limite.toString());
    }

    return this.http.post(
      `${this.apiUrl}/generar/inteligentes`,
      {},
      { params }
    );
  }

  /**
   * Verificar si el microservicio del chatbot está disponible
   */
  verificarEstadoChatbot(): Observable<any> {
    return this.http.get(`${this.apiUrl}/chatbot/estado`);
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Obtener etiqueta en español para tipo de recomendación
   */
  obtenerEtiquetaTipo(tipo: TipoRecomendacion): string {
    const etiquetas: Record<TipoRecomendacion, string> = {
      [TipoRecomendacion.MAS_VENDIDO]: 'Más Vendido',
      [TipoRecomendacion.MEJOR_CALIFICADO]: 'Mejor Calificado',
      [TipoRecomendacion.OFERTA]: 'Oferta',
      [TipoRecomendacion.MANUAL]: 'Manual',
    };
    return etiquetas[tipo] || tipo;
  }

  /**
   * Obtener color para tipo de recomendación
   */
  obtenerColorTipo(tipo: TipoRecomendacion): string {
    const colores: Record<TipoRecomendacion, string> = {
      [TipoRecomendacion.MAS_VENDIDO]: '#ff6b6b',
      [TipoRecomendacion.MEJOR_CALIFICADO]: '#51cf66',
      [TipoRecomendacion.OFERTA]: '#ffd43b',
      [TipoRecomendacion.MANUAL]: '#748ffc',
    };
    return colores[tipo] || '#868e96';
  }

  /**
   * Obtener icono para tipo de recomendación
   */
  obtenerIconoTipo(tipo: TipoRecomendacion): string {
    const iconos: Record<TipoRecomendacion, string> = {
      [TipoRecomendacion.MAS_VENDIDO]: '🔥',
      [TipoRecomendacion.MEJOR_CALIFICADO]: '⭐',
      [TipoRecomendacion.OFERTA]: '💰',
      [TipoRecomendacion.MANUAL]: '📌',
    };
    return iconos[tipo] || '📦';
  }
}

