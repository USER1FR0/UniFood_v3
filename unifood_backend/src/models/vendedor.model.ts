import { IsString, IsEmail, IsNumber, IsBoolean, IsDate, IsOptional } from 'class-validator';

export class CreateVendedorDto {
  // Campos de usuario
  @IsEmail()
  correo_electronico: string;

  @IsString()
  contrasena: string;

  // Campos vendedor
  @IsString()
  nombre: string;

  @IsString()
  telefono: string;

  @IsNumber()
  num_empleado: number;

  @IsString()
  genero: string;

  @IsNumber()
  edad: number;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  estatus?: string;
}

export class UpdateVendedorDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsNumber()
  @IsOptional()
  usuario_id?: number;

  @IsNumber()
  @IsOptional()
  num_empleado?: number;

  @IsString()
  @IsOptional()
  genero?: string;

  @IsNumber()
  @IsOptional()
  edad?: number;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  estatus?: string;
}

// Interface para tipar los resultados
export interface Vendedor {
  id: number;
  nombre: string;
  telefono: string;
  usuario_id: number;
  num_empleado: number;
  genero: string;
  edad: number;
  email: string;
  estatus: string;
  fecha_registro: Date;
}