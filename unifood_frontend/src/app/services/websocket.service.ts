import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';
import { AuthService } from './auth.service';
import { Pedido } from '../models/pedido.model';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket: Socket | null = null;
  private conectado: boolean = false;

  constructor(private authService: AuthService) {}

  /**
   * Conectar al servidor WebSocket
   */
  conectar(): void {
    if (this.conectado) {
      console.log('WebSocket ya está conectado');
      return;
    }

    const token = this.authService.obtenerToken();

    if (!token) {
      console.error('No hay token disponible para conectar WebSocket');
      return;
    }

    this.socket = io(environment.wsUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Eventos de conexión
    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado:', this.socket?.id);
      this.conectado = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket desconectado:', reason);
      this.conectado = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Error en WebSocket:', error);
    });
  }

  /**
   * Desconectar del servidor WebSocket
   */
  desconectar(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.conectado = false;
      console.log('WebSocket desconectado manualmente');
    }
  }

  /**
   * Verificar si está conectado
   */
  estaConectado(): boolean {
    return this.conectado && this.socket !== null;
  }

  /**
   * Suscribirse a un pedido específico (Cliente)
   */
  suscribirPedido(pedidoId: number): void {
    if (!this.socket) {
      console.error('Socket no está conectado');
      return;
    }

    this.socket.emit('suscribirPedido', pedidoId);
    console.log(`📌 Suscrito al pedido: ${pedidoId}`);
  }

  /**
   * Desuscribirse de un pedido (Cliente)
   */
  desuscribirPedido(pedidoId: number): void {
    if (!this.socket) return;

    this.socket.emit('desuscribirPedido', pedidoId);
    console.log(`📌 Desuscrito del pedido: ${pedidoId}`);
  }

  /**
   * Suscribirse a un área (Vendedor)
   */
  suscribirArea(areaId: number): void {
    if (!this.socket) {
      console.error('Socket no está conectado');
      return;
    }

    this.socket.emit('suscribirArea', areaId);
    console.log(`📌 Suscrito al área: ${areaId}`);
  }

  suscribirVendedor(payload: { areaId: number }): void {
    if (!this.socket) {
      console.error('Socket no está conectado');
      return;
    }

    this.socket.emit('suscribirVendedor', payload);
    console.log(`📌 Vendedor suscrito al área: ${payload.areaId}`);
  }

  onPedidoEntregado(): Observable<Pedido> {
    return new Observable((observer) => {
      this.socket?.on('pedidoEntregado', (pedido: Pedido) => {
        //console.log('📦 Pedido entregado (evento WebSocket):', pedido);
        observer.next(pedido);
      });
    });

    
  }

  /**
   * Desuscribirse de un área (Vendedor)
   */
  desuscribirArea(areaId: number): void {
    if (!this.socket) return;

    this.socket.emit('desuscribirArea', areaId);
    console.log(`📌 Desuscrito del área: ${areaId}`);
  }

  // ========== EVENTOS PARA CLIENTE ==========

  /**
   * Escuchar actualización de pedido
   */
  onActualizarPedido(): Observable<Pedido> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error('Socket no conectado');
        return;
      }

      this.socket.on('actualizarPedido', (pedido: Pedido) => {
        console.log('📦 Pedido actualizado:', pedido);
        observer.next(pedido);
      });

      // Cleanup
      return () => {
        if (this.socket) {
          this.socket.off('actualizarPedido');
        }
      };
    });
  }

  /**
   * Escuchar cuando el pedido está listo
   */
  onPedidoListo(): Observable<Pedido> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error('Socket no conectado');
        return;
      }

      this.socket.on('pedidoListo', (pedido: Pedido) => {
        console.log('✅ Pedido listo:', pedido);
        observer.next(pedido);
      });

      return () => {
        if (this.socket) {
          this.socket.off('pedidoListo');
        }
      };
    });
  }

  /**
   * Escuchar cuando el pedido es cancelado
   */
  onPedidoCancelado(): Observable<Pedido> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error('Socket no conectado');
        return;
      }

      this.socket.on('pedidoCancelado', (pedido: Pedido) => {
        console.log('❌ Pedido cancelado:', pedido);
        observer.next(pedido);
      });

      return () => {
        if (this.socket) {
          this.socket.off('pedidoCancelado');
        }
      };
    });
  }

  // ========== EVENTOS PARA VENDEDOR ==========

  /**
   * Escuchar nuevo pedido (Vendedor)
   */
  onNuevoPedido(): Observable<Pedido> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error('Socket no conectado');
        return;
      }

      this.socket.on('nuevoPedido', (pedido: Pedido) => {
        console.log('🆕 Nuevo pedido:', pedido);
        observer.next(pedido);
      });

      return () => {
        if (this.socket) {
          this.socket.off('nuevoPedido');
        }
      };
    });
  }

  /**
   * Escuchar pedido aceptado
   */
  onPedidoAceptado(): Observable<Pedido> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error('Socket no conectado');
        return;
      }

      this.socket.on('pedidoAceptado', (pedido: Pedido) => {
        console.log('✅ Pedido aceptado:', pedido);
        observer.next(pedido);
      });

      return () => {
        if (this.socket) {
          this.socket.off('pedidoAceptado');
        }
      };
    });
  }

  /**
   * Escuchar pedido rechazado
   */
  onPedidoRechazado(): Observable<Pedido> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error('Socket no conectado');
        return;
      }

      this.socket.on('pedidoRechazado', (pedido: Pedido) => {
        console.log('❌ Pedido rechazado:', pedido);
        observer.next(pedido);
      });

      return () => {
        if (this.socket) {
          this.socket.off('pedidoRechazado');
        }
      };
    });
  }

  /**
   * Emitir evento personalizado
   */
  emit(evento: string, data: any): void {
    if (!this.socket) {
      console.error('Socket no está conectado');
      return;
    }

    this.socket.emit(evento, data);
  }

  /**
   * Escuchar evento personalizado
   */
  on(evento: string): Observable<any> {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error('Socket no conectado');
        return;
      }

      this.socket.on(evento, (data) => {
        observer.next(data);
      });

      return () => {
        if (this.socket) {
          this.socket.off(evento);
        }
      };
    });
  }
}
