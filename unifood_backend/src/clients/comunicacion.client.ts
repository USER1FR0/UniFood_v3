import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface EnviarSmsDto {
  telefono: string;
  mensaje: string;
  pedidoId: number;
}

@Injectable()
export class ComunicacionClient {
  private readonly baseUrl = process.env.COMUNICACION_SERVICE_URL || 'http://localhost:4000';

  constructor(private readonly httpService: HttpService) {}

  async enviarPedidoRecibido(telefono: string, pedidoId: number) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/comunicacion/enviar-sms`, {
          telefono,
          mensaje: `Tu pedido #${pedidoId} ha sido recibido. Te notificaremos cuando esté listo.`,
          pedidoId
        })
      );
      return response.data;
    } catch (error) {
      console.error(`Error al enviar SMS de pedido recibido: ${error.message}`);
      // No lanzar error para no interrumpir el flujo principal
      return null;
    }
  }

  async enviarPedidoAceptado(telefono: string, pedidoId: number) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/comunicacion/enviar-sms`, {
          telefono,
          mensaje: `¡Buenas noticias! Tu pedido #${pedidoId} está siendo preparado.`,
          pedidoId
        })
      );
      return response.data;
    } catch (error) {
      console.error(`Error al enviar SMS de pedido aceptado: ${error.message}`);
      return null;
    }
  }

  async enviarPedidoCancelado(telefono: string, pedidoId: number) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/comunicacion/enviar-sms`, {
          telefono,
          mensaje: `Tu pedido #${pedidoId} ha sido cancelado. Si pagaste con tarjeta, el reembolso se procesará en 3-5 días hábiles.`,
          pedidoId
        })
      );
      return response.data;
    } catch (error) {
      console.error(`Error al enviar SMS de pedido cancelado: ${error.message}`);
      return null;
    }
  }

  async enviarPedidoRechazado(telefono: string, pedidoId: number, motivo: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/comunicacion/enviar-sms`, {
          telefono,
          mensaje: `Lamentamos informarte que tu pedido #${pedidoId} fue rechazado. Motivo: ${motivo}`,
          pedidoId
        })
      );
      return response.data;
    } catch (error) {
      console.error(`Error al enviar SMS de pedido rechazado: ${error.message}`);
      return null;
    }
  }

  async enviarPedidoListo(telefono: string, pedidoId: number) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/comunicacion/enviar-sms`, {
          telefono,
          mensaje: `¡Tu pedido #${pedidoId} está listo para recoger! Dirígete al área de entrega.`,
          pedidoId
        })
      );
      return response.data;
    } catch (error) {
      console.error(`Error al enviar SMS de pedido listo: ${error.message}`);
      return null;
    }
  }
}