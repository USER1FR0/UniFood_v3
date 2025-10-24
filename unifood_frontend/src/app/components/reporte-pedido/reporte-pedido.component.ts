import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../services/pedido.service';
import { AuthService } from '../../services/auth.service';
import {
  FiltrosReporte,
  OpcionesReporte,
  OpcionesTicket,
  CatalogoMetodoPago,
  CatalogoEstadoPedido,
  CatalogoAreaVenta,
  Pedido,
} from '../../models/pedido.model';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-reporte-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-pedido.component.html',
  styleUrls: ['./reporte-pedido.component.scss'],
})
export class ReportePedidoComponent implements OnInit {
  metodosPago: CatalogoMetodoPago[] = [];
  estadosPedido: CatalogoEstadoPedido[] = [];
  areasVenta: CatalogoAreaVenta[] = [];

  filtros: FiltrosReporte = {};

  opciones: OpcionesReporte = {
    incluir_nombre_cliente: false,
    incluir_correo_cliente: false,
    incluir_telefono_cliente: false,
    incluir_detalles_pedido: false,
  };

  opcionesTicket: OpcionesTicket = {
    incluir_descripcion_producto: false,
    incluir_detalles_producto: false,
    incluir_calificaciones: false,
  };

  pedidos: Pedido[] = [];
  totalVentas: number = 0;
  reporteGenerado: boolean = false;
  cargando: boolean = false;

  nombreUsuario: string = '';
  rolUsuario: string = '';
  esSupervisor: boolean = false;
  areaVenta: string = 'Hola';
  nombreEstadoFiltrado: string = '';
  nombreMetodoFiltrado: string = '';
  nombreAreaFiltrada: string = '';

  constructor(
    private pedidoService: PedidoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarCatalogos();
  }

  cargarUsuario(): void {
    const usuario = this.authService.obtenerUsuario();
    if (usuario) {
      this.nombreUsuario =
        usuario.nombre_completo || usuario.correo.split('@')[0];
      this.rolUsuario = usuario.rol;
      this.esSupervisor = usuario.rol === 'supervisor';
      if (usuario.area_venta){
      this.areaVenta = usuario.area_venta.area_venta || 'Supervision';
      }else{
        this.areaVenta='Supervision'
      }
    }
  }

