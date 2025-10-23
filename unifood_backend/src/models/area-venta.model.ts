import { IsString, IsBoolean, IsOptional, IsTimeZone } from 'class-validator';

export class CreateAreaVentaDto {
  @IsString()
  area_venta: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsString()
  @IsOptional()
  horario_apertura?: string;

  @IsString()
  @IsOptional()
  horario_cierre?: string;
}

export class UpdateAreaVentaDto {
  @IsString()
  @IsOptional()
  area_venta?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsString()
  @IsOptional()
  horario_apertura?: string;

  @IsString()
  @IsOptional()
  horario_cierre?: string;
}

export interface AreaVenta {
  id: number;
  area_venta: string;
  descripcion: string;
  status: boolean;
  horario_apertura: string;
  horario_cierre: string;
  fecha_registro: Date;
}