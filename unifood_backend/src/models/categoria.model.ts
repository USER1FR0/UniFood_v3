import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateCategoriaDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export class UpdateCategoriaDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  status: boolean;
  fecha_registro: Date;
}