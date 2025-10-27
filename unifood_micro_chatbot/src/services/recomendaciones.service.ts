import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

/**
 * Servicio de Recomendaciones Personalizadas
 * Implementa algoritmo híbrido de collaborative filtering + content-based
 */
@Injectable()
export class RecomendacionesService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Genera recomendaciones personalizadas para un usuario
   * @param userId - ID del usuario
   * @returns Lista de productos recomendados
   */
  async generarRecomendaciones(userId: number) {
    try {
      console.log(`🤖 Generando recomendaciones para usuario ${userId}`);
      
      // Paso 1: Obtener historial del usuario
      const historial = await this.databaseService.obtenerHistorialUsuario(userId);
      
      if (!historial || historial.length === 0) {
        return {
          usuario_id: userId,
          tiene_historial: false,
          recomendaciones: [],
          mensaje: '¡Aún no has realizado ningún pedido! Te invitamos a explorar nuestro catálogo y hacer tu primera compra. 🎉',
          sugerencia: 'Explora las categorías más populares en el menú principal'
        };
      }

      // Paso 2: Extraer categorías preferidas del usuario
      const categoriasPreferidas = this.extraerCategoriasPreferidas(historial);
      console.log(`📊 Categorías preferidas: ${categoriasPreferidas.join(', ')}`);

      // Paso 3: Obtener IDs de productos ya comprados para excluirlos
      const productosComprados = historial.map(h => h.id_producto);

      // Paso 4: Obtener productos populares de las categorías preferidas
      const recomendaciones = await this.databaseService.obtenerProductosPopularesPorCategoria(
        categoriasPreferidas,
        5,
        productosComprados
      );

      // Paso 5: Si no hay suficientes recomendaciones, agregar productos populares generales
      if (recomendaciones.length < 5) {
        const productosPopulares = await this.databaseService.obtenerProductosPopulares(10);
        const productosExtras = productosPopulares.filter(
          p => !productosComprados.includes(p.id_producto) &&
               !recomendaciones.find(r => r.id_producto === p.id_producto)
        ).slice(0, 5 - recomendaciones.length);
        
        recomendaciones.push(...productosExtras);
      }

      console.log(`✅ Generadas ${recomendaciones.length} recomendaciones`);

      return {
        usuario_id: userId,
        tiene_historial: true,
        total_compras_previas: historial.length,
        categorias_preferidas: categoriasPreferidas,
        total_recomendaciones: recomendaciones.length,
        recomendaciones: recomendaciones.map((p, index) => ({
          posicion: index + 1,
          id_producto: p.id_producto,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: parseFloat(p.precio),
          categoria: p.categoria,
          imagen_url: p.imagen_url,
          total_ventas: parseInt(p.total_ventas || 0),
          promedio_calificacion: parseFloat(p.promedio_calificacion || 0),
          razon_recomendacion: this.generarRazonRecomendacion(p, categoriasPreferidas)
        })),
        mensaje: `Basándonos en tus ${historial.length} compras anteriores, te recomendamos estos productos que creemos que te encantarán 😊`
      };
    } catch (error) {
      console.error('Error en generarRecomendaciones:', error);
      throw new Error('Error al generar recomendaciones personalizadas');
    }
  }

  /**
   * Extrae las 3 categorías más compradas por el usuario
   * @param historial - Historial de compras del usuario
   * @returns Array de categorías ordenadas por frecuencia
   */
  private extraerCategoriasPreferidas(historial: any[]): string[] {
    // Contar frecuencia de cada categoría
    const conteoCategoria = historial.reduce((acc, item) => {
      acc[item.categoria] = (acc[item.categoria] || 0) + parseInt(item.veces_comprado);
      return acc;
    }, {});

    // Ordenar por frecuencia y tomar top 3
    const categoriasOrdenadas = Object.entries(conteoCategoria)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 3)
      .map(([categoria]) => categoria);

    return categoriasOrdenadas;
  }

  /**
   * Genera una razón explicativa de por qué se recomienda un producto
   * @param producto - Producto recomendado
   * @param categoriasPreferidas - Categorías que le gustan al usuario
   * @returns Texto explicativo
   */
  private generarRazonRecomendacion(producto: any, categoriasPreferidas: string[]): string {
    if (categoriasPreferidas.includes(producto.categoria)) {
      return `Te gusta la categoría "${producto.categoria}"`;
    }
    
    if (parseInt(producto.total_ventas) > 50) {
      return 'Producto muy popular entre estudiantes';
    }
    
    if (parseFloat(producto.promedio_calificacion) >= 4.5) {
      return 'Excelentemente calificado';
    }
    
    return 'Recomendado para ti';
  }

  /**
   * Obtiene recomendaciones rápidas sin personalización
   * @param limite - Número de productos a retornar
   * @returns Productos más populares generales
   */
  async obtenerRecomendacionesGenerales(limite: number = 5) {
    try {
      const productos = await this.databaseService.obtenerProductosPopulares(limite);
      
      return {
        tipo: 'recomendaciones_generales',
        total: productos.length,
        productos: productos.map((p, index) => ({
          posicion: index + 1,
          id_producto: p.id_producto,
          nombre: p.nombre,
          categoria: p.categoria,
          precio: parseFloat(p.precio),
          imagen_url: p.imagen_url,
          total_ventas: parseInt(p.total_ventas)
        })),
        mensaje: 'Los productos más populares de UniFood'
      };
    } catch (error) {
      console.error('Error en obtenerRecomendacionesGenerales:', error);
      throw new Error('Error al obtener recomendaciones generales');
    }
  }
}

