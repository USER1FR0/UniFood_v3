import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { WebsocketService } from '../../../services/websocket.service';
import { PedidoService } from '../../../services/pedido.service';
import {
  Pedido,
  RechazarPedidoDto,
  EntregarPedidoDto,
} from '../../../models/pedido.model';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vendedor-layout',
  imports: [CommonModule, RouterOutlet, FormsModule],
  templateUrl: './vendedor-layout.component.html',
  styleUrls: ['./vendedor-layout.component.scss'],
})
export class VendedorLayoutComponent implements OnInit, OnDestroy {
  nombreVendedor: string = '';
  areaVendedor: string = '';
  menuAbierto = false;

  // Control de modales
  mostrarModalDetalles = false;
  mostrarModalRechazar = false;
  mostrarModalEntregar = false;
  pedidoSeleccionado: Pedido | null = null;

  // Datos para modales
  motivoRechazo: string = '';
  procesando: boolean = false;
  wsConectado: boolean = false;
  areaId: number = 1;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private wsService: WebsocketService,
    private pedidoService: PedidoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.obtenerUsuario();
    this.nombreVendedor = usuario?.nombre_completo || 'Vendedor';
    this.areaVendedor = 'Área de Venta: ' + usuario?.area_venta.area_venta || 'Área' + usuario?.area_venta.area_venta; // Ajustar según el área del vendedor

    // Conectar WebSocket
    this.wsService.conectar();

    // Obtener área del vendedor
    this.obtenerAreaVendedor();

    //const usuario = this.authService.obtenerUsuario();
    //const areaId = usuario?.area_venta_id || 1; // Ajustar según tu estructura
    this.wsService.suscribirVendedor({ areaId: this.areaId });

    // Escuchar nuevos pedidos
    this.escucharWebSockets();

    // Verificar conexión WS periódicamente
    setInterval(() => {
      this.wsConectado = this.wsService.estaConectado();
    }, 2000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.wsService.desconectar();
  }

  obtenerAreaVendedor(): void {
    this.pedidoService.obtenerMiArea().subscribe({
      next: (response) => {
        const areaId = response.area_venta_id;
        //this.areaVendedor = `Área ${areaId}`;
        this.wsService.suscribirVendedor({ areaId });
      },
      error: (err) => {
        // Usar área por defecto
        this.wsService.suscribirVendedor({ areaId: 1 });
      },
    });
  }

  escucharWebSockets(): void {
    // Nuevo pedido
    this.subscriptions.push(
      this.wsService.onNuevoPedido().subscribe((pedido) => {
        this.reproducirSonido();
        Swal.fire({
          icon: 'info',
          title: '¡Nuevo pedido!',
          text: `Pedido #${pedido.codigo} recibido`,
          timer: 3000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
        });
      })
    );
  }

  reproducirSonido(): void {
    const audio = new Audio('assets/sounds/notification.mp3');
    audio
      .play()
      .catch((err) => console.error('Error al reproducir sonido:', err));
  }

  // ========== MÉTODOS PARA MODALES ==========

  abrirDetalles(pedido: Pedido): void {
    if (!pedido || !pedido.pedido_productos) {
      Swal.fire(
        'Error',
        'No se pudieron cargar los detalles del pedido',
        'error'
      );
      return;
    }

    this.pedidoSeleccionado = {
      ...pedido,
      pedido_productos: pedido.pedido_productos || [],
      pagos: pedido.pagos || [],
    };

    this.mostrarModalDetalles = true;
  }

  abrirRechazar(pedido: Pedido): void {
    if (!pedido) {
      //console.error('Pedido no válido');
      return;
    }
    this.pedidoSeleccionado = pedido;
    this.motivoRechazo = '';
    this.mostrarModalRechazar = true;
  }

  abrirEntregar(pedido: Pedido): void {
    if (!pedido || !pedido.cliente) {
      Swal.fire('Error', 'No se puede entregar este pedido', 'error');
      return;
    }
    this.pedidoSeleccionado = pedido;
    this.mostrarModalEntregar = true;
  }

  cerrarModales(): void {
    this.mostrarModalDetalles = false;
    this.mostrarModalRechazar = false;
    this.mostrarModalEntregar = false;
    this.pedidoSeleccionado = null;
    this.motivoRechazo = '';
  }

  // ========== LÓGICA DE RECHAZO ==========

