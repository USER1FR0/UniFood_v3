import { IsString, IsNumber, IsBoolean, IsOptional, IsObject, IsArray } from 'class-validator';

export class CreateProductoDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  precio: number;

  @IsString()
  @IsOptional()
  imagen_url?: string;

  @IsNumber()
  @IsOptional()
  categoria_id?: number;

  @IsNumber()
  @IsOptional()
  area_venta_id?: number;

  @IsBoolean()
  @IsOptional()
  estado?: boolean;

  @IsNumber()
  tiempo_preparacion: number;

  @IsArray()
  @IsOptional()
  ingredientes?: any;

  @IsNumber()
  @IsOptional()
  calorias?: number;

  @IsNumber()
  vendedorFK: number;
}

export class UpdateProductoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  precio?: number;

  @IsString()
  @IsOptional()
  imagen_url?: string;

  @IsNumber()
  @IsOptional()
  categoria_id?: number;

  @IsNumber()
  @IsOptional()
  area_venta_id?: number;

  @IsBoolean()
  @IsOptional()
  estado?: boolean;

  @IsNumber()
  @IsOptional()
  tiempo_preparacion?: number;

  @IsArray()
  @IsOptional()
  ingredientes?: any;

  @IsNumber()
  @IsOptional()
  calorias?: number;

  @IsNumber()
  @IsOptional()
  vendedorFK?: number;
}

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
  ingredientes: any;
  calorias: number;
  vendedorFK: number;
}