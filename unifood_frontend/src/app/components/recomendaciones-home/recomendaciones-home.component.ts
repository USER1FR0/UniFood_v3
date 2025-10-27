import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecomendacionService } from '../../services/recomendacion.service';
import { PedidoService } from '../../services/pedido.service';
import { ModalAgregarProductoComponent } from '../modal-agregar-producto/modal-agregar-producto.component';
import { Producto } from '../../models/producto.model';
import {
  Recomendacion,
  TipoRecomendacion,
  TipoInteraccion,
} from '../../models/recomendacion.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recomendaciones-home',
  standalone: true,
  imports: [CommonModule, ModalAgregarProductoComponent],
  templateUrl: './recomendaciones-home.component.html',
  styleUrls: ['./recomendaciones-home.component.scss'],
})
export class RecomendacionesHomeComponent implements OnInit, OnDestroy {
  recomendaciones: Recomendacion[] = [];
  recomendacionesPorTipo: Map<TipoRecomendacion, Recomendacion[]> = new Map();
  cargando = false;
  error: string | null = null;
  private refreshInterval: any;

  // Modal agregar al carrito
  productoParaAgregar: any = null;
  recomendacionSeleccionada: Recomendacion | null = null;
  mostrarModalAgregar = false;

  // Placeholder SVG embebido para productos sin imagen
  readonly placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%235B9A97' width='400' height='300'/%3E%3Cg fill='%23FFFFFF' opacity='0.3'%3E%3Cpath d='M200 80c-33.1 0-60 26.9-60 60s26.9 60 60 60 60-26.9 60-60-26.9-60-60-60zm0 100c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z'/%3E%3Cpath d='M200 120c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 30c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z'/%3E%3Ccircle cx='160' cy='120' r='8'/%3E%3Ccircle cx='240' cy='120' r='8'/%3E%3Cpath d='M200 160c-16.5 0-30 13.5-30 30h10c0-11 9-20 20-20s20 9 20 20h10c0-16.5-13.5-30-30-30z'/%3E%3C/g%3E%3Ctext x='200' y='260' font-family='Arial, sans-serif' font-size='24' fill='%23FFFFFF' text-anchor='middle' font-weight='bold'%3EUniFood%3C/text%3E%3C/svg%3E`;

  // Tipos de recomendaciones disponibles
  tiposRecomendacion = [
    {
      tipo: TipoRecomendacion.MAS_VENDIDO,
      titulo: 'Más Vendidos',
      icono: 'fa-fire',
      color: '#E76F51',
    },
    {
      tipo: TipoRecomendacion.MEJOR_CALIFICADO,
      titulo: 'Mejor Calificados',
      icono: 'fa-star',
      color: '#6BBF59',
    },
    {
      tipo: TipoRecomendacion.OFERTA,
      titulo: 'Ofertas Especiales',
      icono: 'fa-tag',
      color: '#F4A261',
    },
    {
      tipo: TipoRecomendacion.MANUAL,
      titulo: 'Destacados del Chef',
      icono: 'fa-crown',
      color: '#5B9A97',
    },
  ];

  constructor(
    private recomendacionService: RecomendacionService,
    private pedidoService: PedidoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarRecomendaciones();
    
    // Auto-refresh cada 30 segundos para detectar cambios del supervisor
    this.refreshInterval = setInterval(() => {
      this.cargarRecomendaciones();
    }, 300000);
  }

