import {
  IsInt,
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  Min,
  IsObject,
} from 'class-validator';

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
  producto?: any; // Relación con producto
}

export interface MetricaProducto {
  id: number;
  producto_id: number;
  total_ventas: number;
  calificacion_promedio: number;
  total_calificaciones: number;
  ultima_actualizacion: Date;
}

export interface RecomendacionInteraccion {
  id: number;
  recomendacion_id: number;
  cliente_id?: number;
  tipo_interaccion: TipoInteraccion;
  fecha: Date;
  metadata?: any;
}

export interface RecomendacionConProducto extends Recomendacion {
  producto: {
    id: number;
    nombre: string;
    descripcion?: string;
    precio: number;
    imagen_url?: string;
    categoria?: any;
  };
  metricas?: MetricaProducto;
}

// ============================================
// DTOs - Crear Recomendación
// ============================================

export class CrearRecomendacionDto {
  @IsInt({ message: 'El producto_id debe ser un número entero' })
  @IsNotEmpty({ message: 'El producto_id es obligatorio' })
  producto_id: number;

  @IsEnum(TipoRecomendacion, {
    message: `El tipo debe ser uno de: ${Object.values(TipoRecomendacion).join(', ')}`,
  })
  @IsNotEmpty({ message: 'El tipo de recomendación es obligatorio' })
  tipo_recomendacion: TipoRecomendacion;

  @IsInt({ message: 'La prioridad debe ser un número entero' })
  @Min(0, { message: 'La prioridad debe ser mayor o igual a 0' })
  @IsOptional()
  prioridad?: number;

  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  @IsOptional()
  fecha_inicio?: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
  @IsOptional()
  fecha_fin?: string;

  @IsObject({ message: 'Los metadatos deben ser un objeto válido' })
  @IsOptional()
  metadata?: any;
}

// ============================================
// DTOs - Actualizar Recomendación
// ============================================

export class ActualizarRecomendacionDto {
  @IsEnum(TipoRecomendacion, {
    message: `El tipo debe ser uno de: ${Object.values(TipoRecomendacion).join(', ')}`,
  })
  @IsOptional()
  tipo_recomendacion?: TipoRecomendacion;

  @IsInt({ message: 'La prioridad debe ser un número entero' })
  @Min(0, { message: 'La prioridad debe ser mayor o igual a 0' })
  @IsOptional()
  prioridad?: number;

  @IsBoolean({ message: 'El estado activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;

  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  @IsOptional()
  fecha_inicio?: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
  @IsOptional()
  fecha_fin?: string;

  @IsObject({ message: 'Los metadatos deben ser un objeto válido' })
  @IsOptional()
  metadata?: any;
}

// ============================================
// DTOs - Registrar Interacción
// ============================================

export class RegistrarInteraccionDto {
  @IsInt({ message: 'El recomendacion_id debe ser un número entero' })
  @IsNotEmpty({ message: 'El recomendacion_id es obligatorio' })
  recomendacion_id: number;

  @IsInt({ message: 'El cliente_id debe ser un número entero' })
  @IsOptional()
  cliente_id?: number;

  @IsEnum(TipoInteraccion, {
    message: `El tipo debe ser uno de: ${Object.values(TipoInteraccion).join(', ')}`,
  })
  @IsNotEmpty({ message: 'El tipo de interacción es obligatorio' })
  tipo_interaccion: TipoInteraccion;

  @IsObject({ message: 'Los metadatos deben ser un objeto válido' })
  @IsOptional()
  metadata?: any;
}

// ============================================
// DTOs - Filtros y Consultas
// ============================================

export class FiltrosRecomendacionDto {
  @IsEnum(TipoRecomendacion, {
    message: `El tipo debe ser uno de: ${Object.values(TipoRecomendacion).join(', ')}`,
  })
  @IsOptional()
  tipo?: TipoRecomendacion;

  @IsBoolean({ message: 'El estado activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;

  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @IsOptional()
  limit?: number;

  @IsBoolean({ message: 'incluir_producto debe ser un booleano' })
  @IsOptional()
  incluir_producto?: boolean;

  @IsBoolean({ message: 'incluir_metricas debe ser un booleano' })
  @IsOptional()
  incluir_metricas?: boolean;
}

// ============================================
// DTOs - Respuestas
// ============================================

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

