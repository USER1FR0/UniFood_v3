import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecomendacionService } from '../../services/recomendacion.service';
import {
  Recomendacion,
  TipoRecomendacion,
  TipoInteraccion,
} from '../../models/recomendacion.model';

@Component({
  selector: 'app-recomendaciones-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recomendaciones-home.component.html',
  styleUrls: ['./recomendaciones-home.component.scss'],
})
export class RecomendacionesHomeComponent implements OnInit {
  recomendaciones: Recomendacion[] = [];
  recomendacionesPorTipo: Map<TipoRecomendacion, Recomendacion[]> = new Map();
  cargando = false; // ⚠️ Cambiar de true a false
  error: string | null = null;

  // Tipos de recomendaciones disponibles
  tiposRecomendacion = [
    {
      tipo: TipoRecomendacion.MAS_VENDIDO,
      titulo: 'Más Vendidos 🔥',
      icono: '🔥',
      color: '#ff6b6b',
    },
    {
      tipo: TipoRecomendacion.MEJOR_CALIFICADO,
      titulo: 'Mejor Calificados ⭐',
      icono: '⭐',
      color: '#51cf66',
    },
    {
      tipo: TipoRecomendacion.OFERTA,
      titulo: 'Ofertas Especiales 💰',
      icono: '💰',
      color: '#ffd43b',
    },
    {
      tipo: TipoRecomendacion.MANUAL,
      titulo: 'Destacados 📌',
      icono: '📌',
      color: '#748ffc',
    },
  ];

  constructor(
    private recomendacionService: RecomendacionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarRecomendaciones();
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
          this.recomendaciones = recomendaciones;
          this.agruparPorTipo();
          this.cargando = false;
        },
        error: () => {
          this.error = 'No se pudieron cargar las recomendaciones';
          this.cargando = false;
        },
      });
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
}
