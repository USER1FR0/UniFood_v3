import { Controller, Post, Get, Body } from '@nestjs/common';
import { ComunicacionService } from '../services/comunicacion.service';
import { EnviarSmsDto } from '../models/enviar-sms.model';

@Controller('comunicacion')
export class ComunicacionController {
  constructor(private readonly comunicacionService: ComunicacionService) {}

  @Post('sms/pedido-listo')
  async enviarSmsPedidoListo(@Body() dto: EnviarSmsDto) {
    return this.comunicacionService.enviarSmsPedidoListo(dto);
  }

  @Get('ping')
  ping() {
    return this.comunicacionService.ping();
  }
}