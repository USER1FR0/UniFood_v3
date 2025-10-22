import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { PedidoService } from '../../services/pedido.service';
import {
  CarritoPorArea,
  ItemCarrito,
  CrearPedidoDto,
  Pedido,
} from '../../models/pedido.model';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cliente-pedido',
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-pedido.component.html',
  styleUrls: ['./cliente-pedido.component.scss'],
})
export class ClientePedidoComponent implements OnInit {
  @Output() pedidoCreado = new EventEmitter<Pedido>();

  carritosPorArea: CarritoPorArea[] = [];
  areaSeleccionada: CarritoPorArea | null = null;
  metodoPagoSeleccionado: 'efectivo' | 'tarjeta' | null = null;
  detallesPedido: string = '';
  procesando: boolean = false;

  // Variables para el test de agregar al carrito
  mostrarModalTest = false;
  testProductoId: number = 1;
  testCantidad: number = 1;
  testDetalles: string = '';
  resultadoTest: string = '';
  errorTest: boolean = false;
  procesandoTest: boolean = false;

  constructor(
    private pedidoService: PedidoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarCarrito();
  }

  cargarCarrito(): void {
    this.carritosPorArea = this.pedidoService.obtenerCarritoPorArea();

    if (this.carritosPorArea.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Carrito vacío',
        text: 'Agrega productos para continuar',
        confirmButtonColor: '#5B9A97',
      });
    } else if (this.carritosPorArea.length === 1) {
      this.areaSeleccionada = this.carritosPorArea[0];
    }
  }

  seleccionarArea(area: CarritoPorArea): void {
    this.areaSeleccionada = area;
  }

  actualizarCantidad(item: ItemCarrito, nuevaCantidad: number): void {
    let todosLosItems: ItemCarrito[] = [];
    this.pedidoService.itemsCarrito$
      .subscribe((items) => (todosLosItems = items))
      .unsubscribe();
    const index = todosLosItems.indexOf(item);
    this.pedidoService.actualizarCantidad(index, nuevaCantidad);
    this.cargarCarrito();
  }

  eliminarItem(item: ItemCarrito): void {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: `¿Deseas eliminar ${item.producto.nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#5B9A97',
      cancelButtonColor: '#E76F51',
    }).then((result) => {
      if (result.isConfirmed) {
        let todosLosItems: ItemCarrito[] = [];
        this.pedidoService.itemsCarrito$
          .subscribe((items) => (todosLosItems = items))
          .unsubscribe();
        const index = todosLosItems.indexOf(item);
        this.pedidoService.eliminarItem(index);
      }
    });
    this.cargarCarrito();
  }

  confirmarPedido(): void {
    if (!this.areaSeleccionada || this.areaSeleccionada.items.length === 0) {
      Swal.fire('Error', 'No hay productos en el área seleccionada', 'error');
      return;
    }

    if (!this.metodoPagoSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona un método de pago',
        text: 'Debes seleccionar cómo deseas pagar',
        confirmButtonColor: '#5B9A97',
      });
      return;
    }

    // Validar microservicio si es pago con tarjeta
    if (this.metodoPagoSeleccionado === 'tarjeta') {
      this.validarMicroservicioPagos();
      return;
    }

    // Si es efectivo, continuar normalmente
    this.crearPedidoDirecto();
  }

  validarMicroservicioPagos(): void {
    Swal.fire({
      title: 'Validando...',
      text: 'Verificando disponibilidad del servicio de pagos',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.pedidoService.verificarMicroservicioPagos().subscribe({
      next: (disponible) => {
        Swal.close();

        if (disponible) {
          this.crearPedidoDirecto();
        } else {
          this.mostrarErrorMicroservicio();
        }
      },
      error: (err) => {
        console.error('❌ Error al validar microservicio:', err);
        Swal.close();
        this.mostrarErrorMicroservicio();
      },
    });
  }

  crearPedidoDirecto(): void {
    if (!this.areaSeleccionada) {
      Swal.fire('Error', 'No hay área seleccionada', 'error');
      return;
    }

    if (this.detallesPedido.length > 80){
      Swal.fire('Advertencia', 'Los detalles exceden el limite permitido', 'warning');
      return;
    }

    this.procesando = true;

    const productos = this.areaSeleccionada.items.map((item) => ({
      producto_id: item.producto.id,
      cantidad: item.cantidad,
      precio_unitario: item.producto.precio,
      detalles_producto: item.detalles || undefined,
    }));

    const dto: CrearPedidoDto = {
      productos: productos,
      detalles_pedido: this.detallesPedido || undefined,
      area_venta_id: this.areaSeleccionada.area_venta_id,
      metodo_pago: this.metodoPagoSeleccionado!,
    };

    this.pedidoService.crearPedido(dto).subscribe({
      next: (pedido) => {
        this.procesando = false;

        // Limpiar SOLO los items del área confirmada
        this.pedidoService.limpiarItemsPorArea(
          this.areaSeleccionada!.area_venta_id
        );

        Swal.fire({
          icon: 'success',
          title: '¡Pedido creado!',
          text: `Tu pedido #${pedido.codigo} ha sido registrado`,
          timer: 2000,
          showConfirmButton: false,
        });

        // Resetear datos
        this.areaSeleccionada = null;
        this.metodoPagoSeleccionado = null;
        this.detallesPedido = '';

        // Emitir evento al padre
        this.pedidoCreado.emit(pedido);

        setTimeout(() => {
          this.cargarCarrito();
        }, 2100);
      },
      error: (err) => {
        this.procesando = false;
        console.error('❌ Error al crear pedido:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'No se pudo crear el pedido',
          confirmButtonColor: '#5B9A97',
        });
      },
    });
  }

  mostrarErrorMicroservicio(): void {
    Swal.fire({
      icon: 'error',
      title: 'Servicio de pagos no disponible',
      html: `
      <p>El servicio de pagos con tarjeta no está disponible en este momento.</p>
      <p><strong>Por favor, selecciona "Pago en efectivo"</strong></p>
    `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#5B9A97',
      allowOutsideClick: false,
    }).then(() => {
      this.metodoPagoSeleccionado = 'efectivo';
    });
  }

  volver(): void {
    this.areaSeleccionada = null;
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

  // Método para probar agregar al carrito
  probarAgregarCarrito(): void {
    if (!this.testProductoId || this.testCantidad < 1) {
      this.errorTest = true;
      this.resultadoTest =
        'Por favor ingresa un ID de producto válido y una cantidad mayor a 0';
      return;
    }

    this.procesandoTest = true;
    this.resultadoTest = '';

    this.pedidoService
      .agregarAlCarritoDesdeApi(
        this.testProductoId,
        this.testCantidad,
        this.testDetalles || undefined
      )
      .subscribe({
        next: (response) => {
          this.procesandoTest = false;
          this.errorTest = false;
          this.resultadoTest = `✅ ${response.producto.nombre} agregado correctamente. Precio: $${response.producto.precio}`;

          // Recargar el carrito
          this.cargarCarrito();

          // Limpiar campos
          setTimeout(() => {
            this.testProductoId = 1;
            this.testCantidad = 1;
            this.testDetalles = '';
          }, 2000);
        },
        error: (err) => {
          this.procesandoTest = false;
          this.errorTest = true;
          this.resultadoTest =
            err.error?.message ||
            'Error al agregar el producto. Verifica que el ID exista y esté activo.';
          console.error('Error:', err);
        },
      });
  }
}
