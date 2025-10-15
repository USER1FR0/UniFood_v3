import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PagosClient } from '../clients/pagos.client';
import { ComunicacionClient } from '../clients/comunicacion.client';
import {
  CrearPedidoDto,
  RechazarPedidoDto,
  EntregarPedidoDto,
  CalificarProductoDto,
  ProcesarPagoTarjetaDto,
} from '../models/pedido.model';
import { PedidoGateway } from './../gateways/pedido.gateway';

@Injectable()
export class PedidosService {
  private prisma = new PrismaClient();
  private readonly MAX_PEDIDOS_EN_PROCESO = 3;

  constructor(
    private readonly pagosClient: PagosClient,
    private readonly comunicacionClient: ComunicacionClient,
    private readonly pedidoGateway: PedidoGateway,
  ) {}

  // =============== MÉTODOS PARA CLIENTE ===============

  async crear(dto: CrearPedidoDto, clienteId: number) {
    // Validar que el área de venta exista y esté activa
    const areaVenta = await this.prisma.area_venta.findUnique({
      where: { id: dto.area_venta_id },
    });

    if (!areaVenta) {
      throw new NotFoundException('Área de venta no encontrada');
    }

    if (areaVenta.status === false) {
      throw new BadRequestException('El área de venta no está activa en este momento');
    }

    // Calcular total
    const total = dto.productos.reduce((sum, p) => sum + p.precio_unitario * p.cantidad, 0);

    // Generar código único
    const codigo = `PED-${Date.now()}-${clienteId}`;

    // Crear pedido en BD (estado pendiente, SIN procesar pago todavía)
    const pedido = await this.prisma.pedido.create({
      data: {
        codigo,
        cliente_id: clienteId,
        area_venta_id: dto.area_venta_id,
        total_pedido: new Prisma.Decimal(total),
        detalles_pedido: dto.detalles_pedido || null,
        pedido_estado_id: 1, // pendiente
        pedido_productos: {
          create: dto.productos.map((p) => ({
            producto_id: p.producto_id,
            cantidad: p.cantidad,
            precio_unitario: new Prisma.Decimal(p.precio_unitario),
          })),
        },
      },
      include: {
        cliente: true,
        pedido_productos: { include: { producto: true } },
        area_venta: true,
      },
    });

    // Guardar método de pago seleccionado (pero NO procesarlo todavía)
    // Esto puede ir en una tabla auxiliar o campo del pedido según tu schema
    // Por ahora lo comentamos, pero deberías tener un campo como "metodo_pago_seleccionado"

    // OPCIONAL: Si tu schema tiene un campo para guardar el método de pago:
    // await this.prisma.pedido.update({
    //   where: { id: pedido.id },
    //   data: { metodo_pago: dto.metodo_pago }
    // });

    // Enviar SMS de confirmación
    if (pedido.cliente) {
      await this.comunicacionClient.enviarPedidoRecibido(pedido.cliente.telefono, pedido.id);
    }

    // Notificar por WebSocket a vendedores del área
    this.pedidoGateway.notificarNuevoPedido(pedido);

    return pedido;
  }

