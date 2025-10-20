import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VendedoresService } from '../../services/vendedores.service';
import { CreateVendedorRequest } from '../../models/vendedor.model';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-crear-vendedor',
  imports: [CommonModule, HttpClientModule,FormsModule, ReactiveFormsModule],
  templateUrl: './crear-vendedor.component.html',
  styleUrls: ['./crear-vendedor.component.scss']
})
export class CrearVendedorComponent implements OnInit {
  vendedorForm: FormGroup;
  cargando: boolean = false;
  generos: string[] = ['Masculino', 'Femenino', 'Otro'];

  constructor(
    private fb: FormBuilder,
    private vendedoresService: VendedoresService,
    private router: Router
  ) {
    this.vendedorForm = this.createForm();
  }

  ngOnInit() {}

  /**
   * Crear el formulario reactivo con validaciones
   */
  createForm(): FormGroup {
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
      estatus: ['', Validators.required]
    });
  }

  /**
   * Getters para acceder fácilmente a los controles del formulario
   */
  get f(): { [key: string]: AbstractControl } {
    return this.vendedorForm.controls;
  }

  /**
   * Enviar el formulario para crear el vendedor
   */
  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores
    if (this.vendedorForm.invalid) {
      Object.keys(this.vendedorForm.controls).forEach(key => {
        this.vendedorForm.get(key)?.markAsTouched();
      });
      
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos requeridos correctamente',
        confirmButtonColor: '#52a7a3',
      });
      return;
    }

    this.cargando = true;

    const estatusString = this.vendedorForm.value.estatus === 'true' ? 'Activo' : 'Inactivo';
    const vendedorData: CreateVendedorRequest = {
      
      nombre: this.vendedorForm.value.nombre.trim(),
      telefono: this.vendedorForm.value.telefono,
      email: this.vendedorForm.value.email.toLowerCase().trim(),
      num_empleado: Number(this.vendedorForm.value.num_empleado),
      genero: this.vendedorForm.value.genero,
      edad: Number(this.vendedorForm.value.edad),
      usuario_id: Number(this.vendedorForm.value.usuario_id),
      estatus: estatusString
      
      
    };
    

    this.vendedoresService.createVendedor(vendedorData).subscribe({
      next: (vendedorCreado) => {
        this.cargando = false;
        
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: `Vendedor "${vendedorCreado.nombre}" creado correctamente`,
          confirmButtonColor: '#52a7a3',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/vendedores']);
        });
      },
      error: (error) => {
        this.cargando = false;
        
        let mensaje = 'Error al crear el vendedor';
        
        // Mensajes específicos según el tipo de error
        if (error.message.includes('número de empleado')) {
          mensaje = 'Ya existe un vendedor con ese número de empleado';
        } else if (error.message.includes('email')) {
          mensaje = 'Ya existe un vendedor con ese email';
        } else if (error.message.includes('conectar')) {
          mensaje = 'No se pudo conectar con el servidor';
        } else {
          mensaje = error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: mensaje,
          confirmButtonColor: '#52a7a3',
        });
      }
    });
  }

  /**
   * Cancelar y volver a la lista
   */
  onCancel(): void {
    Swal.fire({
      title: '¿Cancelar?',
      text: 'Los datos no guardados se perderán',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#52a7a3',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Seguir editando'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/vendedores']);
      }
    });
  }

  /**
   * Limpiar el formulario
   */
  onClear(): void {
    Swal.fire({
      title: '¿Limpiar formulario?',
      text: 'Se borrarán todos los datos ingresados',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#52a7a3',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.vendedorForm.reset({
          estatus: true
        });
      }
    });
  }

  /**
   * Validar campo específico
   */
  isValidField(field: string): boolean {
    const control = this.vendedorForm.get(field);
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getErrorMessage(field: string): string {
    const control = this.vendedorForm.get(field);
    
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
      if (field === 'nombre') return 'Solo se permiten letras y espacios';
      if (field === 'telefono') return 'Formato de teléfono inválido';
    }

    return 'Campo inválido';
  }
}