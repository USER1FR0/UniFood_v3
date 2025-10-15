import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PedidosService } from './../services/pedido.service';
import {
  CrearPedidoDto,
  RechazarPedidoDto,
  EntregarPedidoDto,
  CalificarProductoDto,
  ProcesarPagoTarjetaDto,
} from './../models/pedido.model';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';

@Controller('pedidos')
export class PedidosController {
  private prisma = new PrismaClient();

  constructor(
    private readonly pedidosService: PedidosService,
    private readonly jwtService: JwtService,
  ) {}

  // Método auxiliar para verificar autenticación
  private verificarAuth(authorization: string) {
    if (!authorization) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    try {
      const token = authorization.replace('Bearer ', '');
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

// Método auxiliar para obtener área del vendedor
private async obtenerAreaVendedor(usuarioId: number): Promise<number> {
  const vendedor = await this.prisma.vendedor.findFirst({
    where: { usuario_id: usuarioId },
    include: {
      vendedor_areas: true // Incluir la relación con vendedor_area
    }
  });

  if (!vendedor) {
    throw new UnauthorizedException('Vendedor no encontrado');
  }

  // Buscar el área activa del vendedor
  const areaActiva = vendedor.vendedor_areas.find(va => va.estatus === true);

  if (!areaActiva) {
    throw new UnauthorizedException('El vendedor no tiene un área de venta activa asignada');
  }

  if (!areaActiva.area_id) {
    throw new UnauthorizedException('El área de venta activa no es válida');
  }

  return areaActiva.area_id;
}

  // =============== ENDPOINTS PARA CLIENTE ===============

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CrearPedidoDto, @Request() req) {
    const usuario = this.verificarAuth(req.headers.authorization);

    if (usuario.rol !== 'cliente') {
      throw new UnauthorizedException('Solo los clientes pueden crear pedidos');
    }

    return this.pedidosService.crear(dto, usuario.id);
  }

  // NUEVO ENDPOINT: Procesar pago con tarjeta después de crear el pedido
  @Post(':id/procesar-pago')
  @HttpCode(HttpStatus.OK)
  async procesarPago(@Param('id') id: string, @Body() dto: ProcesarPagoTarjetaDto, @Request() req) {
    const usuario = this.verificarAuth(req.headers.authorization);

    if (usuario.rol !== 'cliente') {
      throw new UnauthorizedException('Solo los clientes pueden procesar pagos');
    }

    return this.pedidosService.procesarPagoPendiente(+id, usuario.id, dto);
  }

  @Get('mi-pedido')
  async obtenerMiPedidoActivo(@Request() req) {
    const usuario = this.verificarAuth(req.headers.authorization);

    if (usuario.rol !== 'cliente') {
      throw new UnauthorizedException('Solo los clientes pueden ver sus pedidos');
    }

    return this.pedidosService.obtenerMiPedidoActivo(usuario.id);
  }

  @Patch(':id/cancelar')
  async cancelarPorCliente(@Param('id') id: string, @Request() req) {
    const usuario = this.verificarAuth(req.headers.authorization);

    if (usuario.rol !== 'cliente') {
      throw new UnauthorizedException('Solo los clientes pueden cancelar pedidos');
    }

    return this.pedidosService.cancelarPorCliente(+id, usuario.id);
  }

  @Post(':id/calificar')
  async calificarPedido(
    @Param('id') id: string,
    @Body() dto: CalificarProductoDto,
    @Request() req,
  ) {
    const usuario = this.verificarAuth(req.headers.authorization);
    if (usuario.rol !== 'cliente') {
      throw new UnauthorizedException('Solo los clientes pueden calificar');
    }

    return this.pedidosService.calificarPedido(+id, usuario.id, dto);
  }

  @Get('historial')
  async obtenerHistorial(@Request() req) {
    const usuario = this.verificarAuth(req.headers.authorization);

    if (usuario.rol !== 'cliente') {
      throw new UnauthorizedException('Solo los clientes pueden ver su historial');
    }

    return this.pedidosService.obtenerHistorial(usuario.id);
  }

  // =============== ENDPOINTS PARA VENDEDOR ===============

  @Get('pendientes')
  async obtenerPendientes(@Request() req) {
    const usuario = this.verificarAuth(req.headers.authorization);

    if (usuario.rol !== 'vendedor') {
      throw new UnauthorizedException('Solo los vendedores pueden ver pedidos pendientes');
    }

    // Obtener el área del vendedor
    const areaVentaId = await this.obtenerAreaVendedor(usuario.id);

    return this.pedidosService.obtenerPendientes(areaVentaId);
  }

  @Get('en-proceso')
  async obtenerEnProceso(@Request() req) {
    const usuario = this.verificarAuth(req.headers.authorization);

    if (usuario.rol !== 'vendedor') {
      throw new UnauthorizedException('Solo los vendedores pueden ver pedidos en proceso');
    }

    // Obtener el área del vendedor
    const areaVentaId = await this.obtenerAreaVendedor(usuario.id);

    return this.pedidosService.obtenerEnProceso(areaVentaId);
  }

  @Get('listos')
  async obtenerListos(@Request() req) {
    const usuario = this.verificarAuth(req.headers.authorization);

    if (usuario.rol !== 'vendedor') {
      throw new UnauthorizedException('Solo los vendedores pueden ver pedidos listos');
    }

    // Obtener el área del vendedor
    const areaVentaId = await this.obtenerAreaVendedor(usuario.id);

    return this.pedidosService.obtenerListos(areaVentaId);
  }

  @Patch(':id/aceptar')
  async aceptarPedido(@Param('id') id: string, @Request() req) {
    const usuario = this.verificarAuth(req.headers.authorization);

    if (usuario.rol !== 'vendedor') {
      throw new UnauthorizedException('Solo los vendedores pueden aceptar pedidos');
    }

    // Obtener el área del vendedor para validaciones
    const areaVentaId = await this.obtenerAreaVendedor(usuario.id);

    return this.pedidosService.aceptarPedido(+id, areaVentaId);
  }

  @Patch(':id/rechazar')
  async rechazarPedido(@Param('id') id: string, @Body() dto: RechazarPedidoDto, @Request() req) {
    const usuario = this.verificarAuth(req.headers.authorization);

    if (usuario.rol !== 'vendedor') {
      throw new UnauthorizedException('Solo los vendedores pueden rechazar pedidos');
    }

    return this.pedidosService.rechazarPedido(+id, dto);
  }

  @Patch(':id/listo')
  async marcarComoListo(@Param('id') id: string, @Request() req) {
    const usuario = this.verificarAuth(req.headers.authorization);

    if (usuario.rol !== 'vendedor') {
      throw new UnauthorizedException('Solo los vendedores pueden marcar pedidos como listos');
    }

    return this.pedidosService.marcarComoListo(+id);
  }

  @Patch(':id/entregar')
  async entregarPedido(@Param('id') id: string, @Body() dto: EntregarPedidoDto, @Request() req) {
    const usuario = this.verificarAuth(req.headers.authorization);

    if (usuario.rol !== 'vendedor') {
      throw new UnauthorizedException('Solo los vendedores pueden entregar pedidos');
    }

    return this.pedidosService.entregarPedido(+id, dto);
  }
}
