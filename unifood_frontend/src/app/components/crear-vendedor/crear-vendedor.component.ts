import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VendedoresService } from '../../services/vendedores.service';
import { CreateVendedorRequest } from '../../models/vendedor.model';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-crear-vendedor',
  imports:[CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './crear-vendedor.component.html',
  styleUrls: ['./crear-vendedor.component.scss']
})
export class CrearVendedorComponent implements OnInit {
  vendedorForm: FormGroup;
  cargando: boolean = false;
  mostrarContrasena: boolean = false;
  generos: string[] = ['Masculino', 'Femenino', 'Otro'];

  constructor(
    private fb: FormBuilder,
    private vendedoresService: VendedoresService,
    private router: Router
  ) {
    this.vendedorForm = this.createForm();
  }

  ngOnInit() {}

  createForm(): FormGroup {
    return this.fb.group({
      // Campos de usuario
      correo_electronico: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      contrasena: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(100)
      ]],
      
      // Campos de vendedor
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
      estatus: ['Activo', Validators.required]
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.vendedorForm.controls;
  }

  togglePasswordVisibility(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  onSubmit(): void {
    if (this.vendedorForm.invalid) {
      Object.keys(this.vendedorForm.controls).forEach(key => {
        this.vendedorForm.get(key)?.markAsTouched();
      });
      
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos requeridos correctamente',
        confirmButtonColor: '#52a7a3',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.cargando = true;

    const vendedorData: CreateVendedorRequest = {
      // Campos de usuario
      correo_electronico: this.vendedorForm.value.correo_electronico.toLowerCase().trim(),
      contrasena: this.vendedorForm.value.contrasena,

      // Campos de vendedor
      nombre: this.vendedorForm.value.nombre.trim(),
      telefono: this.vendedorForm.value.telefono,
      email: this.vendedorForm.value.email.toLowerCase().trim(),
      num_empleado: Number(this.vendedorForm.value.num_empleado),
      genero: this.vendedorForm.value.genero,
      edad: Number(this.vendedorForm.value.edad),
      estatus: this.vendedorForm.value.estatus
    };

    this.vendedoresService.createVendedor(vendedorData).subscribe({
      next: (vendedorCreado) => {
        this.cargando = false;
        
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          html: `
            <div style="text-align: left;">
              <p><strong>Vendedor creado correctamente:</strong></p>
              <p>📝 <strong>Nombre:</strong> ${vendedorCreado.nombre}</p>
              <p>📧 <strong>Email:</strong> ${vendedorCreado.email}</p>
              <p>👤 <strong>Usuario:</strong> ${vendedorData.correo_electronico}</p>
              <p>🆔 <strong>N° Empleado:</strong> ${vendedorCreado.num_empleado}</p>
            </div>
          `,
          confirmButtonColor: '#52a7a3',
          confirmButtonText: 'Continuar'
        }).then(() => {
          this.router.navigate(['/vendedores']);
        });
      },
      error: (error) => {
        this.cargando = false;
        
        let mensaje = 'Error al crear el vendedor';
        
        if (error.message.includes('correo electrónico')) {
          mensaje = 'Ya existe un usuario con ese correo electrónico';
        } else if (error.message.includes('número de empleado')) {
          mensaje = 'Ya existe un vendedor con ese número de empleado';
        } else if (error.message.includes('conectar')) {
          mensaje = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        } else {
          mensaje = error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: mensaje,
          confirmButtonColor: '#52a7a3',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  onCancel(): void {
    if (this.vendedorForm.dirty) {
      Swal.fire({
        title: '¿Cancelar registro?',
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
    } else {
      this.router.navigate(['/vendedores']);
    }
  }

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
          estatus: 'Activo'
        });
        this.mostrarContrasena = false;
      }
    });
  }

  isValidField(field: string): boolean {
    const control = this.vendedorForm.get(field);
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
  }

  getErrorMessage(field: string): string {
    const control = this.vendedorForm.get(field);
    
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return 'Este campo es requerido';
    } else if (control.errors['email'] || control.errors['pattern']) {
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