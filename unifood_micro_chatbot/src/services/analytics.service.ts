import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

/**
 * Servicio de Analytics
 * Maneja cálculos de rankings y estadísticas del sistema
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Calcula el ranking de productos por ventas
   * @param limite - Número de productos a retornar (default: 10)
   * @returns Ranking de productos más vendidos con estadísticas
   */
  async calcularRankingVentas(limite: number = 10) {
    try {
      const startTime = Date.now();
      
      // Sin caché Redis por ahora, consulta directa
      const productos = await this.databaseService.obtenerRankingVentas(limite);
      
      const tiempoConsulta = Date.now() - startTime;
      
      console.log(`📊 Ranking de ventas calculado en ${tiempoConsulta}ms`);
      
      return {
        tipo: 'ventas',
        total_productos: productos.length,
        tiempo_consulta_ms: tiempoConsulta,
        productos: productos.map((p, index) => ({
          posicion: index + 1,
          id_producto: p.id_producto,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: parseFloat(p.precio),
          categoria: p.categoria,
          imagen_url: p.imagen_url,
          total_ventas: parseInt(p.total_ventas),
          promedio_calificacion: parseFloat(p.promedio_calificacion),
          total_resenas: parseInt(p.total_resenas)
        }))
      };
    } catch (error) {
      console.error('Error en calcularRankingVentas:', error);
      throw new Error('Error al calcular ranking de ventas');
    }
  }

  /**
   * Calcula el ranking de productos por calificación
   * @param limite - Número de productos a retornar (default: 10)
   * @returns Ranking de productos mejor calificados
   */
  async calcularRankingCalificaciones(limite: number = 10) {
    try {
      const startTime = Date.now();
      
      const productos = await this.databaseService.obtenerRankingCalificaciones(limite);
      
      const tiempoConsulta = Date.now() - startTime;
      
      console.log(`⭐ Ranking de calificaciones calculado en ${tiempoConsulta}ms`);
      
      return {
        tipo: 'calificaciones',
        total_productos: productos.length,
        tiempo_consulta_ms: tiempoConsulta,
        criterio: 'Mínimo 3 reseñas para aparecer en el ranking',
        productos: productos.map((p, index) => ({
          posicion: index + 1,
          id_producto: p.id_producto,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: parseFloat(p.precio),
          categoria: p.categoria,
          imagen_url: p.imagen_url,
          promedio_calificacion: parseFloat(p.promedio_calificacion),
          total_resenas: parseInt(p.total_resenas),
          total_ventas: parseInt(p.total_ventas)
        }))
      };
    } catch (error) {
      console.error('Error en calcularRankingCalificaciones:', error);
      throw new Error('Error al calcular ranking de calificaciones');
    }
  }

  /**
   * Obtiene estadísticas generales del sistema
   * @returns Métricas agregadas del sistema
   */
  async obtenerEstadisticasGenerales() {
    try {
      // Obtener top 5 de cada categoría
      const topVentas = await this.calcularRankingVentas(5);
      const topCalificaciones = await this.calcularRankingCalificaciones(5);
      
      return {
        fecha_consulta: new Date().toISOString(),
        top_ventas: topVentas.productos,
        top_calificaciones: topCalificaciones.productos,
        mensaje: 'Estadísticas actualizadas en tiempo real'
      };
    } catch (error) {
      console.error('Error en obtenerEstadisticasGenerales:', error);
      throw new Error('Error al obtener estadísticas generales');
    }
  }
}

