import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', 
  }
})
export class PedidoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  // Cliente se suscribe a su pedido específico
  @SubscribeMessage('suscribirPedido')
  handleSuscribirPedido(client: Socket, pedidoId: number) {
    client.join(`pedido-${pedidoId}`);
    console.log(`Cliente ${client.id} suscrito al pedido ${pedidoId}`);
  }

  // Vendedor se suscribe a pedidos de su área (MODIFICADO)
  @SubscribeMessage('suscribirVendedor')
  handleSuscribirVendedor(client: Socket, payload: { areaId: number }) {
    client.join(`vendedor-area-${payload.areaId}`);
    console.log(`Vendedor ${client.id} suscrito al área ${payload.areaId}`);
  }

  // Notificar nuevo pedido a vendedores del área específica (MODIFICADO)
  notificarNuevoPedido(pedido: any) {
    this.server.to(`vendedor-area-${pedido.area_venta_id}`).emit('nuevoPedido', pedido);
    console.log(`Nuevo pedido ${pedido.id} notificado al área ${pedido.area_venta_id}`);
  }

  // Notificar cambio de estado de pedido
  notificarCambioPedido(pedido: any) {
    // Al cliente específico
    this.server.to(`pedido-${pedido.id}`).emit('actualizarPedido', pedido);
    
    // A todos los vendedores del área
    this.server.to(`vendedor-area-${pedido.area_venta_id}`).emit('actualizarPedido', pedido);
    
    console.log(`Actualización del pedido ${pedido.id} notificada`);
  }

  // Notificar pedido listo
  notificarPedidoListo(pedido: any) {
    // Al cliente
    this.server.to(`pedido-${pedido.id}`).emit('pedidoListo', pedido);
    
    // A los vendedores del área
    this.server.to(`vendedor-area-${pedido.area_venta_id}`).emit('pedidoListo', pedido);
    
    console.log(`Pedido ${pedido.id} marcado como listo y notificado`);
  }

  // MÉTODO ADICIONAL: Notificar cancelación
  notificarPedidoCancelado(pedido: any) {
    this.server.to(`pedido-${pedido.id}`).emit('pedidoCancelado', pedido);
    this.server.to(`vendedor-area-${pedido.area_venta_id}`).emit('pedidoCancelado', pedido);
    console.log(`Pedido ${pedido.id} cancelado y notificado`);
  }

  // MÉTODO ADICIONAL: Notificar pago procesado
  notificarPagoProcesado(pedido: any) {
    this.server.to(`pedido-${pedido.id}`).emit('pagoProcesado', pedido);
    this.server.to(`vendedor-area-${pedido.area_venta_id}`).emit('pagoProcesado', pedido);
    console.log(`Pago del pedido ${pedido.id} procesado y notificado`);
  }
}