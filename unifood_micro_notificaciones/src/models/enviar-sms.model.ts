import { IsNotEmpty, IsString } from 'class-validator';

export class EnviarSmsDto {
  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsString()
  @IsNotEmpty()
  area_nombre: string;
}