  // NUEVO MÉTODO: Procesar pago pendiente con tarjeta
  async procesarPagoPendiente(pedidoId: number, clienteId: number, dto: ProcesarPagoTarjetaDto) {
    // Buscar pedido
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { cliente: true, pagos: true },
    });

    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.cliente_id !== clienteId)
      throw new UnauthorizedException('No puedes procesar el pago de este pedido');
    if (pedido.pedido_estado_id !== 1)
      throw new BadRequestException('Solo se pueden procesar pagos de pedidos pendientes');

    // Verificar que no tenga ya un pago registrado
    if (pedido.pagos.length > 0) {
      throw new BadRequestException('Este pedido ya tiene un pago registrado');
    }

    // Validar que el total no sea null
    if (!pedido.total_pedido) {
      throw new BadRequestException('El pedido no tiene un total válido');
    }

    // Procesar pago con el microservicio
    try {
      const resultadoPago = await this.pagosClient.procesarPago({
        pedidoId: pedido.id,
        monto: Number(pedido.total_pedido),
        tarjeta: dto.datos_tarjeta,
      });

      // Registrar pago en BD
      await this.prisma.pago.create({
        data: {
          pedido_id: pedido.id,
          cantidad: pedido.total_pedido,
          pago_metodo_id: 1, // 1 = tarjeta
          pago_estado_id: 1, // 1 = completado
          fecha: new Date(),
        },
      });

      // Notificar a vendedores que el pago fue procesado
      const pedidoActualizado = await this.prisma.pedido.findUnique({
        where: { id: pedidoId },
        include: {
          cliente: true,
          pedido_productos: { include: { producto: true } },
          pagos: true,
        },
      });

      if (pedidoActualizado) {
        this.pedidoGateway.notificarCambioPedido(pedidoActualizado);
      }

      return {
        mensaje: 'Pago procesado exitosamente',
        pedido: pedidoActualizado,
        transaccion: resultadoPago,
      };
    } catch (error) {
      throw new BadRequestException(`Error al procesar el pago: ${error.message}`);
    }
  }

  async obtenerMiPedidoActivo(clienteId: number) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        cliente_id: clienteId,
        pedido_estado_id: { in: [1, 2, 3] }, // pendiente, en_proceso, listo
      },
      include: {
        pedido_productos: { include: { producto: true } },
        pedido_estado: true,
        pagos: true,
      },
      orderBy: { fecha_registro: 'desc' },
    });

    return pedido;
  }

  async cancelarPorCliente(pedidoId: number, clienteId: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { cliente: true, pagos: true },
    });

    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.cliente_id !== clienteId)
      throw new UnauthorizedException('No puedes cancelar este pedido');
    if (pedido.pedido_estado_id !== 1)
      throw new BadRequestException('Solo se pueden cancelar pedidos pendientes');

    // Si tiene pago con tarjeta, solicitar reembolso
    if (pedido.pagos.length > 0) {
      const pagoTarjeta = pedido.pagos.find((p) => p.pago_metodo_id === 1);
      if (pagoTarjeta) {
        await this.pagosClient.cancelarPago(pagoTarjeta.id.toString());
      }
    }

    // Actualizar estado a cancelado
    const pedidoActualizado = await this.prisma.pedido.update({
      where: { id: pedidoId },
      data: { pedido_estado_id: 5 }, // 5 = cancelado
      include: {
        cliente: true,
        pedido_productos: { include: { producto: true } },
      },
    });

    // Notificar
    if (pedido.cliente) {
      await this.comunicacionClient.enviarPedidoCancelado(pedido.cliente.telefono, pedidoId);
    }
    this.pedidoGateway.notificarCambioPedido(pedidoActualizado);

    return { mensaje: 'Pedido cancelado exitosamente' };
  }

  // =============== MÉTODOS PARA VENDEDOR ===============

  async obtenerPendientes(areaVentaId?: number) {
    const where: any = { pedido_estado_id: 1 }; // pendiente

    if (areaVentaId) {
      where.area_venta_id = areaVentaId;
    }

    return this.prisma.pedido.findMany({
      where,
      include: {
        cliente: true,
        pedido_productos: { include: { producto: true } },
        pagos: true,
      },
      orderBy: { fecha_registro: 'asc' },
    });
  }

  async obtenerEnProceso(areaVentaId?: number) {
    const where: any = { pedido_estado_id: 2 }; // en_proceso

    if (areaVentaId) {
      where.area_venta_id = areaVentaId;
    }

    return this.prisma.pedido.findMany({
      where,
      include: {
        cliente: true,
        pedido_productos: { include: { producto: true } },
        pagos: true,
      },
      orderBy: { fecha_registro: 'asc' },
    });
  }

  async obtenerListos(areaVentaId?: number) {
    const where: any = { pedido_estado_id: 3 }; // listo

    if (areaVentaId) {
      where.area_venta_id = areaVentaId;
    }

    return this.prisma.pedido.findMany({
      where,
      include: {
        cliente: true,
        pedido_productos: { include: { producto: true } },
        pagos: true,
      },
      orderBy: { fecha_registro: 'asc' },
    });
  }

  async aceptarPedido(pedidoId: number, areaVentaId?: number) {
    // Buscar el pedido primero para obtener su área
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
    });

    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    // Verificar límite de pedidos en proceso POR ÁREA
    const pedidosEnProceso = await this.prisma.pedido.count({
      where: {
        pedido_estado_id: 2,
        area_venta_id: pedido.area_venta_id,
      },
    });

    if (pedidosEnProceso >= this.MAX_PEDIDOS_EN_PROCESO) {
      throw new BadRequestException(
        `No se pueden tener más de ${this.MAX_PEDIDOS_EN_PROCESO} pedidos en proceso en esta área`,
      );
    }

    // Actualizar estado a en_proceso
    const pedidoActualizado = await this.prisma.pedido.update({
      where: { id: pedidoId },
      data: { pedido_estado_id: 2 }, // en_proceso
      include: { cliente: true, pedido_productos: { include: { producto: true } } },
    });

    // Notificar al cliente
    if (pedidoActualizado.cliente) {
      await this.comunicacionClient.enviarPedidoAceptado(
        pedidoActualizado.cliente.telefono,
        pedidoId,
      );
    }
    this.pedidoGateway.notificarCambioPedido(pedidoActualizado);

    return pedidoActualizado;
  }

  async rechazarPedido(pedidoId: number, dto: RechazarPedidoDto) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { cliente: true, pagos: true },
    });

    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.pedido_estado_id !== 1)
      throw new BadRequestException('Solo se pueden rechazar pedidos pendientes');

    // Si tiene pago con tarjeta, cancelar transacción
    if (pedido.pagos.length > 0) {
      const pagoTarjeta = pedido.pagos.find((p) => p.pago_metodo_id === 1);
      if (pagoTarjeta) {
        await this.pagosClient.cancelarPago(pagoTarjeta.id.toString());
      }
    }

    // Actualizar estado a cancelado Y guardar el motivo en detalles_pedido
    const pedidoActualizado = await this.prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        pedido_estado_id: 5, // cancelado
        detalles_pedido: `RECHAZADO: ${dto.motivo}`, // Guardar el motivo
      },
      include: {
        cliente: true,
        pedido_productos: { include: { producto: true } },
      },
    });

    // Notificar al cliente
    if (pedido.cliente) {
      await this.comunicacionClient.enviarPedidoRechazado(
        pedido.cliente.telefono,
        pedidoId,
        dto.motivo,
      );
    }
    this.pedidoGateway.notificarCambioPedido(pedidoActualizado);

    return { mensaje: 'Pedido rechazado y cliente notificado' };
  }

  async marcarComoListo(pedidoId: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
    });

    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.pedido_estado_id !== 2)
      throw new BadRequestException('Solo se pueden marcar como listos pedidos en proceso');

    const pedidoActualizado = await this.prisma.pedido.update({
      where: { id: pedidoId },
      data: { pedido_estado_id: 3 }, // listo
      include: { cliente: true, pedido_productos: { include: { producto: true } } },
    });

    // Notificar al cliente que puede recoger (SMS)
    if (pedidoActualizado.cliente) {
      await this.comunicacionClient.enviarPedidoListo(pedidoActualizado.cliente.telefono, pedidoId);
    }
    this.pedidoGateway.notificarPedidoListo(pedidoActualizado);

    return pedidoActualizado;
  }

  async entregarPedido(pedidoId: number, dto: EntregarPedidoDto) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { pagos: true, cliente: true },
    });

    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.pedido_estado_id !== 3)
      throw new BadRequestException('Solo se pueden entregar pedidos listos');

    // Verificar si ya hay un pago registrado
    if (pedido.pagos.length > 0) {
      // Ya está pagado con tarjeta, solo entregar
      const pedidoActualizado = await this.prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          pedido_estado_id: 4, // entregado
          fecha_entrega: new Date(),
        },
        include: {
          cliente: true,
          pedido_productos: { include: { producto: true } },
        },
      });

      this.pedidoGateway.notificarCambioPedido(pedidoActualizado);
      return { mensaje: 'Pedido entregado exitosamente', pedido: pedidoActualizado };
    }

    // Si es pago en efectivo, registrarlo
    if (dto.pago_metodo_id === 2 && dto.monto_efectivo) {
      await this.prisma.pago.create({
        data: {
          pedido_id: pedidoId,
          cantidad: new Prisma.Decimal(dto.monto_efectivo),
          pago_metodo_id: 2, // efectivo
          pago_estado_id: 1, // completado
          fecha: new Date(),
        },
      });

      // Actualizar pedido a entregado
      const pedidoActualizado = await this.prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          pedido_estado_id: 4, // entregado
          fecha_entrega: new Date(),
        },
        include: {
          cliente: true,
          pedido_productos: { include: { producto: true } },
        },
      });

      this.pedidoGateway.notificarCambioPedido(pedidoActualizado);
      return {
        mensaje: 'Pedido entregado y pago registrado exitosamente',
        pedido: pedidoActualizado,
      };
    }

    throw new BadRequestException('Debe proporcionar el monto del pago en efectivo');
  }

  // =============== MÉTODOS COMUNES ===============

  async calificarPedido(pedidoId: number, clienteId: number, dto: CalificarProductoDto) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
    });

    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.cliente_id !== clienteId)
      throw new UnauthorizedException('No puedes calificar este pedido');
    if (pedido.pedido_estado_id !== 4)
      throw new BadRequestException('Solo se pueden calificar pedidos entregados');

    // Verificar que el producto esté en el pedido
    const productoPedido = await this.prisma.pedido_producto.findFirst({
      where: {
        pedido_id: pedidoId,
        producto_id: dto.producto_id,
      },
    });

    if (!productoPedido) throw new BadRequestException('El producto no pertenece a este pedido');

    // Crear calificación
    // NOTA: Ajusta según tu schema. Si resena es Int, quita el Prisma.Decimal
    const calificacion = await this.prisma.producto_calificacion.create({
      data: {
        pedido_id: pedidoId,
        producto_id: dto.producto_id,
        resena: new Prisma.Decimal(dto.calificacion), // Si es Int en tu schema, usar: resena: dto.calificacion
        comentario: dto.comentario || null,
      },
    });

    return calificacion;
  }

  async obtenerHistorial(clienteId: number) {
    return this.prisma.pedido.findMany({
      where: { cliente_id: clienteId },
      include: {
        pedido_productos: { include: { producto: true } },
        pedido_estado: true,
        pagos: true,
      },
      orderBy: { fecha_registro: 'desc' },
    });
  }
}
