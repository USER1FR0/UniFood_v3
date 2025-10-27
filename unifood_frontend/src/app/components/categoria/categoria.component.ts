import { Component, OnInit } from '@angular/core';
import { CategoriaService } from '../../services/categoria.service';
import { Categoria, CreateCategoriaRequest, UpdateCategoriaRequest } from '../../models/categoria.model';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-categoria',
  imports:[CommonModule,FormsModule],
  templateUrl: './categoria.component.html',
  styleUrls: ['./categoria.component.scss']
})
export class CategoriaComponent implements OnInit {
  // Datos
  categorias: Categoria[] = [];
  categoriaSeleccionada: Categoria | null = null;
  
  // Estados
  cargando = true;
  error = '';
  
  // Modales
  mostrarModalCrear = false;
  mostrarModalEditar = false;
  procesando = false;
  
  // Búsqueda
  terminoBusqueda = '';
  
  // Formularios
  nuevaCategoria: CreateCategoriaRequest = {
    nombre: '',
    descripcion: '',
    status: true
  };

  categoriaEditada: UpdateCategoriaRequest = {};

  constructor(private categoriaService: CategoriaService) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.cargando = true;
    this.error = '';
    
    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.cargando = false;
      },
      error: (error) => {
        this.error = error.message;
        this.cargando = false;
        console.error('Error al cargar categorías:', error);
        this.mostrarError('Error al cargar categorías', error.message);
      }
    });
  }

  buscarCategorias() {
    if (this.terminoBusqueda.trim()) {
      this.cargando = true;
      this.categoriaService.buscarCategoriasPorNombre(this.terminoBusqueda).subscribe({
        next: (categorias) => {
          this.categorias = categorias;
          this.cargando = false;
        },
        error: (error) => {
          this.error = error.message;
          this.cargando = false;
          this.mostrarError('Error al buscar categorías', error.message);
        }
      });
    } else {
      this.cargarCategorias();
    }
  }

  abrirModalCrear() {
    this.nuevaCategoria = {
      nombre: '',
      descripcion: '',
      status: true
    };
    this.mostrarModalCrear = true;
  }

  abrirModalEditar(categoria: Categoria) {
    this.categoriaSeleccionada = categoria;
    this.categoriaEditada = {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      status: categoria.status
    };
    this.mostrarModalEditar = true;
  }

  cerrarModales() {
    this.mostrarModalCrear = false;
    this.mostrarModalEditar = false;
    this.categoriaSeleccionada = null;
    this.procesando = false;
  }

  crearCategoria() {
    if (!this.validarFormulario(this.nuevaCategoria)) return;
    
    this.procesando = true;
    
    this.categoriaService.createCategoria(this.nuevaCategoria).subscribe({
      next: (categoria) => {
        this.categorias.push(categoria);
        this.cerrarModales();
        this.mostrarExito(
          '¡Categoría creada!',
          `La categoría "${categoria.nombre}" ha sido creada exitosamente`
        );
      },
      error: (error) => {
        this.error = error.message;
        this.procesando = false;
        this.mostrarError('Error al crear categoría', error.message);
      }
    });
  }

  actualizarCategoria() {
    if (!this.categoriaSeleccionada || !this.validarFormulario(this.categoriaEditada)) return;
    
    this.procesando = true;
    
    this.categoriaService.updateCategoria(
      this.categoriaSeleccionada.id, 
      this.categoriaEditada
    ).subscribe({
      next: (categoriaActualizada) => {
        const index = this.categorias.findIndex(c => c.id === categoriaActualizada.id);
        if (index !== -1) {
          this.categorias[index] = categoriaActualizada;
        }
        this.cerrarModales();
        this.mostrarExito(
          '¡Categoría actualizada!',
          `La categoría "${categoriaActualizada.nombre}" ha sido actualizada exitosamente`
        );
      },
      error: (error) => {
        this.error = error.message;
        this.procesando = false;
        this.mostrarError('Error al actualizar categoría', error.message);
      }
    });
  }

  cambiarStatusCategoria(categoria: Categoria) {
    const nuevoStatus = !categoria.status;
    const accion = nuevoStatus ? 'activar' : 'desactivar';
    
    Swal.fire({
      title: `¿${nuevoStatus ? 'Activar' : 'Desactivar'} categoría?`,
      text: `¿Estás seguro de que deseas ${accion} la categoría "${categoria.nombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#52a7a3',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoriaService.cambiarStatusCategoria(categoria.id, nuevoStatus).subscribe({
          next: (categoriaActualizada) => {
            const index = this.categorias.findIndex(c => c.id === categoriaActualizada.id);
            if (index !== -1) {
              this.categorias[index] = categoriaActualizada;
            }
            this.mostrarExito(
              `¡Categoría ${nuevoStatus ? 'activada' : 'desactivada'}!`,
              `La categoría "${categoriaActualizada.nombre}" ha sido ${nuevoStatus ? 'activada' : 'desactivada'} exitosamente`
            );
          },
          error: (error) => {
            this.error = error.message;
            this.mostrarError('Error al cambiar estado', error.message);
          }
        });
      }
    });
  }

  eliminarCategoria(categoria: Categoria) {
    Swal.fire({
      title: '¿Eliminar categoría?',
      text: `¿Estás seguro de que deseas eliminar la categoría "${categoria.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoriaService.deleteCategoria(categoria.id).subscribe({
          next: () => {
            this.categorias = this.categorias.filter(c => c.id !== categoria.id);
            this.mostrarExito(
              '¡Categoría eliminada!',
              `La categoría "${categoria.nombre}" ha sido eliminada exitosamente`
            );
          },
          error: (error) => {
            this.error = error.message;
            this.mostrarError('Error al eliminar categoría', error.message);
          }
        });
      }
    });
  }

  private validarFormulario(datos: any): boolean {
    if (datos.nombre && datos.nombre.trim().length < 2) {
      this.mostrarError('Error de validación', 'El nombre de la categoría debe tener al menos 2 caracteres');
      return false;
    }
    
    if (datos.nombre && datos.nombre.trim().length > 50) {
      this.mostrarError('Error de validación', 'El nombre de la categoría no puede exceder los 50 caracteres');
      return false;
    }
    
    return true;
  }

  private mostrarExito(titulo: string, mensaje: string) {
    Swal.fire({
      icon: 'success',
      title: titulo,
      text: mensaje,
      confirmButtonColor: '#52a7a3',
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: true
    });
  }

  private mostrarError(titulo: string, mensaje: string) {
    Swal.fire({
      icon: 'error',
      title: titulo,
      text: mensaje,
      confirmButtonColor: '#e74c3c',
      showConfirmButton: true
    });
  }

  getCategoriasFiltradas(): Categoria[] {
    if (!this.terminoBusqueda.trim()) {
      return this.categorias;
    }
    
    const termino = this.terminoBusqueda.toLowerCase();
    return this.categorias.filter(categoria => 
      categoria.nombre.toLowerCase().includes(termino) ||
      (categoria.descripcion && categoria.descripcion.toLowerCase().includes(termino))
    );
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.cargarCategorias();
  }

  getTotalCategorias(): number {
    return this.categorias.length;
  }

  getCategoriasActivas(): number {
    return this.categorias.filter(c => c.status).length;
  }

  getCategoriasInactivas(): number {
    return this.categorias.filter(c => !c.status).length;
  }
}