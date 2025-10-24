// src/app/models/pedido.model.ts

//import { Prisma } from '@prisma/client';

// ========== INTERFACES BASE ==========

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string;
  categoria_id: number;
  area_venta_id: number;
  tiempo_preparacion: number;
  ingredientes?: string[] | any;
  calorias: number;
}

export interface AreaVenta {
  id: number;
  area_venta: string;
}

export interface Usuario{
  id: number;
  correo_electronico: string;
  rol: string;
}

export interface Vendedor {
  id: number;
  nombre_completo: string;
  telefono: string;
  area_venta_id: number;
  usuario?: Usuario;
  area_venta?: AreaVenta;
}



export interface Cliente {
  id: number;
  nombre_completo: string;
  telefono: string;
  usuario?: Usuario;
}

// ========== CARRITO ==========

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  detalles?: string;
  subtotal: number;
}

export interface CarritoPorArea {
  area_venta_id: number;
  area_nombre: string;
  items: ItemCarrito[];
  total: number;
}

// ========== PEDIDOS ==========

export interface Pedido {
  id: number;
  codigo: string;
  cliente_id: number | null;
  area_venta_id: number | null;
  total_pedido: number;
  detalles_pedido?: string | null;
  pedido_estado_id: number | null;
  fecha_registro: Date;
  fecha_entrega?: Date | null;
  cliente?: Cliente | null;
  area_venta?: AreaVenta | null;
  pedido_estado?: PedidoEstado | null;
  pedido_productos: PedidoProducto[];
  pagos: Pago[];
  producto_calificaciones?: ProductoCalificacion[];
}

export interface ProductoCalificacion {
  id: number;
  pedido_id: number;
  producto_id: number;
  resena: number;
  comentario?: string;
  producto?: Producto;
}
export interface PedidoProducto {
  id: number;
  pedido_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  detalles_producto?: string;
  producto?: Producto;
}

export interface PedidoEstado {
  id: number;
  estado: 'pendiente' | 'en_proceso' | 'listo' | 'entregado' | 'cancelado';
}

export interface Pago {
  id: number;
  pedido_id: number;
  cantidad: number;
  pago_metodo_id: number;
  pago_estado_id: number;
  fecha: Date;
  pago_metodo?: PagoMetodo;
  pago_estado?: PagoEstado;
}

export interface PagoMetodo {
  id: number;
  pago_metodo: 'tarjeta' | 'efectivo';
}

// ========== DTOs ==========

export interface CrearPedidoDto {
  productos: ProductoPedidoDto[];
  detalles_pedido?: string;
  area_venta_id: number;
  metodo_pago: 'efectivo' | 'tarjeta';
}

export interface ProductoPedidoDto {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  detalles_producto?: string;
}

export interface ProcesarPagoDto {
  datos_tarjeta: {
    numero: string;
    cvv: string;
    expiracion: string;
  };
}

export interface RechazarPedidoDto {
  motivo: string;
}

export interface EntregarPedidoDto {
  pago_metodo_id: number;
  monto_efectivo?: number;
}

export interface CalificarProductoDto {
  producto_id: number;
  calificacion: number;
  comentario?: string;
}

// DTO para agregar al carrito
export interface AgregarCarritoDto {
  producto_id: number;
  cantidad: number;
  detalles?: string;
}

// Modelos para reportes
export interface FiltrosReporte {
  fecha_inicio?: string;
  fecha_fin?: string;
  pago_metodo_id?: number;
  pedido_estado_id?: number;
  area_venta_id?: number;
}

export interface OpcionesReporte {
  incluir_nombre_cliente: boolean;
  incluir_correo_cliente: boolean;
  incluir_telefono_cliente: boolean;
  incluir_detalles_pedido: boolean;
}

export interface OpcionesTicket {
  incluir_descripcion_producto: boolean;
  incluir_detalles_producto: boolean;
  incluir_calificaciones: boolean;
}

export interface CatalogoMetodoPago {
  id: number;
  pago_metodo: string;
}

export interface CatalogoEstadoPedido {
  id: number;
  estado: string;
}

export interface CatalogoAreaVenta {
  id: number;
  area_venta: string;
}

export interface ReporteResponse {
  pedidos: Pedido[];
  totalVentas: number;
}

export interface PagoEstado {
  id: number;
  pago_estado: string;
}
