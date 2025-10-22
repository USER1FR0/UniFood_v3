import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ProcesarPagoDto {
  pedidoId: number;
  monto: number;
  tarjeta: {
    numero: string;
    cvv: string;
    expiracion: string;
  };
}

@Injectable()
export class PagosClient {
  private readonly baseUrl = process.env.PAGOS_SERVICE_URL || 'http://localhost:4000';

  constructor(private readonly httpService: HttpService) {}

  async procesarPago(datos: ProcesarPagoDto) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/pagos/procesar`, datos),
      );
      return response.data;
    } catch (error) {
      throw new Error(`Error al procesar pago: ${error.message}`);
    }
  }

  async cancelarPago(transaccionId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/pagos/cancelar`, { transaccionId }),
      );
      return response.data;
    } catch (error) {
      throw new Error(`Error al cancelar pago: ${error.message}`);
    }
  }

  async verificarDisponibilidad(): Promise<boolean> {
    try {
      // Intentar hacer una petición simple al microservicio
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/pagos/estado/ping-test`, {
          timeout: 3000,
          validateStatus: () => true, // Aceptar cualquier status code
        }),
      );

      // Si responde (aunque sea con error 404), está disponible
      return response.status >= 200 && response.status < 600;
    } catch (error) {
      // Si no puede conectarse, no está disponible
      console.error('⚠️ Microservicio de pagos no responde:', error.message);
      return false;
    }
  }

  async verificarEstadoPago(transaccionId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/pagos/estado/${transaccionId}`),
      );
      return response.data;
    } catch (error) {
      throw new Error(`Error al verificar estado de pago: ${error.message}`);
    }
  }
}