  ngOnDestroy(): void {
    // Limpiar el intervalo cuando se destruye el componente
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Cargar todas las recomendaciones públicas
   */
  cargarRecomendaciones(): void {
    if (this.cargando) return;
    
    this.cargando = true;
    this.error = null;

    this.recomendacionService
      .obtenerRecomendacionesPublicas({ limit: 20 })
      .subscribe({
        next: (recomendaciones) => {
          console.log('Recomendaciones cargadas:', recomendaciones); // Debug
          this.recomendaciones = recomendaciones;
          this.agruparPorTipo();
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar recomendaciones:', error); // Debug
          this.error = 'No se pudieron cargar las recomendaciones';
          this.cargando = false;
        },
      });
  }

  /**
   * Refrescar recomendaciones manualmente
   */
  refrescarRecomendaciones(): void {
    this.cargarRecomendaciones();
  }

  /**
   * Agrupar recomendaciones por tipo
   */
  private agruparPorTipo(): void {
    this.recomendacionesPorTipo.clear();

    this.recomendaciones.forEach((rec) => {
      const tipo = rec.tipo_recomendacion;
      if (!this.recomendacionesPorTipo.has(tipo)) {
        this.recomendacionesPorTipo.set(tipo, []);
      }
      this.recomendacionesPorTipo.get(tipo)!.push(rec);
    });
  }

  /**
   * Obtener recomendaciones de un tipo específico
   */
  obtenerRecomendacionesTipo(tipo: TipoRecomendacion): Recomendacion[] {
    return this.recomendacionesPorTipo.get(tipo) || [];
  }

  /**
   * Manejar click en una recomendación
   */
  onClickRecomendacion(recomendacion: Recomendacion): void {
    // Registrar interacción
    this.registrarInteraccion(recomendacion.id, TipoInteraccion.CLICK);

    // Navegar al detalle del producto
    if (recomendacion.producto) {
      this.router.navigate(['/cliente/productos', recomendacion.producto.id]);
    }
  }

  /**
   * Registrar vista de recomendación
   */
  onVistaRecomendacion(recomendacion: Recomendacion): void {
    this.registrarInteraccion(recomendacion.id, TipoInteraccion.VISTA);
  }

  /**
   * Registrar interacción con el backend
   */
  private registrarInteraccion(
    recomendacionId: number,
    tipo: TipoInteraccion
  ): void {
    // TODO: Obtener cliente_id del servicio de auth
    const clienteId = null;

    this.recomendacionService
      .registrarInteraccion({
        recomendacion_id: recomendacionId,
        cliente_id: clienteId || undefined,
        tipo_interaccion: tipo,
      })
      .subscribe({
        next: () => {
          // Interacción registrada exitosamente
        },
        error: (error) => {
          console.error('Error al registrar interacción:', error);
        },
      });
  }

  /**
   * Obtener configuración de un tipo de recomendación
   */
  obtenerConfigTipo(tipo: TipoRecomendacion) {
    return (
      this.tiposRecomendacion.find((t) => t.tipo === tipo) ||
      this.tiposRecomendacion[0]
    );
  }

  /**
   * Formatear precio
   */
  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(precio);
  }

  /**
   * Formatear calificación (maneja strings y números)
   */
  formatearCalificacion(calificacion: any): string {
    // Convertir a número si es string
    const numero = typeof calificacion === 'string' 
      ? parseFloat(calificacion) 
      : calificacion;
    
    // Validar que sea un número válido
    if (isNaN(numero)) {
      return '0.0';
    }
    
    return numero.toFixed(1);
  }

  /**
   * Extraer solo el número del precio para el badge circular
   */
  extraerNumero(precio: any): string {
    if (!precio) return '0';
    
    // Convertir a string y extraer solo números
    const precioStr = precio.toString();
    const numero = precioStr.replace(/[^0-9]/g, '');
    
    return numero || '0';
  }

  /**
   * Obtener imagen del producto o placeholder
   */
  obtenerImagenProducto(producto: any): string {
    return producto?.imagen_url || this.placeholderImage;
  }

  /**
   * Manejar error de carga de imagen
   */
  onImageError(event: any): void {
    if (event.target.src !== this.placeholderImage) {
      event.target.src = this.placeholderImage;
    }
  }

  /**
   * Abrir modal para agregar producto al carrito
   */
  agregarAlCarrito(recomendacion: Recomendacion, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const producto = recomendacion.producto;
    if (!producto) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Producto no disponible',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
      return;
    }

    this.productoParaAgregar = producto;
    this.recomendacionSeleccionada = recomendacion;
    this.mostrarModalAgregar = true;
  }

  /**
   * Cerrar modal de agregar
   */
  cerrarModalAgregar(): void {
    this.mostrarModalAgregar = false;
    this.productoParaAgregar = null;
    this.recomendacionSeleccionada = null;
  }

  /**
   * Procesar adición al carrito con cantidad y detalles
   */
  procesarAgregarAlCarrito(datos: { producto: any; cantidad: number; detalles?: string }): void {
    if (this.recomendacionSeleccionada) {
      // Registrar interacción de agregar al carrito
      this.registrarInteraccion(this.recomendacionSeleccionada.id, TipoInteraccion.AGREGADO_CARRITO);
    }

    // Agregar al carrito
    this.pedidoService.agregarAlCarritoDesdeApi(datos.producto.id, datos.cantidad, datos.detalles).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: '¡Agregado!',
          text: `${datos.cantidad}x ${datos.producto.nombre} agregado al carrito`,
          timer: 1500,
          showConfirmButton: false,
          position: 'top-end',
          toast: true
        });
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo agregar el producto',
          timer: 2000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true
        });
      }
    });
  }
}

