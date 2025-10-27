import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ComunicacionClient {
  private readonly baseUrl = process.env.COMUNICACION_SERVICE_URL || 'http://localhost:4000';

  constructor(private readonly httpService: HttpService) {}

  async enviarSmsPedidoListo(telefono: string, areaNombre: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/comunicacion/sms/pedido-listo`, {
          telefono,
          area_nombre: areaNombre,
        }),
      );
      return response.data;
    } catch (error) {
      console.error(' Error al enviar SMS (pedido listo):', error.message);
      // No lanzar error para que el flujo continúe
      return { success: false, mensaje: 'No se pudo enviar SMS' };
    }
  }

  async verificarDisponibilidad(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/comunicacion/ping`, {
          timeout: 3000,
        }),
      );
      return response.status === 200;
    } catch (error) {
      console.error('Microservicio de comunicación no disponible');
      return false;
    }
  }
}