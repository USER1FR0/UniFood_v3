import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { VendedoresService } from '../../services/vendedores.service';
import { Vendedor, UpdateVendedorRequest } from '../../models/vendedor.model';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lista-vendedores',
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './lista-vendedores.component.html',
  styleUrl: './lista-vendedores.component.scss',
})
export class ListaVendedoresComponent implements OnInit {
  vendedores: Vendedor[] = [];
  cargando: boolean = true;
  error: string = '';
  
  // Variables para el modal de edición
  modalEditarAbierto: boolean = false;
  editando: boolean = false;
  vendedorEditando: Vendedor | null = null;
  editarForm: FormGroup;
  generos: string[] = ['Masculino', 'Femenino', 'Otro'];

  constructor(
    private http: HttpClient,
    private vendedoresService: VendedoresService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.editarForm = this.crearFormularioEdicion();
  }

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
    const nuevoEstatus = vendedor.estatus === 'true' ? 'false' : 'true';
    const accion = nuevoEstatus === 'true' ? 'activar' : 'desactivar';

    Swal.fire({
      title: `¿${nuevoEstatus === 'true' ? 'Activar' : 'Desactivar'} vendedor?`,
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
          .cambiarEstatusVendedor(vendedor.id, nuevoEstatus === 'true')
          .subscribe({
            next: (vendedorActualizado) => {
              // Actualizar el vendedor en la lista local
              const index = this.vendedores.findIndex(
                (v) => v.id === vendedor.id
              );
              if (index !== -1) {
                this.vendedores[index] = vendedorActualizado;
              }
              this.reintentarCarga();

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
    this.router.navigate(['/crear-vendedor']);
  }

  /**
   * Abrir modal para editar vendedor
   */
  editarVendedor(vendedor: Vendedor) {
    this.vendedorEditando = vendedor;
    this.cargarDatosEnFormulario(vendedor);
    this.modalEditarAbierto = true;
  }

  /**
   * Cerrar modal de edición
   */
  cerrarModalEdicion() {
    this.modalEditarAbierto = false;
    this.vendedorEditando = null;
    this.editarForm.reset();
  }

  /**
   * Crear formulario reactivo para edición
   */
  crearFormularioEdicion(): FormGroup {
    return this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      ]],
      telefono: ['', [
        Validators.required,
        Validators.pattern(/^[\d\s\-\+\(\)]{7,15}$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      num_empleado: ['', [
        Validators.required,
        Validators.min(1),
        Validators.max(99999)
      ]],
      genero: ['', Validators.required],
      edad: ['', [
        Validators.required,
        Validators.min(18),
        Validators.max(100)
      ]],
      usuario_id: ['', [
        Validators.required,
        Validators.min(1)
      ]],
      estatus: ['true']
    });
  }

  /**
   * Cargar datos del vendedor en el formulario
   */
  cargarDatosEnFormulario(vendedor: Vendedor) {
    this.editarForm.patchValue({
      nombre: vendedor.nombre,
      telefono: vendedor.telefono,
      email: vendedor.email,
      num_empleado: vendedor.num_empleado,
      genero: vendedor.genero,
      edad: vendedor.edad,
      usuario_id: vendedor.usuario_id,
      estatus: vendedor.estatus
    });
  }

  /**
   * Enviar formulario de actualización
   */
  actualizarVendedor() {
    
    if (this.editarForm.invalid || !this.vendedorEditando) {
      return;
    }

    this.editando = true;

    const datosActualizados: UpdateVendedorRequest = {
      nombre: this.editarForm.value.nombre.trim(),
      telefono: this.editarForm.value.telefono,
      email: this.editarForm.value.email.toLowerCase().trim(),
      num_empleado: Number(this.editarForm.value.num_empleado),
      genero: this.editarForm.value.genero,
      edad: Number(this.editarForm.value.edad),
      usuario_id: Number(this.editarForm.value.usuario_id),
      estatus: this.editarForm.value.estatus
    };

    this.vendedoresService.updateVendedor(this.vendedorEditando.id, datosActualizados)
      .subscribe({
        next: (vendedorActualizado) => {
          this.editando = false;
          // Actualizar la lista local
          const index = this.vendedores.findIndex(v => v.id === this.vendedorEditando!.id);
          if (index !== -1) {
            this.vendedores[index] = vendedorActualizado;
          }
          this.reintentarCarga();
          this.cerrarModalEdicion();
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: `Vendedor "${datosActualizados.nombre}" actualizado correctamente`,
            confirmButtonColor: '#52a7a3',
            timer: 2000
          });
        } ,
        error: (error) => {
          this.editando = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#52a7a3',
          });
        }
      });
      
      
       
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
  getEstatusTexto(estatus: string): string {
    return estatus === 'true' ? 'Activo' : 'Inactivo';
  }

  getEstatusClase(estatus: string): string {
    return estatus === 'true' ? 'estatus-activo' : 'estatus-inactivo';
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

  /**
   * Validar campo específico en el formulario de edición
   */
  esCampoInvalido(campo: string): boolean {
    const control = this.editarForm.get(campo);
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
  }

  /**
   * Obtener mensaje de error para un campo en el formulario de edición
   */
  obtenerMensajeError(campo: string): string {
    const control = this.editarForm.get(campo);
    
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return 'Este campo es requerido';
    } else if (control.errors['email']) {
      return 'Formato de email inválido';
    } else if (control.errors['minlength']) {
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    } else if (control.errors['maxlength']) {
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    } else if (control.errors['min']) {
      return `Valor mínimo: ${control.errors['min'].min}`;
    } else if (control.errors['max']) {
      return `Valor máximo: ${control.errors['max'].max}`;
    } else if (control.errors['pattern']) {
      if (campo === 'nombre') return 'Solo se permiten letras y espacios';
      if (campo === 'telefono') return 'Formato de teléfono inválido';
    }

    return 'Campo inválido';
  }
}