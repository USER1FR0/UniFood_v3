import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { WebsocketService } from '../../../services/websocket.service';
import { PedidoService } from '../../../services/pedido.service';
import { Pedido, ProcesarPagoDto } from '../../../models/pedido.model';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cliente-layout',
  imports: [CommonModule, RouterOutlet, FormsModule],
  templateUrl: './cliente-layout.component.html',
  styleUrls: ['./cliente-layout.component.scss'],
})
export class ClienteLayoutComponent implements OnInit, OnDestroy {
  nombreCliente: string = '';
  cantidadCarrito: number = 0;
  pedidosActivos: Pedido[] = [];
  pedidoSeleccionado: Pedido | null = null;
  mostrarListaPedidos = false;

  //Estado pago
  estaPagado: boolean = false;

  // Control de modales
  mostrarModalSeguimiento = false;
  mostrarModalPago = false;
  mostrarModalCalificacion = false;

  numeroTarjeta: string = '';
  expiracion: string = '';
  cvv: string = '';
  calificaciones: number[] = [];
  comentarios: string[] = [];

  private subscriptions: Subscription[] = [];
  private pollingInterval: any;

  @ViewChild('audioPendiente') audioPendiente!: ElementRef<HTMLAudioElement>;

  constructor(
    private authService: AuthService,
    private wsService: WebsocketService,
    private pedidoService: PedidoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.obtenerUsuario();
    this.nombreCliente = usuario?.correo.split('@')[0] || 'Cliente';

    // Suscribirse al carrito
    this.subscriptions.push(
      this.pedidoService.itemsCarrito$.subscribe(() => {
        this.cantidadCarrito = this.pedidoService.obtenerCantidadTotalCarrito();
      })
    );

    // Conectar WebSocket
    this.wsService.conectar();

    // Verificar si hay pedido activo
    this.verificarPedidosActivos();

    // Escuchar actualizaciones
    this.escucharWebSockets();

    // Polling de respaldo cada 15 segundos
    /*this.pollingInterval = setInterval(() => {
      if (this.pedidosActivos) {
        this.verificarPedidosActivos();
      }
    }, 15000);*/
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.wsService.desconectar();

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  verificarPedidosActivos(): void {
    this.pedidoService.obtenerMisPedidosActivos().subscribe({
      next: (pedidos) => {
        this.pedidosActivos = pedidos;

        if (pedidos.length > 0) {
          pedidos.forEach((pedido) => {
            this.wsService.suscribirPedido(pedido.id);
          });
        }
      },
      error: (err) => {
        console.error('❌ Error al obtener pedidos activos:', err);
        this.pedidosActivos = [];
      },
    });
  }

  escucharWebSockets(): void {
    // Actualizar pedido
    this.subscriptions.push(
      this.wsService.onActualizarPedido().subscribe((pedido) => {
        console.log('🔄 Pedido actualizado (cliente):', pedido);

        const index = this.pedidosActivos.findIndex((p) => p.id === pedido.id);
        if (index !== -1) {
          const calificacionesAnteriores = [...this.calificaciones];
          const comentariosAnteriores = [...this.comentarios];

          this.pedidosActivos[index] = pedido;

          if (this.pedidoSeleccionado?.id === pedido.id) {
            this.pedidoSeleccionado = pedido;
          }

          if (calificacionesAnteriores.length > 0) {
            this.calificaciones = calificacionesAnteriores;
            this.comentarios = comentariosAnteriores;
          }
        }
      })
    );

    // Pedido listo
    this.subscriptions.push(
      this.wsService.onPedidoListo().subscribe((pedido) => {
        // Buscar y actualizar el pedido
        const index = this.pedidosActivos.findIndex((p) => p.id === pedido.id);

        if (index !== -1) {
          this.pedidosActivos[index] = pedido;

          // Actualizar seleccionado si es el mismo
          if (this.pedidoSeleccionado?.id === pedido.id) {
            this.pedidoSeleccionado = pedido;
          }

          this.reproducirSonido();

          const areaNombre =
            pedido.area_venta?.area_venta|| 'tu área correspondiente';

          Swal.fire({
            icon: 'success',
            title: '¡Tu pedido está listo!',
            html: `
        <p style="font-size: 1.1rem; margin-bottom: 1rem;">
          <strong>Recógelo en:</strong>
        </p>
        <p style="font-size: 1.3rem; color: #5B9A97; font-weight: bold;">
          📍 ${areaNombre}
        </p>
      `,
            confirmButtonText: 'Ir a recoger',
            confirmButtonColor: '#5B9A97',
          });
        }
      })
    );

    // Pedido cancelado
    this.subscriptions.push(
      this.wsService.onPedidoCancelado().subscribe((pedido) => {
        this.pedidosActivos = this.pedidosActivos.filter(
          (p) => p.id !== pedido.id
        );

        if (this.pedidoSeleccionado?.id === pedido.id) {
          this.pedidoSeleccionado = null;
          this.mostrarModalSeguimiento = false;
        }

        Swal.fire({
          icon: 'info',
          title: 'Pedido cancelado',
          text: 'Tu pedido ha sido cancelado',
          confirmButtonColor: '#5B9A97',
        }).then(() => {
          if (this.pedidosActivos.length > 0) {
            this.abrirListaPedidos();
          }
        });
      })
    );

    // Pedido rechazado
    this.subscriptions.push(
      this.wsService.onPedidoRechazado().subscribe((pedido) => {
        this.pedidosActivos = this.pedidosActivos.filter(
          (p) => p.id !== pedido.id
        );

        if (this.pedidoSeleccionado?.id === pedido.id) {
          this.pedidoSeleccionado = null;
          this.mostrarModalSeguimiento = false;
        }

        this.reproducirSonido();
        const motivo =
          pedido.detalles_pedido?.replace('RECHAZADO: ', '') ||
          'Sin motivo especificado';

        Swal.fire({
          icon: 'error',
          title: 'Pedido rechazado',
          html: `<p>Tu pedido fue rechazado por el vendedor.</p><p><strong>Motivo:</strong> ${motivo}</p>`,
          confirmButtonColor: '#5B9A97',
        }).then(() => {
          if (this.pedidosActivos.length > 0) {
            this.verificarPedidosActivos();
            setTimeout(() => {
              this.abrirListaPedidos();
            }, 2100);
          }
        });
      })
    );

    // Pedido entregado
    this.subscriptions.push(
      this.wsService.onPedidoEntregado().subscribe((pedido) => {
        this.reproducirSonido();
        console.log('🎉 Pedido entregado:', pedido);

        // Buscar y actualizar el pedido en el array
        const index = this.pedidosActivos.findIndex((p) => p.id === pedido.id);

        if (index !== -1) {
          // Actualizar el pedido
          this.pedidosActivos[index] = pedido;

          // Si es el seleccionado, actualizarlo también
          if (this.pedidoSeleccionado?.id === pedido.id) {
            this.pedidoSeleccionado = pedido;
          }

          // Mostrar notificación
          Swal.fire({
            icon: 'success',
            title: '¡Tu pedido ha sido entregado!',
            text: '¡Disfrútalo! 🎉',
            confirmButtonText: 'Calificar productos',
            cancelButtonText: 'Cerrar',
            showCancelButton: true,
            confirmButtonColor: '#5B9A97',
            cancelButtonColor: '#7A8A8B',
          }).then((result) => {
            if (result.isConfirmed) {
              // Abrir modal de calificación
              this.abrirModalCalificacion(pedido);
            } else {
              // Remover el pedido de la lista de activos
              this.pedidosActivos = this.pedidosActivos.filter(
                (p) => p.id !== pedido.id
              );

              // Si era el seleccionado, cerrar el modal
              if (this.pedidoSeleccionado?.id === pedido.id) {
                this.pedidoSeleccionado = null;
                this.mostrarModalSeguimiento = false;
              }
            }
          });
          this.verificarPedidosActivos();
        }
      })
    );
  }

  abrirSeguimiento(): void {
    this.verificarPedidosActivos();
    if (this.pedidosActivos.length === 1) {
      this.pedidoSeleccionado = this.pedidosActivos[0];
      this.mostrarModalSeguimiento = true;
    } else if (this.pedidosActivos.length > 1) {
      this.abrirListaPedidos();
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Sin pedidos activos',
        text: 'No tienes pedidos en este momento',
        confirmButtonColor: '#5B9A97',
      });
    }
  }

  abrirModalPago(): void {
    this.mostrarModalPago = true;
  }

  abrirModalCalificacion(pedido?: Pedido): void {
    // Si se pasa un pedido específico, usarlo; si no, usar el seleccionado
    const pedidoACalificar = pedido || this.pedidoSeleccionado;

    if (pedidoACalificar && pedidoACalificar.pedido_estado_id === 4) {
      // Actualizar el pedido seleccionado
      this.pedidoSeleccionado = pedidoACalificar;

      const cantidadProductos = pedidoACalificar.pedido_productos?.length || 0;
      this.calificaciones = new Array(cantidadProductos).fill(0);
      this.comentarios = new Array(cantidadProductos).fill('');
      this.mostrarModalCalificacion = true;

      // Cerrar modal de seguimiento si está abierto
      this.mostrarModalSeguimiento = false;
    }
  }

  onPedidoCreado(pedido: Pedido): void {
    this.pedidosActivos.push(pedido);
    this.pedidoSeleccionado = pedido;
    this.wsService.suscribirPedido(pedido.id);

    const pagoPendiente = pedido.pagos?.find(
      (p) => p.pago_metodo_id === 1 && p.pago_estado_id === 2
    );

    if (pagoPendiente) {
      setTimeout(() => {
        this.mostrarModalPago = true;
      }, 500);
    } else {
      this.mostrarModalSeguimiento = true;
    }
  }

  onPagoProcesado(): void {
    this.mostrarModalPago = false;
    this.verificarPedidosActivos();
    this.mostrarModalSeguimiento = true;
  }

  cancelarPedido(): void {
    if (!this.pedidoSeleccionado) {
      Swal.fire('Error', 'No hay pedido seleccionado', 'error');
      return;
    }

    if (this.pedidoSeleccionado.pedido_estado_id !== 1) {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede cancelar',
        text: 'Solo se pueden cancelar pedidos pendientes',
        confirmButtonColor: '#5B9A97',
      });
      return;
    }

    Swal.fire({
      title: '¿Cancelar pedido?',
      html: `<p>Esta acción no se puede deshacer</p>
           <p><strong>Pedido:</strong> #${this.pedidoSeleccionado.codigo}</p>
           <p><strong>Total:</strong> $${this.pedidoSeleccionado.total_pedido}</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      confirmButtonColor: '#E76F51',
      cancelButtonColor: '#7A8A8B',
    }).then((result) => {
      if (result.isConfirmed && this.pedidoSeleccionado) {
        Swal.fire({
          title: 'Cancelando pedido...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        this.pedidoService
          .cancelarPedido(this.pedidoSeleccionado.id)
          .subscribe({
            next: () => {
              this.pedidosActivos = this.pedidosActivos.filter(
                (p) => p.id !== this.pedidoSeleccionado!.id
              );

              this.pedidoSeleccionado = null;
              this.mostrarModalSeguimiento = false;

              Swal.fire({
                icon: 'success',
                title: 'Cancelado',
                text: 'Tu pedido ha sido cancelado',
                confirmButtonColor: '#5B9A97',
              }).then(() => {
                if (this.pedidosActivos.length > 0) {
                  this.abrirListaPedidos();
                }
              });
            },
            error: (err) => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.error?.message || 'No se pudo cancelar el pedido',
                confirmButtonColor: '#5B9A97',
              });
            },
          });
      }
    });
  }

  procesarPago(): void {
    if (!this.pedidoSeleccionado) {
      Swal.fire('Error', 'No hay pedido seleccionado', 'error');
      return;
    }

    const pagoPendiente = this.pedidoSeleccionado.pagos?.find(
      (p) => p.pago_metodo_id === 1 && p.pago_estado_id === 2
    );

    if (!pagoPendiente) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No hay un pago pendiente con tarjeta para este pedido',
        confirmButtonColor: '#5B9A97',
      });
      return;
    }

    if (
      !this.numeroTarjeta ||
      this.numeroTarjeta.replace(/\s/g, '').length < 13
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Tarjeta inválida',
        text: 'Ingresa un número de tarjeta válido',
        confirmButtonColor: '#5B9A97',
      });
      return;
    }

    if (!this.cvv || this.cvv.length < 3) {
      Swal.fire({
        icon: 'error',
        title: 'CVV inválido',
        text: 'Ingresa un CVV válido (3 o 4 dígitos)',
        confirmButtonColor: '#5B9A97',
      });
      return;
    }

    if (!this.expiracion || !/^\d{2}\/\d{2}$/.test(this.expiracion)) {
      Swal.fire({
        icon: 'error',
        title: 'Fecha inválida',
        text: 'Ingresa la fecha en formato MM/AA',
        confirmButtonColor: '#5B9A97',
      });
      return;
    }

    Swal.fire({
      title: 'Procesando pago...',
      html: 'Por favor espera mientras procesamos tu pago',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const dto: ProcesarPagoDto = {
      datos_tarjeta: {
        numero: this.numeroTarjeta.replace(/\s/g, ''),
        cvv: this.cvv,
        expiracion: this.expiracion,
      },
    };

    this.pedidoService.procesarPago(this.pedidoSeleccionado.id, dto).subscribe({
      next: () => {
        this.mostrarModalPago = false;
        this.numeroTarjeta = '';
        this.expiracion = '';
        this.cvv = '';
        Swal.fire('¡Pago exitoso!', 'Tu pago ha sido procesado', 'success');
        this.verificarPedidosActivos();
        this.mostrarModalSeguimiento = true;
      },
      error: (err) => {
        Swal.fire(
          'Error en el pago',
          err.error.message || 'No se pudo procesar el pago',
          'error'
        );
      },
    });
  }

  setCalificacion(index: number, calificacion: number): void {
    if (!this.calificaciones || this.calificaciones.length === 0) {
      const cantidadProductos =
        this.pedidoSeleccionado?.pedido_productos?.length || 0;
      this.calificaciones = new Array(cantidadProductos).fill(0);
      this.comentarios = new Array(cantidadProductos).fill('');
    }

    if (index >= 0 && index < this.calificaciones.length) {
      this.calificaciones[index] = calificacion;
    }
  }

  enviarCalificaciones(): void {
    if (!this.pedidoSeleccionado) {
      Swal.fire('Error', 'No hay pedido seleccionado para calificar', 'error');
      return;
    }

    if (
      !this.pedidoSeleccionado.pedido_productos ||
      this.pedidoSeleccionado.pedido_productos.length === 0
    ) {
      Swal.fire('Error', 'No hay productos para calificar', 'error');
      return;
    }

    const calificacionesValidas = this.pedidoSeleccionado.pedido_productos
      .map((item, index) => ({
        producto_id: item.producto_id,
        calificacion: this.calificaciones[index],
        comentario: this.comentarios[index] || '',
      }))
      .filter((c) => c.calificacion > 0);

    if (calificacionesValidas.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin calificaciones',
        text: 'Selecciona al menos una calificación',
        confirmButtonColor: '#5B9A97',
      });
      return;
    }

    Swal.fire({
      title: 'Enviando calificaciones...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const promesas = calificacionesValidas.map((c) =>
      this.pedidoService
        .calificarProducto(this.pedidoSeleccionado!.id, c)
        .toPromise()
    );

    Promise.all(promesas)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: '¡Gracias!',
          text: 'Tus calificaciones han sido registradas',
          confirmButtonColor: '#5B9A97',
        }).then(() => {
          // Cerrar modal y limpiar
          this.mostrarModalCalificacion = false;
          this.calificaciones = [];
          this.comentarios = [];

          // Remover el pedido de activos
          if (this.pedidoSeleccionado) {
            this.pedidosActivos = this.pedidosActivos.filter(
              (p) => p.id !== this.pedidoSeleccionado!.id
            );
            this.pedidoSeleccionado = null;
          }
        });
      })
      .catch((err) => {
        console.error('Error al enviar calificaciones:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text:
            err.error?.message || 'No se pudieron enviar las calificaciones',
          confirmButtonColor: '#5B9A97',
        });
      });
  }

  cerrarModalPago(): void {
    this.mostrarModalPago = false;
    this.numeroTarjeta = '';
    this.expiracion = '';
    this.cvv = '';
  }

  cerrarModalSeguimiento(): void {
    this.mostrarModalSeguimiento = false;
  }

  cerrarModalCalificacion(): void {
    this.mostrarModalCalificacion = false;
    this.calificaciones = [];
    this.comentarios = [];

    // Remover el pedido de la lista de activos
    if (this.pedidoSeleccionado) {
      this.pedidosActivos = this.pedidosActivos.filter(
        (p) => p.id !== this.pedidoSeleccionado!.id
      );
      this.pedidoSeleccionado = null;
    }
  }

  logout(): void {
    Swal.fire({
      title: '¿Cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#5B9A97',
      cancelButtonColor: '#E76F51',
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }

  formatearNumeroTarjeta(event: any): void {
    let valor = event.target.value.replace(/\s/g, '');
    valor = valor.replace(/\D/g, '');
    if (valor.length > 0) {
      valor = valor.match(/.{1,4}/g)?.join(' ') || valor;
    }
    this.numeroTarjeta = valor;
  }

  formatearExpiracion(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length >= 2) {
      valor = valor.slice(0, 2) + '/' + valor.slice(2, 4);
    }
    this.expiracion = valor;
  }

  abrirListaPedidos(): void {
    if (this.pedidosActivos.length > 0) {
      this.mostrarListaPedidos = true;
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Sin pedidos activos',
        text: 'No tienes pedidos en este momento',
        confirmButtonColor: '#5B9A97',
      });
    }
  }

  seleccionarPedido(pedido: Pedido): void {
    this.pedidoSeleccionado = pedido;
    this.mostrarListaPedidos = false;
    this.mostrarModalSeguimiento = true;
  }

  obtenerEstadoPago():boolean{
    return this.pedidoSeleccionado?.pagos?.some(p => p.pago_metodo_id ===1) ?? false;
  }

  reproducirSonido(): void {
    try {
      if (this.audioPendiente && this.audioPendiente.nativeElement) {
        const audio = this.audioPendiente.nativeElement;
        audio.currentTime = 0; // Reiniciar el audio
        audio.play().catch((err) => {
          console.warn('⚠️ No se pudo reproducir el sonido:', err);
          //this.reproducirSonidoAlternativo();
        });
      }
    } catch (error) {
      console.error('❌ Error en reproducirSonido:', error);
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
}
