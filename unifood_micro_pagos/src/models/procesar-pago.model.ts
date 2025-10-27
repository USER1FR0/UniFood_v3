import { IsNotEmpty, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TarjetaDto {
  @IsNotEmpty()
  numero: string;

  @IsNotEmpty()
  cvv: string;

  @IsNotEmpty()
  expiracion: string;
}

export class ProcesarPagoDto {
  @IsNumber()
  @IsNotEmpty()
  pedidoId: number;

  @IsNumber()
  @IsNotEmpty()
  monto: number;

  @IsObject()
  @ValidateNested()
  @Type(() => TarjetaDto)
  tarjeta: TarjetaDto;
}