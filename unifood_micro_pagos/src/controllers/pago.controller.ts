import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PagosService } from 'src/services/pago.service';
import { ProcesarPagoDto } from 'src/models/procesar-pago.model';
import { ReembolsarPagoDto } from 'src/models/reembolsar-pago.model';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('procesar')
  async procesarPago(@Body() dto: ProcesarPagoDto) {
    return this.pagosService.procesarPago(dto);
  }

  @Post('reembolsar')
  async reembolsarPago(@Body() dto: ReembolsarPagoDto) {
    return this.pagosService.reembolsarPago(dto);
  }

  @Get('estado/:id')
  async verificarEstado(@Param('id') id: string) {
    return this.pagosService.verificarEstadoPago(parseInt(id));
  }

  @Get('estado/ping-test')
  ping() {
    return {
      mensaje: 'Servicio de pagos disponible',
      timestamp: new Date(),
    };
  }
}