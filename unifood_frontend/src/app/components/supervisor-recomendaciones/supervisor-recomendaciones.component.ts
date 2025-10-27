import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecomendacionService } from '../../services/recomendacion.service';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import {
  Recomendacion,
  TipoRecomendacion,
  CrearRecomendacionDto,
  ActualizarRecomendacionDto,
  ResumenRecomendaciones,
  EstadisticasInteraccion,
} from '../../models/recomendacion.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-supervisor-recomendaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supervisor-recomendaciones.component.html',
  styleUrls: ['./supervisor-recomendaciones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupervisorRecomendacionesComponent implements OnInit, OnDestroy {
  recomendaciones: Recomendacion[] = [];
  resumen: ResumenRecomendaciones | null = null;
  estadisticas: Map<number, EstadisticasInteraccion> = new Map();
  
  cargando = false;
  error: string | null = null;
  mensaje: string | null = null;
  chatbotDisponible = false; // Estado del microservicio del chatbot (inicia en false hasta verificar)
  verificandoChatbot = false; // Loading del estado del chatbot

  // Vista actual
  vistaActual: 'lista' | 'estadisticas' | 'crear' = 'lista';

  // Filtros (privados para controlar cambios)
  private _filtroTipo: TipoRecomendacion | 'todos' = 'todos';
  private _filtroActivo: boolean | 'todos' = 'todos';
  private _recomendacionesFiltradas: Recomendacion[] = [];

  // Recomendación seleccionada para editar
  recomendacionEditando: Recomendacion | null = null;

  // Enums para el template
  TipoRecomendacion = TipoRecomendacion;

  // Flag para prevenir múltiples cargas
  private inicializado = false;
  
  // Intervalo para verificar el chatbot periódicamente
  private chatbotCheckInterval: any;

  // Modal de catálogo de productos
  mostrarModalCatalogo = false;
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  busquedaProducto = '';
  productoSeleccionado: Producto | null = null;
  
  // Paginación
  paginaActual = 1;
  productosPorPagina = 20;
  totalPaginas = 1;
  productosPaginados: Producto[] = [];
  
  // Configuración de nueva recomendación
  nuevaRecomendacion: Partial<CrearRecomendacionDto> = {
    tipo_recomendacion: TipoRecomendacion.MANUAL,
    prioridad: 5
  };

  constructor(
    private recomendacionService: RecomendacionService,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.inicializado) {
      this.inicializado = true;
      this.cargarDatos();
      this.verificarEstadoChatbot(); // Verificar disponibilidad del microservicio
      
      // Verificar el chatbot cada 30 segundos
      this.chatbotCheckInterval = setInterval(() => {
        this.verificarEstadoChatbot();
      }, 30000); // 30 segundos
    }
  }

  ngOnDestroy(): void {
    // Limpiar el intervalo cuando el componente se destruye
    if (this.chatbotCheckInterval) {
      clearInterval(this.chatbotCheckInterval);
    }
  }

  // ============================================
  // CARGA DE DATOS
  // ============================================

  cargarDatos(): void {
    if (this.cargando) return;
    
    this.cargando = true;
    this.error = null;
    this.cdr.markForCheck();

    Promise.all([
      this.cargarRecomendaciones(),
      this.cargarResumen(),
    ])
      .then(() => {
        this.cargando = false;
        this.cdr.markForCheck();
      })
      .catch((error) => {
        this.error = 'Error al cargar los datos';
        this.cargando = false;
        this.cdr.markForCheck();
      });
  }

  cargarRecomendaciones(): Promise<void> {
    return new Promise((resolve) => {
      this.recomendacionService.obtenerTodasRecomendaciones().subscribe({
        next: (recomendaciones) => {
          this.recomendaciones = recomendaciones;
          this.actualizarFiltros();
          resolve();
        },
        error: () => {
          resolve();
        },
      });
    });
  }

  cargarResumen(): Promise<void> {
    return new Promise((resolve) => {
      this.recomendacionService.obtenerResumen().subscribe({
        next: (resumen) => {
          this.resumen = resumen;
          resolve();
        },
        error: () => {
          resolve();
        },
      });
    });
  }

  cargarEstadisticas(id: number): void {
    this.recomendacionService.obtenerEstadisticas(id).subscribe({
      next: (stats) => {
        this.estadisticas.set(id, stats);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      },
    });
  }

  // ============================================
  // OPERACIONES CRUD
  // ============================================

  actualizarRecomendacion(id: number, cambios: Partial<ActualizarRecomendacionDto>): void {
    this.recomendacionService.actualizarRecomendacion(id, cambios).subscribe({
      next: () => {
        this.mostrarMensaje('Recomendación actualizada exitosamente', 'success');
        // Actualizar solo el item cambiado en lugar de recargar todo
        const index = this.recomendaciones.findIndex(r => r.id === id);
        if (index !== -1) {
          this.recomendaciones[index] = { 
            ...this.recomendaciones[index], 
            ...cambios as Partial<Recomendacion>
          };
          this.actualizarFiltros();
        }
      },
      error: () => {
        this.mostrarMensaje('Error al actualizar la recomendación', 'error');
      },
    });
  }

  eliminarRecomendacion(id: number): void {
    if (!confirm('¿Estás seguro de eliminar esta recomendación?')) {
      return;
    }

    this.recomendacionService.eliminarRecomendacion(id).subscribe({
      next: () => {
        this.mostrarMensaje('Recomendación eliminada exitosamente', 'success');
        // Eliminar del array sin recargar
        this.recomendaciones = this.recomendaciones.filter(r => r.id !== id);
        this.cdr.markForCheck();
      },
      error: () => {
        this.mostrarMensaje('Error al eliminar la recomendación', 'error');
      },
    });
  }

  toggleActivo(recomendacion: Recomendacion): void {
    const nuevoEstado = !recomendacion.activo;
    // Actualizar localmente primero para respuesta instantánea
    recomendacion.activo = nuevoEstado;
    this.cdr.markForCheck();
    
    // Luego actualizar en el backend
    this.recomendacionService.actualizarRecomendacion(recomendacion.id, {
      activo: nuevoEstado,
    }).subscribe({
      next: () => {
        this.mostrarMensaje('Estado actualizado', 'success');
      },
      error: () => {
        // Revertir en caso de error
        recomendacion.activo = !nuevoEstado;
        this.cdr.markForCheck();
        this.mostrarMensaje('Error al actualizar', 'error');
      },
    });
  }

  // ============================================
  // GENERACIÓN AUTOMÁTICA
  // ============================================

  generarMasVendidos(): void {
    // Verificar si el chatbot está disponible
    if (!this.chatbotDisponible) {
      this.mostrarErrorChatbotNoDisponible();
      return;
    }

    Swal.fire({
      icon: 'question',
      title: '¿Generar Más Vendidos?',
      text: 'Esto generará recomendaciones automáticas basadas en los productos con más ventas usando el microservicio de IA',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-fire"></i> Generar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#5B9A97',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.cargando) return;

        this.cargando = true;
        
        Swal.fire({
          title: 'Generando...',
          html: '<i class="fas fa-fire fa-spin" style="font-size: 3rem; color: #5B9A97;"></i><br><br>Analizando productos más vendidos',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        this.recomendacionService.generarMasVendidos(5).subscribe({
          next: () => {
            this.cargando = false;
            Swal.fire({
              icon: 'success',
              title: '¡Recomendaciones Generadas!',
              text: 'Se han creado las recomendaciones de productos más vendidos exitosamente',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#5B9A97'
            });
            // Recargar datos después de un pequeño delay
            setTimeout(() => this.cargarDatos(), 300);
          },
          error: () => {
            this.cargando = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron generar las recomendaciones. Por favor, intenta de nuevo.',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#5B9A97'
            });
          },
        });
      }
    });
  }

  generarMejorCalificados(): void {
    // Verificar si el chatbot está disponible
    if (!this.chatbotDisponible) {
      this.mostrarErrorChatbotNoDisponible();
      return;
    }

    Swal.fire({
      icon: 'question',
      title: '¿Generar Mejor Calificados?',
      text: 'Esto generará recomendaciones automáticas basadas en los productos con mejores calificaciones usando el microservicio de IA',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-star"></i> Generar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#5B9A97',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.cargando) return;

        this.cargando = true;
        
        Swal.fire({
          title: 'Generando...',
          html: '<i class="fas fa-star fa-spin" style="font-size: 3rem; color: #5B9A97;"></i><br><br>Analizando productos mejor calificados',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        this.recomendacionService.generarMejorCalificados(5).subscribe({
          next: () => {
            this.cargando = false;
            Swal.fire({
              icon: 'success',
              title: '¡Recomendaciones Generadas!',
              text: 'Se han creado las recomendaciones de productos mejor calificados exitosamente',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#5B9A97'
            });
            // Recargar datos después de un pequeño delay
            setTimeout(() => this.cargarDatos(), 300);
          },
          error: () => {
            this.cargando = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron generar las recomendaciones. Por favor, intenta de nuevo.',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#5B9A97'
            });
          },
        });
      }
    });
  }

  /**
   * Generar recomendaciones usando IA del Chatbot
   * Este método usa el microservicio del chatbot para análisis más precisos
   */
  generarConIA(): void {
    // Verificar si el chatbot está disponible
    if (!this.chatbotDisponible) {
      this.mostrarErrorChatbotNoDisponible();
      return;
    }

    Swal.fire({
      icon: 'question',
      title: '¿Generar Recomendaciones con IA?',
      html: `
        <p>Esto analizará los datos con Inteligencia Artificial y creará recomendaciones más precisas basadas en:</p>
        <ul style="text-align: left; margin: 1rem auto; max-width: 400px;">
          <li>📊 Patrones de ventas</li>
          <li>⭐ Calificaciones de usuarios</li>
          <li>🎯 Preferencias detectadas</li>
        </ul>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-robot"></i> Generar con IA',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.cargando) return;

        this.cargando = true;
        
        // Mostrar loading
        Swal.fire({
          title: 'Generando con IA...',
          html: '<i class="fas fa-robot fa-spin" style="font-size: 3rem; color: #667eea;"></i><br><br>Analizando datos con el Chatbot',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Llamar al nuevo endpoint que usa el chatbot
        this.recomendacionService.generarRecomendacionesConIA(10).subscribe({
          next: (response: any) => {
            const totalGeneradas = 
              (response.masVendidos?.length || 0) + 
              (response.mejorCalificados?.length || 0);
            
            this.cargando = false;
            
            Swal.fire({
              icon: 'success',
              title: '¡Recomendaciones IA Generadas!',
              html: `
                <p>Se han generado <strong>${totalGeneradas} recomendaciones</strong> usando Inteligencia Artificial</p>
                <div style="margin-top: 1rem; display: flex; justify-content: center; gap: 1rem;">
                  <div style="padding: 0.5rem 1rem; background: #f0f0f0; border-radius: 8px;">
                    <strong>${response.masVendidos?.length || 0}</strong> Más Vendidos
                  </div>
                  <div style="padding: 0.5rem 1rem; background: #f0f0f0; border-radius: 8px;">
                    <strong>${response.mejorCalificados?.length || 0}</strong> Mejor Calificados
                  </div>
                </div>
              `,
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#5B9A97'
            });
            
            // Recargar datos
            setTimeout(() => this.cargarDatos(), 500);
          },
          error: (error) => {
            console.error('Error al generar con IA:', error);
            this.cargando = false;
            
            Swal.fire({
              icon: 'error',
              title: 'Error al Generar con IA',
              html: `
                <p>No se pudo conectar con el microservicio del Chatbot</p>
                <small style="color: #666;">Verifica que esté activo en el puerto 6000</small>
              `,
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#5B9A97'
            });
          },
        });
      }
    });
  }

  // ============================================
  // FILTROS Y BÚSQUEDA
  // ============================================

  get filtroTipo(): TipoRecomendacion | 'todos' {
    return this._filtroTipo;
  }

  set filtroTipo(value: TipoRecomendacion | 'todos') {
    this._filtroTipo = value;
    this.actualizarFiltros();
  }

  get filtroActivo(): boolean | 'todos' {
    return this._filtroActivo;
  }

  set filtroActivo(value: boolean | 'todos') {
    this._filtroActivo = value;
    this.actualizarFiltros();
  }

  get recomendacionesFiltradas(): Recomendacion[] {
    return this._recomendacionesFiltradas;
  }

  private actualizarFiltros(): void {
    this._recomendacionesFiltradas = this.recomendaciones.filter((rec) => {
      // Filtro por tipo
      if (this._filtroTipo !== 'todos' && rec.tipo_recomendacion !== this._filtroTipo) {
        return false;
      }

      // Filtro por activo
      if (this._filtroActivo !== 'todos' && rec.activo !== this._filtroActivo) {
        return false;
      }

      return true;
    });
    this.cdr.markForCheck();
  }

  // ============================================
  // UTILIDADES
  // ============================================

  obtenerEtiquetaTipo(tipo: TipoRecomendacion): string {
    return this.recomendacionService.obtenerEtiquetaTipo(tipo);
  }

  obtenerColorTipo(tipo: TipoRecomendacion): string {
    return this.recomendacionService.obtenerColorTipo(tipo);
  }

  obtenerIconoTipo(tipo: TipoRecomendacion): string {
    return this.recomendacionService.obtenerIconoTipo(tipo);
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(precio);
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error'): void {
    this.mensaje = texto;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.mensaje = null;
      this.cdr.markForCheck();
    }, 3000);
  }

  cambiarVista(vista: 'lista' | 'estadisticas' | 'crear'): void {
    this.vistaActual = vista;
    this.cdr.markForCheck();
  }

  obtenerCantidadPorTipo(tipo: TipoRecomendacion): number {
    return this.resumen?.por_tipo.find((t) => t.tipo === tipo)?.cantidad || 0;
  }

  // TrackBy para optimizar el *ngFor y evitar parpadeos
  trackByRecomendacionId(index: number, item: Recomendacion): number {
    return item.id;
  }

  // ============================================
  // CATÁLOGO DE PRODUCTOS
  // ============================================

  /**
   * Abrir modal del catálogo de productos
   */
  abrirCatalogoProductos(): void {
    this.mostrarModalCatalogo = true;
    this.busquedaProducto = '';
    this.productoSeleccionado = null;
    this.cargarProductos();
    this.cdr.markForCheck();
  }

  /**
   * Cerrar modal del catálogo
   */
  cerrarCatalogo(): void {
    this.mostrarModalCatalogo = false;
    this.productoSeleccionado = null;
    this.busquedaProducto = '';
    this.cdr.markForCheck();
  }

  /**
   * Cargar todos los productos disponibles
   */
  cargarProductos(): void {
    this.productoService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos.filter(p => p.estado === true); // Solo activos
        this.productosFiltrados = this.productos;
        this.paginaActual = 1;
        this.actualizarPaginacion();
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.mostrarMensaje('Error al cargar productos', 'error');
      }
    });
  }

  /**
   * Filtrar productos por búsqueda
   */
  filtrarProductos(): void {
    const busqueda = this.busquedaProducto.toLowerCase().trim();
    
    if (!busqueda) {
      this.productosFiltrados = this.productos;
    } else {
      this.productosFiltrados = this.productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda) ||
        p.descripcion?.toLowerCase().includes(busqueda)
      );
    }
    
    this.paginaActual = 1; // Resetear a la primera página
    this.actualizarPaginacion();
  }

  /**
   * Actualizar paginación
   */
  actualizarPaginacion(): void {
    this.totalPaginas = Math.ceil(this.productosFiltrados.length / this.productosPorPagina);
    const inicio = (this.paginaActual - 1) * this.productosPorPagina;
    const fin = inicio + this.productosPorPagina;
    this.productosPaginados = this.productosFiltrados.slice(inicio, fin);
    this.cdr.markForCheck();
  }

  /**
   * Ir a la página anterior
   */
  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarPaginacion();
    }
  }

  /**
   * Ir a la página siguiente
   */
  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.actualizarPaginacion();
    }
  }

  /**
   * Ir a una página específica
   */
  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
    }
  }

  /**
   * Seleccionar producto del catálogo
   */
  seleccionarProducto(producto: Producto): void {
    this.productoSeleccionado = producto;
    this.nuevaRecomendacion.producto_id = producto.id;
    this.cdr.markForCheck();
  }

  /**
   * Crear recomendación manual desde el catálogo
   */
  crearRecomendacionDesdeProducto(): void {
    if (!this.productoSeleccionado) {
      this.mostrarMensaje('Selecciona un producto primero', 'error');
      return;
    }

    if (!this.nuevaRecomendacion.tipo_recomendacion) {
      this.mostrarMensaje('Selecciona un tipo de recomendación', 'error');
      return;
    }

    const dto: CrearRecomendacionDto = {
      producto_id: this.productoSeleccionado.id,
      tipo_recomendacion: this.nuevaRecomendacion.tipo_recomendacion as TipoRecomendacion,
      prioridad: this.nuevaRecomendacion.prioridad || 5,
      fecha_inicio: this.nuevaRecomendacion.fecha_inicio,
      fecha_fin: this.nuevaRecomendacion.fecha_fin,
      metadata: {
        creado_manualmente: true,
        producto_nombre: this.productoSeleccionado.nombre
      }
    };

    this.recomendacionService.crearRecomendacion(dto).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: '¡Recomendación Creada!',
          text: `La recomendación de "${this.productoSeleccionado?.nombre}" ha sido creada exitosamente`,
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#5B9A97'
        });
        this.cerrarCatalogo();
        this.cargarDatos();
        
        // Resetear formulario
        this.nuevaRecomendacion = {
          tipo_recomendacion: TipoRecomendacion.MANUAL,
          prioridad: 5
        };
      },
      error: (error) => {
        console.error('Error al crear recomendación:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear la recomendación. Por favor, intenta de nuevo.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#5B9A97'
        });
      }
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Verificar si una recomendación fue generada por IA (chatbot)
   */
  esRecomendacionIA(recomendacion: Recomendacion): boolean {
    return recomendacion.metadata?.generado_por_chatbot === true;
  }

  /**
   * Obtener badge de recomendación
   */
  obtenerBadgeRecomendacion(recomendacion: Recomendacion): string {
    if (this.esRecomendacionIA(recomendacion)) {
      return '🤖 IA';
    }
    if (recomendacion.metadata?.creado_manualmente) {
      return '👤 Manual';
    }
    return '📊 Auto';
  }

  /**
   * Obtener color de badge
   */
  obtenerColorBadge(recomendacion: Recomendacion): string {
    if (this.esRecomendacionIA(recomendacion)) {
      return '#667eea'; // Púrpura para IA
    }
    if (recomendacion.metadata?.creado_manualmente) {
      return '#5B9A97'; // Verde-azul para manual
    }
    return '#7A8A8B'; // Gris para automático
  }

  /**
   * Verificar si el microservicio del chatbot está disponible
   */
  verificarEstadoChatbot(): void {
    this.verificandoChatbot = true;
    this.recomendacionService.verificarEstadoChatbot().subscribe({
      next: (response: any) => {
        this.chatbotDisponible = response?.chatbot_disponible === true;
        this.verificandoChatbot = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al verificar disponibilidad del chatbot:', error.message || error);
        this.chatbotDisponible = false;
        this.verificandoChatbot = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Mostrar modal de error cuando el chatbot no está disponible
   */
  mostrarErrorChatbotNoDisponible(): void {
    Swal.fire({
      icon: 'error',
      title: 'Microservicio No Disponible',
      html: `
        <p>El microservicio del chatbot no está conectado.</p>
        <hr style="margin: 1rem 0;">
        <div style="text-align: left; padding: 0 1rem;">
          <strong>Para activarlo:</strong>
          <ol style="margin-top: 0.5rem;">
            <li>Abre una terminal</li>
            <li>Navega a: <code>unifood_micro_chatbot</code></li>
            <li>Ejecuta: <code>npm run start:dev</code></li>
            <li>Verifica que esté en el puerto <strong>6000</strong></li>
          </ol>
        </div>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#5B9A97',
      footer: '<small>💡 Todos los botones de generación requieren el microservicio activo</small>'
    });
  }
}

