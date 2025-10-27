import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecomendacionService } from '../../services/recomendacion.service';
import {
  Recomendacion,
  TipoRecomendacion,
  CrearRecomendacionDto,
  ActualizarRecomendacionDto,
  ResumenRecomendaciones,
  EstadisticasInteraccion,
} from '../../models/recomendacion.model';

@Component({
  selector: 'app-supervisor-recomendaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supervisor-recomendaciones.component.html',
  styleUrls: ['./supervisor-recomendaciones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupervisorRecomendacionesComponent implements OnInit {
  recomendaciones: Recomendacion[] = [];
  resumen: ResumenRecomendaciones | null = null;
  estadisticas: Map<number, EstadisticasInteraccion> = new Map();
  
  cargando = false;
  error: string | null = null;
  mensaje: string | null = null;

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

  constructor(
    private recomendacionService: RecomendacionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.inicializado) {
      this.inicializado = true;
      this.cargarDatos();
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
    if (!confirm('¿Generar recomendaciones automáticas de más vendidos?')) {
      return;
    }

    if (this.cargando) return;

    this.cargando = true;
    this.recomendacionService.generarMasVendidos(5).subscribe({
      next: () => {
        this.mostrarMensaje('Recomendaciones de más vendidos generadas', 'success');
        this.cargando = false;
        // Recargar datos después de un pequeño delay
        setTimeout(() => this.cargarDatos(), 300);
      },
      error: () => {
        this.mostrarMensaje('Error al generar recomendaciones', 'error');
        this.cargando = false;
      },
    });
  }

  generarMejorCalificados(): void {
    if (!confirm('¿Generar recomendaciones automáticas de mejor calificados?')) {
      return;
    }

    if (this.cargando) return;

    this.cargando = true;
    this.recomendacionService.generarMejorCalificados(5).subscribe({
      next: () => {
        this.mostrarMensaje('Recomendaciones de mejor calificados generadas', 'success');
        this.cargando = false;
        // Recargar datos después de un pequeño delay
        setTimeout(() => this.cargarDatos(), 300);
      },
      error: () => {
        this.mostrarMensaje('Error al generar recomendaciones', 'error');
        this.cargando = false;
      },
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
}

