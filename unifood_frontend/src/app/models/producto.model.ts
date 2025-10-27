export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string;
  categoria_id: number;
  area_venta_id: number;
  estado: boolean;
  tiempo_preparacion: number;
  fecha_registro: Date;
  ingredientes: string[] | any;
  calorias: number;
  vendedorFK: number;
}

export interface CreateProductoRequest {
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen_url?: string;
  categoria_id?: number;
  area_venta_id?: number;
  estado?: boolean;
  tiempo_preparacion: number;
  ingredientes?: string[] | any;
  calorias?: number;
  vendedorFK: number;
}

export interface UpdateProductoRequest {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  imagen_url?: string;
  categoria_id?: number;
  area_venta_id?: number;
  estado?: boolean;
  tiempo_preparacion?: number;
  ingredientes?: string[] | any;
  calorias?: number;
  vendedorFK?: number;
}