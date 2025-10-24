// ============================================
// ENUMS
// ============================================

export enum TipoRecomendacion {
  MAS_VENDIDO = 'mas_vendido',
  MEJOR_CALIFICADO = 'mejor_calificado',
  OFERTA = 'oferta',
  MANUAL = 'manual',
}

export enum TipoInteraccion {
  VISTA = 'vista',
  CLICK = 'click',
  AGREGADO_CARRITO = 'agregado_carrito',
  COMPRADO = 'comprado',
}

// ============================================
// INTERFACES
// ============================================

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen_url?: string;
  categoria?: Categoria;
  estado?: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface MetricaProducto {
  id: number;
  producto_id: number;
  total_ventas: number;
  calificacion_promedio: number;
  total_calificaciones: number;
  ultima_actualizacion: Date;
}

export interface Recomendacion {
  id: number;
  producto_id: number;
  tipo_recomendacion: TipoRecomendacion;
  prioridad: number;
  activo: boolean;
  fecha_inicio?: Date;
  fecha_fin?: Date;
  supervisor_id?: number;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
  producto?: Producto;
  metricas?: MetricaProducto;
}

export interface RecomendacionInteraccion {
  id: number;
  recomendacion_id: number;
  cliente_id?: number;
  tipo_interaccion: TipoInteraccion;
  fecha: Date;
  metadata?: any;
}

export interface ResumenRecomendaciones {
  total_recomendaciones: number;
  activas: number;
  inactivas: number;
  por_tipo: {
    tipo: TipoRecomendacion;
    cantidad: number;
  }[];
}

export interface EstadisticasInteraccion {
  recomendacion_id: number;
  total_vistas: number;
  total_clicks: number;
  total_agregados_carrito: number;
  total_comprados: number;
  tasa_conversion: number;
}

// ============================================
// DTOs
// ============================================

export interface CrearRecomendacionDto {
  producto_id: number;
  tipo_recomendacion: TipoRecomendacion;
  prioridad?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  metadata?: any;
}

export interface ActualizarRecomendacionDto {
  tipo_recomendacion?: TipoRecomendacion;
  prioridad?: number;
  activo?: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
  metadata?: any;
}

export interface RegistrarInteraccionDto {
  recomendacion_id: number;
  cliente_id?: number;
  tipo_interaccion: TipoInteraccion;
  metadata?: any;
}

export interface FiltrosRecomendacionDto {
  tipo?: TipoRecomendacion;
  activo?: boolean;
  limit?: number;
  incluir_producto?: boolean;
  incluir_metricas?: boolean;
}

