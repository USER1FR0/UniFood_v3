export interface ProcesarPagoDto {
  pedidoId: number;
  monto: number;
  tarjeta: {
    numero: string;
    cvv: string;
    expiracion: string;
  };
}

export interface ReembolsarPagoDto {
  pagoId: number;
  motivo?: string;
}

export interface Pago {
  id: number;
  cantidad: number;
  pago_metodo_id: number;
  pago_estado_id: number;
  fecha: Date;
  pedido_id: number;
}

export interface RespuestaPago {
  success: boolean;
  pagoId?: number;
  transaccionId?: string;
  mensaje: string;
}