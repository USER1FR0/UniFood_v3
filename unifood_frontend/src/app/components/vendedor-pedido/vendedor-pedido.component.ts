import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { PedidoService } from '../../services/pedido.service';
import { WebsocketService } from '../../services/websocket.service';
import { Pedido } from '../../models/pedido.model';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vendedor-pedido',
  imports: [
    CommonModule,
    //RouterOutlet,
    FormsModule,
  ],
  templateUrl: './vendedor-pedido.component.html',
  styleUrls: ['./vendedor-pedido.component.scss'],
})
export class VendedorPedidoComponent implements OnInit, OnDestroy {
  pedidosPendientes: Pedido[] = [];
  pedidosEnProceso: Pedido[] = [];
  pedidosListos: Pedido[] = [];
  //metodoPago: string = '2'; // 1=efectivo, 2=tarjeta
  estaPagado: boolean = false;

  cargando: boolean = true;
  private subscriptions: Subscription[] = [];

  @ViewChild('audioPendiente') audioPendiente!: ElementRef<HTMLAudioElement>;

  constructor(
    private pedidoService: PedidoService,
    private wsService: WebsocketService
  ) {}

  ngOnInit(): void {
    this.cargarPedidos();
    this.escucharWebSockets();
    // Polling de respaldo cada 30 segundos
    //this.iniciarPolling();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  cargarPedidos(): void {
    this.cargando = true;

    // Cargar pendientes
    this.pedidoService.obtenerPendientes().subscribe({
      next: (pedidos) => {
        this.pedidosPendientes = pedidos;
      },
      error: (err) => console.error('Error al cargar pedidos w pendientes:', err),
    });

    // Cargar en proceso
    this.pedidoService.obtenerEnProceso().subscribe({
      next: (pedidos) => {
        this.pedidosEnProceso = pedidos;
      },
      error: (err) => console.error('Error al cargar en proceso:', err),
    });

    // Cargar listos
    this.pedidoService.obtenerListos().subscribe({
      next: (pedidos) => {
        this.pedidosListos = pedidos;
        this.cargando = false;
      },
      error: (err) => {
        //console.error('Error al cargar listos:', err);
        this.cargando = false;
      },
    });
  }

