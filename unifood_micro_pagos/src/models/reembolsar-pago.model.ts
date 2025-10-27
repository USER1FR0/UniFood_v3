import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ReembolsarPagoDto {
  @IsNumber()
  @IsNotEmpty()
  pagoId: number;

  @IsString()
  @IsOptional()
  motivo?: string;
}