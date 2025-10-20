import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { VendedoresService } from '../../services/vendedores.service';
import { Vendedor } from '../../models/vendedor.model';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lista-vendedores',
  imports: [CommonModule, HttpClientModule],
  templateUrl: './lista-vendedores.component.html',
  styleUrl: './lista-vendedores.component.scss',
})
export class ListaVendedoresComponent implements OnInit {
  vendedores: Vendedor[] = [];
  cargando: boolean = true;
  error: string = '';

  constructor(
    private http: HttpClient,
    private vendedoresService: VendedoresService,
    private router: Router
  ) {}
  ngOnInit() {
    this.cargarVendedores();
  }

  /**
   * Cargar lista de vendedores desde el backend
   */
  cargarVendedores() {
    this.cargando = true;
    this.error = '';

    this.vendedoresService.getVendedores().subscribe({
      next: (data) => {
        this.vendedores = data;
        this.cargando = false;
      },
      error: (error) => {
        this.error = error.message;
        this.cargando = false;

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.error,
          confirmButtonColor: '#52a7a3',
        });
      },
    });
  }

  /**
   * Cambiar estatus de un vendedor (activar/desactivar)
   */
  cambiarEstatus(vendedor: Vendedor) {
    const nuevoEstatus = !vendedor.estatus;
    const accion = nuevoEstatus ? 'activar' : 'desactivar';

    Swal.fire({
      title: `¿${nuevoEstatus ? 'Activar' : 'Desactivar'} vendedor?`,
      text: `Estás a punto de ${accion} a ${vendedor.nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#52a7a3',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.vendedoresService
          .cambiarEstatusVendedor(vendedor.id, nuevoEstatus)
          .subscribe({
            next: (vendedorActualizado) => {
              // Actualizar el vendedor en la lista local
              const index = this.vendedores.findIndex(
                (v) => v.id === vendedor.id
              );
              if (index !== -1) {
                this.vendedores[index] = vendedorActualizado;
              }

              Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: `Vendedor ${accion}do correctamente`,
                confirmButtonColor: '#52a7a3',
                timer: 2000,
              });
            },
            error: (error) => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                confirmButtonColor: '#52a7a3',
              });
            },
          });
      }
    });
  }

  /**
   * Eliminar un vendedor
   */
  eliminarVendedor(vendedor: Vendedor) {
    Swal.fire({
      title: '¿Eliminar vendedor?',
      text: `Esta acción no se puede deshacer. Se eliminará a ${vendedor.nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.vendedoresService.deleteVendedor(vendedor.id).subscribe({
          next: () => {
            // Remover de la lista local
            this.vendedores = this.vendedores.filter(
              (v) => v.id !== vendedor.id
            );

            Swal.fire({
              icon: 'success',
              title: '¡Eliminado!',
              text: 'Vendedor eliminado correctamente',
              confirmButtonColor: '#52a7a3',
              timer: 2000,
            });
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.message,
              confirmButtonColor: '#52a7a3',
            });
          },
        });
      }
    });
  }

  /**
   * Navegar al formulario de creación
   */
  agregarVendedor() {
    this.router.navigate(['/vendedores/nuevo']);
  }

  /**
   * Navegar al formulario de edición
   */
  editarVendedor(vendedor: Vendedor) {
    this.router.navigate(['/vendedores/editar', vendedor.id]);
  }

  /**
   * Reintentar carga en caso de error
   */
  reintentarCarga() {
    this.cargarVendedores();
  }

  /**
   * Utilidades para la vista
   */
  getEstatusTexto(estatus: boolean): string {
    return estatus ? 'Activo' : 'Inactivo';
  }

  getEstatusClase(estatus: boolean): string {
    return estatus ? 'estatus-activo' : 'estatus-inactivo';
  }

  getIniciales(nombre: string): string {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  /**
   * Formatear fecha para mostrar
   */
  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