  escucharWebSockets(): void {
    // Nuevo pedido
    // Nuevo pedido
    this.subscriptions.push(
      this.wsService.onNuevoPedido().subscribe((pedido) => {

        // Verificar que no exista ya en la lista
        const existe = this.pedidosPendientes.some((p) => p.id === pedido.id);
        if (!existe) {
          this.pedidosPendientes.unshift(pedido);
          this.reproducirSonido();

          // Vibrar en dispositivos móviles
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]); // Patrón de vibración
          }

          Swal.fire({
            icon: 'info',
            title: '¡Nuevo pedido!',
            text: `Pedido #${pedido.codigo} recibido`,
            timer: 3000,
            showConfirmButton: false,
            position: 'top-end',
            toast: true,
          });
        }
      })
    );

    // Actualizar pedido
    this.subscriptions.push(
      this.wsService.onActualizarPedido().subscribe((pedido) => {
        this.actualizarPedidoEnLista(pedido);
      })
    );

    // Pedido cancelado
    this.subscriptions.push(
      this.wsService.onPedidoCancelado().subscribe((pedido) => {
        this.eliminarPedidoDeListas(pedido.id);
      })
    );

    // Pedido rechazado
    this.subscriptions.push(
      this.wsService.onPedidoRechazado().subscribe((pedido) => {
        this.eliminarPedidoDeListas(pedido.id);
      })
    );
  }

  reproducirSonido(): void {
    try {
      if (this.audioPendiente && this.audioPendiente.nativeElement) {
        const audio = this.audioPendiente.nativeElement;
        audio.currentTime = 0; // Reiniciar el audio
        audio.play().catch((err) => {
          this.reproducirSonidoAlternativo();
        });
      }
    } catch (error) {
      console.error('Error en reproducirSonido:', error);
    }
  }

  reproducirSonidoAlternativo(): void {
    // Beep simple como fallback
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.error('No se pudo reproducir sonido alternativo:', e);
    }
  }

  actualizarPedidoEnLista(pedido: Pedido): void {

    // Eliminar de todas las listas
    this.eliminarPedidoDeListas(pedido.id);

    // Agregar a la lista correspondiente según estado
    if (pedido.pedido_estado_id === 1) {
      this.pedidosPendientes.unshift(pedido); // Agregar al inicio
      return;
    } else if (pedido.pedido_estado_id === 2) {
      this.pedidosEnProceso.unshift(pedido);
      return;
    } else if (pedido.pedido_estado_id === 3) {
      this.pedidosListos.unshift(pedido);
      return;
    } else if (pedido.pedido_estado_id === 4) {
      // Entregado - eliminar de todas las listas
      return;
    } else if (pedido.pedido_estado_id === 5 || pedido.pedido_estado_id === 6) {
      // Cancelado o rechazado - eliminar de todas las listas
      return;
    }
  }

  eliminarPedidoDeListas(pedidoId: number): void {
    this.pedidosPendientes = this.pedidosPendientes.filter(
      (p) => p.id !== pedidoId
    );
    this.pedidosEnProceso = this.pedidosEnProceso.filter(
      (p) => p.id !== pedidoId
    );
    this.pedidosListos = this.pedidosListos.filter((p) => p.id !== pedidoId);
  }

  aceptarPedido(pedido: Pedido): void {
    Swal.fire({
      title: '¿Aceptar pedido?',
      text: `Pedido #${pedido.codigo}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aceptar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#5B9A97',
      cancelButtonColor: '#7A8A8B',
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar loading
        const loadingToast = Swal.fire({
          title: 'Aceptando pedido...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        this.pedidoService.aceptarPedido(pedido.id).subscribe({
          next: (pedidoActualizado) => {
            loadingToast.finally();
            this.actualizarPedidoEnLista(pedidoActualizado);

            Swal.fire({
              icon: 'success',
              title: '¡Pedido aceptado!',
              text: `Pedido #${pedido.codigo} en preparación`,
              timer: 2000,
              showConfirmButton: false,
              position: 'top-end',
              toast: true,
            });
          },
          error: (err) => {
            loadingToast.finally();
            Swal.fire(
              'Error',
              err.error.message || 'No se pudo aceptar el pedido',
              'error'
            );
          },
        });
      }
    });
  }

  marcarComoListo(pedido: Pedido): void {
    Swal.fire({
      title: '¿Marcar como listo?',
      text: `Pedido #${pedido.codigo}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, está listo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#6BBF59',
      cancelButtonColor: '#7A8A8B',
    }).then((result) => {
      if (result.isConfirmed) {
        const loadingToast = Swal.fire({
          title: 'Marcando como listo...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        this.pedidoService.marcarComoListo(pedido.id).subscribe({
          next: (pedidoActualizado) => {
            loadingToast.finally();
            this.actualizarPedidoEnLista(pedidoActualizado);

            Swal.fire({
              icon: 'success',
              title: '¡Pedido listo!',
              text: 'El cliente ha sido notificado',
              timer: 2000,
              showConfirmButton: false,
              position: 'top-end',
              toast: true,
            });
          },
          error: (err) => {
            loadingToast.finally();
            Swal.fire(
              'Error',
              err.error.message || 'No se pudo marcar como listo',
              'error'
            );
          },
        });
      }
    });
  }

  obtenerTiempoTranscurrido(fecha: Date): string {
    const ahora = new Date();
    const registro = new Date(fecha);
    const diff = Math.floor((ahora.getTime() - registro.getTime()) / 60000); // minutos

    if (diff < 1) return '<1 min';
    if (diff === 1) return '1 min';
    if (diff < 60) return `${diff} mins`;

    const horas = Math.floor(diff / 60);
    if (horas === 1) return '1 hora';
    return `${horas} horas`;
  }

  obtenerColorTiempo(fecha: Date): string {
    const ahora = new Date();
    const registro = new Date(fecha);
    const diff = Math.floor((ahora.getTime() - registro.getTime()) / 60000);

    if (diff < 5) return 'reciente'; // Verde
    if (diff < 15) return 'medio'; // Amarillo
    return 'urgente'; // Rojo
  }

  // Agregar DESPUÉS de los métodos existentes:

  abrirDetalles(pedido: Pedido): void {

    let metodoPago = '';

    if (pedido.pagos?.find((p) => p.pago_metodo_id === 1)) {
      metodoPago = 'Tarjeta';
    }else{
      metodoPago = 'Efectivo';
    }
    // Este método debe llamar al método del layout padre
    // Como están en componentes separados, usar un EventEmitter:

    // OPCIÓN 1: Crear Output en vendedor-pedido
    // En la clase agregar:
    // @Output() verDetalles = new EventEmitter<Pedido>();

    // Y llamar:
    // this.verDetalles.emit(pedido);

    // OPCIÓN 2: Inyectar el servicio de vendedor-layout
    // Por ahora, mostrar detalles con SweetAlert:

    Swal.fire({
      title: `Pedido #${pedido.codigo}`,
      html: `
    <div style="text-align: left;">
      <p><strong>Cliente:</strong> ${pedido.cliente?.nombre_completo}</p>
      <p><strong>Teléfono:</strong> ${pedido.cliente?.telefono}</p>
      <p><strong>Total:</strong> $${pedido.total_pedido}</p>
      <p><strong>Pago:</strong> ${metodoPago}</p>
      <br>
      <p><strong>Productos:</strong></p>
      <ul>
        ${pedido.pedido_productos
          .map(
            (item) => `
            <li>
              ${item.cantidad}x ${item.producto?.nombre}
              ${
                item.detalles_producto
                  ? `<br><em>....${item.detalles_producto}</em>`
                  : ''
              }
            </li>
          `
          )
          .join('')}
      </ul>
    </div>
  `,
      confirmButtonColor: '#5B9A97',
    });
  }

  abrirRechazar(pedido: Pedido): void {
    Swal.fire({
      title: 'Rechazar pedido',
      input: 'textarea',
      inputLabel: 'Motivo del rechazo',
      inputPlaceholder: 'Escribe el motivo...',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#E76F51',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.pedidoService
          .rechazarPedido(pedido.id, { motivo: result.value })
          .subscribe({
            next: () => {
              this.eliminarPedidoDeListas(pedido.id);
              Swal.fire('Rechazado', 'El pedido ha sido rechazado', 'success');
            },
            error: (err) => {
              Swal.fire(
                'Error',
                err.error.message || 'No se pudo rechazar',
                'error'
              );
            },
          });
      }else if(result.isConfirmed){
        Swal.fire(
          'Error',
          'Debe agregar algún motivo de rechazo',
          'error'
        ).then((result)=>{
          this.abrirRechazar(pedido);
        }) 
      }
    });
  }

  abrirEntregar(pedido: Pedido): void {
    this.estaPagado = pedido.pagos.some((p) => p.pago_estado_id === 1);

    if (this.estaPagado) {
      this.confirmarEntrega(pedido, 1, undefined);
    } else {
      Swal.fire({
        title: 'Cobrar en efectivo',
        html: `<p style="font-size: 1.2rem;"><strong>Total: $${pedido.total_pedido}</strong></p><p>¿Ya cobraste al cliente?</p>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, ya cobré',
        cancelButtonText: 'No',
        confirmButtonColor: '#5B9A97',
      }).then((result) => {
        if (result.isConfirmed) {
          this.confirmarEntrega(pedido, 2, Number(pedido.total_pedido));
        }
      });
      this.estaPagado=false;
    }
  }

  confirmarEntrega(
    pedido: Pedido,
    pagoMetodoId: number,
    montoEfectivo?: number
  ): void {
    const dto = {
      pago_metodo_id: pagoMetodoId,
      monto_efectivo: montoEfectivo,
    };

    const loadingToast = Swal.fire({
      title: 'Entregando pedido...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.pedidoService.entregarPedido(pedido.id, dto).subscribe({
      next: () => {
        loadingToast.finally();
        this.eliminarPedidoDeListas(pedido.id);

        Swal.fire({
          icon: 'success',
          title: '¡Pedido entregado!',
          text: `Pedido #${pedido.codigo} completado`,
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        loadingToast.finally();
        Swal.fire('Error', err.error.message || 'No se pudo entregar', 'error');
      },
    });
  }

  obtenerTiempoTotal(pedido: Pedido): number {
    if (
      !pedido ||
      !pedido.pedido_productos ||
      pedido.pedido_productos.length === 0
    ) {
      return 0;
    }

    return pedido.pedido_productos.reduce((max, item) => {
      return Math.max(max, item.producto?.tiempo_preparacion || 0);
    }, 0);
  }

  private pollingInterval: any;

  iniciarPolling(): void {
    // Actualizar pedidos cada 30 segundos como respaldo
    this.pollingInterval = setInterval(() => {
      if (!this.cargando) {
        this.cargarPedidos();
      }
    }, 300000); // 30 segundos
  }
}