  seleccionarMotivoComun(motivo: string): void {
    if (motivo === 'Otro motivo') {
      this.motivoRechazo = '';
    } else {
      this.motivoRechazo = motivo;
    }
  }

  confirmarRechazo(): void {
    if (!this.motivoRechazo.trim()) {
      Swal.fire('Error', 'Debes indicar el motivo del rechazo', 'error');
      return;
    }

    this.procesando = true;

    const dto: RechazarPedidoDto = {
      motivo: this.motivoRechazo,
    };

    this.pedidoService
      .rechazarPedido(this.pedidoSeleccionado!.id, dto)
      .subscribe({
        next: () => {
          this.procesando = false;
          Swal.fire({
            icon: 'success',
            title: 'Pedido rechazado',
            text: 'El cliente ha sido notificado',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#5B9A97',
          });
          this.cerrarModales();
        },
        error: (err) => {
          this.procesando = false;
          Swal.fire(
            'Error',
            err.error.message || 'No se pudo rechazar el pedido',
            'error'
          );
        },
      });
  }

  // ========== LÓGICA DE ENTREGA ==========

  estaPagado(): boolean {
    return (this.pedidoSeleccionado?.pagos?.length ?? 0) > 0;
  }

  confirmarEntrega(): void {
    if (this.estaPagado()) {
      // Ya está pagado con tarjeta
      this.entregarPedido(1, undefined);
    } else {
      // Pago en efectivo
      Swal.fire({
        title: 'Cobrar en efectivo',
        html: `
          <p style="font-size: 1.2rem; margin-bottom: 1rem;">
            <strong>Cobrar: $${this.pedidoSeleccionado?.total_pedido}</strong>
          </p>
          <p>¿Ya cobraste al cliente?</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, ya cobré',
        cancelButtonText: 'No, aún no',
        confirmButtonColor: '#5B9A97',
        cancelButtonColor: '#E76F51',
      }).then((result) => {
        if (result.isConfirmed) {
          this.entregarPedido(2, Number(this.pedidoSeleccionado?.total_pedido));
        }
      });
    }
  }

  entregarPedido(pagoMetodoId: number, montoEfectivo?: number): void {
    this.procesando = true;

    const dto: EntregarPedidoDto = {
      pago_metodo_id: pagoMetodoId,
      monto_efectivo: montoEfectivo,
    };

    this.pedidoService
      .entregarPedido(this.pedidoSeleccionado!.id, dto)
      .subscribe({
        next: () => {
          this.procesando = false;
          Swal.fire({
            icon: 'success',
            title: '¡Pedido entregado!',
            text: 'El pedido ha sido marcado como entregado',
            timer: 2000,
            showConfirmButton: false,
          });
          this.cerrarModales();
        },
        error: (err) => {
          this.procesando = false;
          Swal.fire(
            'Error',
            err.error.message || 'No se pudo entregar el pedido',
            'error'
          );
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

  // Verificar si el pedido tiene datos completos
  pedidoTieneDatos(): boolean {
    return !!(
      this.pedidoSeleccionado &&
      this.pedidoSeleccionado.pedido_productos &&
      this.pedidoSeleccionado.pedido_productos.length > 0 &&
      this.pedidoSeleccionado.cliente
    );
  }

  // Obtener ingredientes como string
  // Obtener ingredientes como string
  obtenerIngredientes(item: any): string {
    if (!item.producto?.ingredientes) return 'N/A';

    if (Array.isArray(item.producto.ingredientes)) {
      return item.producto.ingredientes.join(', ');
    }

    if (typeof item.producto.ingredientes === 'object') {
      try {
        return Object.values(item.producto.ingredientes).join(', ');
      } catch (e) {
        return 'N/A';
      }
    }

    if (typeof item.producto.ingredientes === 'string') {
      return item.producto.ingredientes;
    }

    return 'N/A';
  }

  irAChat(): void {
    this.router.navigate(['/vendedor/chat']);
  }

  irAReportes(): void {
    this.router.navigate(['/vendedor/reportes']);
  }

  irAVendedores(): void {
    this.router.navigate(['/vendedor/lista-vendedores']);
  }

  irAPedidos(): void {
    this.router.navigate(['/vendedor/pedidos']);
  }


   abrirMenu(){
    this.menuAbierto = !this.menuAbierto;
  }
}