  cargarCatalogos(): void {
    this.pedidoService.obtenerCatalogosReportes().subscribe({
      next: (data) => {
        this.metodosPago = data.metodosPago;
        this.estadosPedido = data.estadosPedido;
        this.areasVenta = data.areasVenta;
        //console.log('Catalogos cargados w:', data);
      },
      error: (err) => {
        //console.error('Error al cargar catálogos:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los catálogos',
          confirmButtonColor: '#5B9A97',
        });
      },
    });
  }

  generarReporte(): void {
    if (this.filtros.fecha_inicio && this.filtros.fecha_fin) {
      if (this.filtros.fecha_inicio > this.filtros.fecha_fin) {
        Swal.fire({
          icon: 'warning',
          title: 'Fechas inválidas',
          text: 'La fecha de inicio no puede ser mayor a la fecha fin',
          confirmButtonColor: '#5B9A97',
        });
        return;
      }
    }

    this.cargando = true;
    this.reporteGenerado = false;

    this.nombreEstadoFiltrado = this.obtenerNombreEstadoPedido(
      this.filtros.pedido_estado_id
    );
    this.nombreMetodoFiltrado = this.obtenerNombreMetodoPago(
      this.filtros.pago_metodo_id
    );
    this.nombreAreaFiltrada = this.obtenerNombreArea(
      this.filtros.area_venta_id
    );

    this.pedidoService.generarReporte(this.filtros, this.opciones).subscribe({
      next: (data) => {
        this.pedidos = data.pedidos;
        this.totalVentas = data.totalVentas;
        this.reporteGenerado = true;
        this.cargando = false;

        if (this.pedidos.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'Sin resultados',
            text: 'No se encontraron pedidos con los filtros aplicados',
            confirmButtonColor: '#5B9A97',
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Reporte generado',
            text: `Se encontraron ${this.pedidos.length} pedidos`,
            timer: 2000,
            showConfirmButton: false,
          });
        }
      },
      error: (err) => {
        this.cargando = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'No se pudo generar el reporte',
          confirmButtonColor: '#5B9A97',
        });
      },
    });
  }

  limpiarFiltros(): void {
    this.filtros = {};
    this.opciones = {
      incluir_nombre_cliente: false,
      incluir_correo_cliente: false,
      incluir_telefono_cliente: false,
      incluir_detalles_pedido: false,
    };
    this.reporteGenerado = false;
    this.pedidos = [];
    this.totalVentas = 0;
  }

  descargarCSV(): void {
    if (this.pedidos.length === 0) return;

    const datos = this.prepararDatosReporte();
    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

    const csvOutput = XLSX.write(workbook, { bookType: 'csv', type: 'array' });
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });

    const nombreArchivo = `reporte_pedidos_${this.obtenerFechaActual()}.csv`;
    saveAs(blob, nombreArchivo);

    Swal.fire({
      icon: 'success',
      title: 'Descargado',
      text: 'El reporte CSV ha sido descargado',
      timer: 2000,
      showConfirmButton: false,
    });
  }

  descargarExcel(): void {
    if (this.pedidos.length === 0) return;

    const datos = this.prepararDatosReporte();

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte de Pedidos');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const nombreArchivo = `reporte_pedidos_${this.obtenerFechaActual()}.xlsx`;
    saveAs(blob, nombreArchivo);

    Swal.fire({
      icon: 'success',
      title: 'Descargado',
      text: 'El reporte Excel ha sido descargado',
      timer: 2000,
      showConfirmButton: false,
    });
  }

  prepararDatosReporte(): any[] {
    return this.pedidos.map((pedido) => {
      const fila: any = {
        Código: pedido.codigo,
        'Fecha Registro': this.formatearFecha(pedido.fecha_registro),
        'Fecha Entrega': pedido.fecha_entrega
          ? this.formatearFecha(pedido.fecha_entrega)
          : 'N/A',
        Total: `$${Number(pedido.total_pedido).toFixed(2)}`,
        'Estado Pedido': pedido.pedido_estado?.estado || 'N/A',
        'Estado Pago': pedido.pagos?.[0]?.pago_estado?.pago_estado || 'N/A',
      };

      if (this.opciones.incluir_nombre_cliente) {
        fila['Cliente'] = pedido.cliente?.nombre_completo || 'N/A';
      }

      if (this.opciones.incluir_correo_cliente) {
        fila['Correo'] = pedido.cliente?.usuario?.correo_electronico || 'N/A';
      }

      if (this.opciones.incluir_telefono_cliente) {
        fila['Teléfono'] = pedido.cliente?.telefono || 'N/A';
      }

      if (this.opciones.incluir_detalles_pedido) {
        fila['Detalles'] = pedido.detalles_pedido || 'N/A';
      }

      return fila;
    });
  }

  descargarTicket(pedido: Pedido): void {
    Swal.fire({
      title: 'Opciones del ticket',
      html: `
        <div style="text-align: left; padding: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem;">
            <input type="checkbox" id="opt_descripcion"> Incluir descripción de productos
          </label>
          <label style="display: block; margin-bottom: 0.5rem;">
            <input type="checkbox" id="opt_detalles"> Incluir detalles de productos
          </label>
          <label style="display: block; margin-bottom: 0.5rem;">
            <input type="checkbox" id="opt_calificaciones"> Incluir calificaciones
          </label>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Descargar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#5B9A97',
      cancelButtonColor: '#7A8A8B',
      preConfirm: () => {
        return {
          incluir_descripcion_producto: (
            document.getElementById('opt_descripcion') as HTMLInputElement
          ).checked,
          incluir_detalles_producto: (
            document.getElementById('opt_detalles') as HTMLInputElement
          ).checked,
          incluir_calificaciones: (
            document.getElementById('opt_calificaciones') as HTMLInputElement
          ).checked,
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        this.generarTicketCSV(pedido, result.value);
      }
    });
  }

  generarTicketCSV(pedido: Pedido, opciones: OpcionesTicket): void {
    this.pedidoService.generarTicket(pedido.id, opciones).subscribe({
      next: (pedidoCompleto) => {
        const datos = this.prepararDatosTicket(pedidoCompleto, opciones);

        const worksheet = XLSX.utils.json_to_sheet(datos);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ticket');

        const csvOutput = XLSX.write(workbook, {
          bookType: 'csv',
          type: 'array',
        });
        const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });

        const nombreArchivo = `ticket_${pedido.codigo}.csv`;
        saveAs(blob, nombreArchivo);

        Swal.fire({
          icon: 'success',
          title: 'Ticket descargado',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el ticket',
          confirmButtonColor: '#5B9A97',
        });
      },
    });
  }

  prepararDatosTicket(pedido: Pedido, opciones: OpcionesTicket): any[] {
    const datos: any[] = [];

    // Encabezado
    datos.push({ TICKET: '=== DATOS DEL CLIENTE ===' });
    datos.push({
      TICKET: `Nombre: ${pedido.cliente?.nombre_completo || 'N/A'}`,
    });
    datos.push({
      TICKET: `Correo: ${pedido.cliente?.usuario?.correo_electronico || 'N/A'}`,
    });
    datos.push({ TICKET: `Teléfono: ${pedido.cliente?.telefono || 'N/A'}` });

    if (pedido.detalles_pedido) {
      datos.push({ TICKET: `Detalles: ${pedido.detalles_pedido}` });
    }

    datos.push({ TICKET: '' });
    datos.push({ TICKET: '=== PRODUCTOS ===' });

    // Productos
    pedido.pedido_productos?.forEach((item) => {
      const subtotal = Number(item.cantidad) * Number(item.precio_unitario);

      const fila: any = {
        'ID Pedido': pedido.id,
        Cantidad: item.cantidad,
        Producto: item.producto?.nombre || 'N/A',
        'Precio Unitario': `$${Number(item.precio_unitario).toFixed(2)}`,
        Subtotal: `$${subtotal.toFixed(2)}`,
      };

      if (opciones.incluir_descripcion_producto) {
        fila['Descripción'] = item.producto?.descripcion || 'N/A';
      }

      if (opciones.incluir_detalles_producto) {
        fila['Detalles'] = item.detalles_producto || 'N/A';
      }

      if (opciones.incluir_calificaciones) {
        const calificacion = pedido.producto_calificaciones?.find(
          (c) => c.producto_id === item.producto_id
        );
        fila['Calificación'] = calificacion
          ? `${calificacion.resena}/5`
          : 'Sin calificar';
        fila['Comentario'] = calificacion?.comentario || 'N/A';
      }

      datos.push(fila);
    });

    // Total
    datos.push({ TICKET: '' });
    datos.push({
      TICKET: `TOTAL DEL PEDIDO: $${Number(pedido.total_pedido).toFixed(2)}`,
    });

    return datos;
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  obtenerFechaActual(): string {
    const ahora = new Date();
    return `${ahora.getFullYear()}/${(ahora.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${ahora.getDate().toString().padStart(2, '0')}   ${ahora
      .getHours()
      .toString()
      .padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
  }

  obtenerNombreMetodoPago(id?: number): string {
    if (!id) return 'Todos';
    const metodo = this.metodosPago.find((m) => m.id.toString() === id.toString());
    //return id === 1 ? 'Tarjeta' : 'Efectivo';
    return metodo?.pago_metodo || 'N/A';
  }

  obtenerNombreEstadoPedido2(id?: number): string {
    if (!id) return 'Todos';
    console.log('id estado pediddo:', id);
    let estado = id.toString();

    switch (id.toString()) {
      case '1':
        return (estado = 'Pendiente');
      case '2':
        return (estado = 'En Proceso');
      case '3':
        return (estado = 'Listo');
      case '4':
        return (estado = 'Entregado');
      case '5':
        return (estado = 'Cancelado');
      case '6':
        return (estado = 'Rechazado');
      default:
        return estado;
    }
    //return estado?.estado || 'N/A';
  }

  obtenerNombreEstadoPedido(id?: number): string {
    if (!id) return 'Todos';
    const estado = this.estadosPedido.find((e) => e.id.toString() === id.toString());
    return estado?.estado || 'N/A';
  }

  obtenerNombreArea(id?: number): string {
    if (!id) return 'Todas';
    const area = this.areasVenta.find((a) => a.id === id);
    return area?.area_venta || 'N/A';
  }
}
