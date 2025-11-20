import { PrismaService } from 'src/services/prisma.service';
import { CrearPedidoDto } from 'src/models/pedido.model';

export interface PrismaServiceInterface {
  area_venta: any;
  pedido: any;
  producto: any;
  cliente: any;
  pago: any;
}

export interface PedidoContext {
  dto: CrearPedidoDto;
  clienteId: number;
  prisma: PrismaServiceInterface;
  areaVenta?: any;
  pedidosEnEspera?: number;
  advertencias?: string[];
}

export abstract class PedidoHandler {
  protected nextHandler: PedidoHandler | null = null;

  setNext(handler: PedidoHandler): PedidoHandler {
    this.nextHandler = handler;
    return handler;
  }

  async handle(context: PedidoContext): Promise<void> {
    await this.process(context);

    if (this.nextHandler) {
      await this.nextHandler.handle(context);
    }
  }

  protected abstract process(context: PedidoContext): Promise<void>;
}
