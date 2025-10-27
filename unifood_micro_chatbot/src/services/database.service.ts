import { Injectable } from '@nestjs/common';
import { pool } from '../config/database.config';

/**
 * Servicio de acceso a base de datos
 * Encapsula todas las consultas SQL del microservicio
 */
@Injectable()
export class DatabaseService {
  /**
   * Obtiene el ranking de productos por ventas
   * @param limite - Número máximo de productos a retornar
   * @returns Array de productos ordenados por cantidad de ventas
   */
  async obtenerRankingVentas(limite: number = 10) {
    const query = `
      SELECT 
        p.id as id_producto,
        p.nombre,
        p.descripcion,
        p.precio,
        p.imagen_url,
        c.nombre as categoria,
        COUNT(DISTINCT pp.id) as total_ventas,
        COALESCE(AVG(pc.resena), 0)::numeric(3,2) as promedio_calificacion,
        COUNT(DISTINCT pc.id) as total_resenas
      FROM producto p
      LEFT JOIN categoria c ON p.categoria_id = c.id
      LEFT JOIN pedido_producto pp ON p.id = pp.producto_id
      LEFT JOIN producto_calificacion pc ON p.id = pc.producto_id
      WHERE p.estado = true
      GROUP BY p.id, c.nombre
      ORDER BY total_ventas DESC, promedio_calificacion DESC
      LIMIT $1
    `;
    
    try {
      const result = await pool.query(query, [limite]);
      console.log(`✅ Ranking de ventas obtenido: ${result.rows.length} productos`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error en obtenerRankingVentas:', error);
      throw new Error('Error al obtener ranking de ventas');
    }
  }

  /**
   * Obtiene el ranking de productos por calificación
   * @param limite - Número máximo de productos a retornar
   * @returns Array de productos ordenados por calificación promedio
   */
  async obtenerRankingCalificaciones(limite: number = 10) {
    const query = `
      SELECT 
        p.id as id_producto,
        p.nombre,
        p.descripcion,
        p.precio,
        p.imagen_url,
        c.nombre as categoria,
        COALESCE(AVG(pc.resena), 0)::numeric(3,2) as promedio_calificacion,
        COUNT(DISTINCT pc.id) as total_resenas,
        COUNT(DISTINCT pp.id) as total_ventas
      FROM producto p
      LEFT JOIN categoria c ON p.categoria_id = c.id
      LEFT JOIN producto_calificacion pc ON p.id = pc.producto_id
      LEFT JOIN pedido_producto pp ON p.id = pp.producto_id
      WHERE p.estado = true
      GROUP BY p.id, c.nombre
      HAVING COUNT(pc.id) >= 3
      ORDER BY promedio_calificacion DESC, total_resenas DESC
      LIMIT $1
    `;
    
    try {
      const result = await pool.query(query, [limite]);
      console.log(`✅ Ranking de calificaciones obtenido: ${result.rows.length} productos`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error en obtenerRankingCalificaciones:', error);
      throw new Error('Error al obtener ranking de calificaciones');
    }
  }

  /**
   * Obtiene el historial de compras de un usuario
   * @param userId - ID del usuario
   * @returns Array de productos comprados por el usuario
   */
  async obtenerHistorialUsuario(userId: number) {
    const query = `
      SELECT 
        p.id as id_producto,
        p.nombre,
        c.nombre as categoria,
        p.precio,
        COUNT(DISTINCT pp.id) as veces_comprado,
        MAX(ped.fecha_registro) as ultima_compra
      FROM producto p
      INNER JOIN categoria c ON p.categoria_id = c.id
      INNER JOIN pedido_producto pp ON p.id = pp.producto_id
      INNER JOIN pedido ped ON pp.pedido_id = ped.id
      WHERE ped.cliente_id = $1
      GROUP BY p.id, c.nombre
      ORDER BY veces_comprado DESC, ultima_compra DESC
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      console.log(`✅ Historial de usuario ${userId}: ${result.rows.length} productos únicos`);
      return result.rows;
    } catch (error) {
      console.error(`❌ Error en obtenerHistorialUsuario(${userId}):`, error);
      throw new Error('Error al obtener historial del usuario');
    }
  }

  /**
   * Obtiene productos populares filtrados por categorías
   * @param categorias - Array de categorías preferidas
   * @param limite - Número máximo de productos
   * @param excluirIds - IDs de productos a excluir
   * @returns Array de productos recomendados
   */
  async obtenerProductosPopularesPorCategoria(
    categorias: string[],
    limite: number = 5,
    excluirIds: number[] = []
  ) {
    const query = `
      SELECT 
        p.id as id_producto,
        p.nombre,
        p.descripcion,
        p.precio,
        p.imagen_url,
        c.nombre as categoria,
        COUNT(DISTINCT pp.id) as total_ventas,
        COALESCE(AVG(pc.resena), 0)::numeric(3,2) as promedio_calificacion
      FROM producto p
      INNER JOIN categoria c ON p.categoria_id = c.id
      LEFT JOIN pedido_producto pp ON p.id = pp.producto_id
      LEFT JOIN producto_calificacion pc ON p.id = pc.producto_id
      WHERE p.estado = true
        AND c.nombre = ANY($1)
        ${excluirIds.length > 0 ? 'AND p.id != ALL($3)' : ''}
      GROUP BY p.id, c.nombre
      ORDER BY total_ventas DESC, promedio_calificacion DESC
      LIMIT $2
    `;
    
    try {
      const params = excluirIds.length > 0 
        ? [categorias, limite, excluirIds]
        : [categorias, limite];
      
      const result = await pool.query(query, params);
      console.log(`✅ Productos populares por categoría: ${result.rows.length} productos`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error en obtenerProductosPopularesPorCategoria:', error);
      throw new Error('Error al obtener productos populares por categoría');
    }
  }

  /**
   * Obtiene productos más populares globalmente
   * @param limite - Número máximo de productos
   * @returns Array de productos más vendidos
   */
  async obtenerProductosPopulares(limite: number = 50) {
    const query = `
      SELECT 
        p.id as id_producto,
        p.nombre,
        c.nombre as categoria,
        p.precio,
        p.imagen_url,
        p.descripcion,
        COUNT(DISTINCT pp.id) as total_ventas,
        COALESCE(AVG(pc.resena), 0)::numeric(3,2) as promedio_calificacion
      FROM producto p
      LEFT JOIN categoria c ON p.categoria_id = c.id
      LEFT JOIN pedido_producto pp ON p.id = pp.producto_id
      LEFT JOIN producto_calificacion pc ON p.id = pc.producto_id
      WHERE p.estado = true
      GROUP BY p.id, c.nombre
      ORDER BY total_ventas DESC, promedio_calificacion DESC
      LIMIT $1
    `;
    
    try {
      const result = await pool.query(query, [limite]);
      console.log(`✅ Productos populares globales: ${result.rows.length} productos`);
      return result.rows;
    } catch (error) {
      console.error('❌ Error en obtenerProductosPopulares:', error);
      throw new Error('Error al obtener productos populares');
    }
  }

  /**
   * Obtiene información de un producto específico
   * @param productoId - ID del producto
   * @returns Información detallada del producto
   */
  async obtenerProductoPorId(productoId: number) {
    const query = `
      SELECT 
        p.*,
        c.nombre as categoria,
        COALESCE(AVG(pc.resena), 0)::numeric(3,2) as promedio_calificacion,
        COUNT(DISTINCT pc.id) as total_resenas,
        COUNT(DISTINCT pp.id) as total_ventas
      FROM producto p
      LEFT JOIN categoria c ON p.categoria_id = c.id
      LEFT JOIN producto_calificacion pc ON p.id = pc.producto_id
      LEFT JOIN pedido_producto pp ON p.id = pp.producto_id
      WHERE p.id = $1
      GROUP BY p.id, c.nombre
    `;
    
    try {
      const result = await pool.query(query, [productoId]);
      console.log(`✅ Producto ${productoId} obtenido: ${result.rows[0] ? 'encontrado' : 'no encontrado'}`);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`❌ Error en obtenerProductoPorId(${productoId}):`, error);
      throw new Error('Error al obtener información del producto');
    }
  }
}

