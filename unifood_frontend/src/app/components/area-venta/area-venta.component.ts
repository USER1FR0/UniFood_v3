import { Component, OnInit } from '@angular/core';
import { AreaVentaService } from '../../services/area-venta.service';
import { AreaVenta, CreateAreaVentaRequest, UpdateAreaVentaRequest } from '../../models/area-venta.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-area-venta',
  imports:[CommonModule, FormsModule],
  templateUrl: './area-venta.component.html',
  styleUrls: ['./area-venta.component.scss']
})
export class AreaVentaComponent implements OnInit {
  // Datos
  areasVenta: AreaVenta[] = [];
  areaVentaSeleccionada: AreaVenta | null = null;
  
  // Estados
  cargando = true;
  error = '';
  
  // Modales
  mostrarModalCrear = false;
  mostrarModalEditar = false;
  procesando = false;
  
  // Formularios
  nuevaAreaVenta: CreateAreaVentaRequest = {
    area_venta: '',
    descripcion: '',
    status: true,
    horario_apertura: '',
    horario_cierre: ''
  };

  areaVentaEditada: UpdateAreaVentaRequest = {};

  constructor(private areaVentaService: AreaVentaService) {}

  ngOnInit() {
    this.cargarAreasVenta();
  }

  cargarAreasVenta() {
    this.cargando = true;
    this.error = '';
    
    this.areaVentaService.getAreasVenta().subscribe({
      next: (areas) => {
        this.areasVenta = areas;
        this.cargando = false;
      },
      error: (error) => {
        this.error = error.message;
        this.cargando = false;
        console.error('Error al cargar áreas de venta:', error);
      }
    });
  }

  abrirModalCrear() {
    this.nuevaAreaVenta = {
      area_venta: '',
      descripcion: '',
      status: true,
      horario_apertura: '08:00:00',
      horario_cierre: '18:00:00'
    };
    this.mostrarModalCrear = true;
  }

  abrirModalEditar(areaVenta: AreaVenta) {
    this.areaVentaSeleccionada = areaVenta;
    this.areaVentaEditada = {
      area_venta: areaVenta.area_venta,
      descripcion: areaVenta.descripcion,
      status: areaVenta.status,
      horario_apertura: areaVenta.horario_apertura,
      horario_cierre: areaVenta.horario_cierre
    };
    this.mostrarModalEditar = true;
  }

  cerrarModales() {
    this.mostrarModalCrear = false;
    this.mostrarModalEditar = false;
    this.areaVentaSeleccionada = null;
    this.procesando = false;
  }

  crearAreaVenta() {
    if (!this.validarFormulario(this.nuevaAreaVenta)) return;
    
    this.procesando = true;
    
    this.areaVentaService.createAreaVenta(this.nuevaAreaVenta).subscribe({
      next: (area) => {
        this.areasVenta.push(area);
        this.cerrarModales();
        this.mostrarMensajeExito('Área de venta creada exitosamente');
      },
      error: (error) => {
        this.error = error.message;
        this.procesando = false;
        console.error('Error al crear área de venta:', error);
      }
    });
  }

  actualizarAreaVenta() {
    if (!this.areaVentaSeleccionada || !this.validarFormulario(this.areaVentaEditada)) return;
    
    this.procesando = true;
    
    this.areaVentaService.updateAreaVenta(
      this.areaVentaSeleccionada.id, 
      this.areaVentaEditada
    ).subscribe({
      next: (areaActualizada) => {
        const index = this.areasVenta.findIndex(a => a.id === areaActualizada.id);
        if (index !== -1) {
          this.areasVenta[index] = areaActualizada;
        }
        this.cerrarModales();
        this.mostrarMensajeExito('Área de venta actualizada exitosamente');
      },
      error: (error) => {
        this.error = error.message;
        this.procesando = false;
        console.error('Error al actualizar área de venta:', error);
      }
    });
  }

  cambiarStatusAreaVenta(areaVenta: AreaVenta) {
    const nuevoStatus = !areaVenta.status;
    
    this.areaVentaService.cambiarStatusAreaVenta(areaVenta.id, nuevoStatus).subscribe({
      next: (areaActualizada) => {
        const index = this.areasVenta.findIndex(a => a.id === areaActualizada.id);
        if (index !== -1) {
          this.areasVenta[index] = areaActualizada;
        }
        this.mostrarMensajeExito(`Área ${nuevoStatus ? 'activada' : 'desactivada'} exitosamente`);
      },
      error: (error) => {
        this.error = error.message;
        console.error('Error al cambiar status:', error);
      }
    });
  }

  eliminarAreaVenta(areaVenta: AreaVenta) {
    if (confirm(`¿Estás seguro de que deseas eliminar el área "${areaVenta.area_venta}"?`)) {
      this.areaVentaService.deleteAreaVenta(areaVenta.id).subscribe({
        next: () => {
          this.areasVenta = this.areasVenta.filter(a => a.id !== areaVenta.id);
          this.mostrarMensajeExito('Área de venta eliminada exitosamente');
        },
        error: (error) => {
          this.error = error.message;
          console.error('Error al eliminar área de venta:', error);
        }
      });
    }
  }

  private validarFormulario(datos: any): boolean {
    if (datos.area_venta && datos.area_venta.trim().length < 2) {
      this.error = 'El nombre del área debe tener al menos 2 caracteres';
      return false;
    }
    
    if (datos.horario_apertura && datos.horario_cierre) {
      if (datos.horario_apertura >= datos.horario_cierre) {
        this.error = 'El horario de apertura debe ser anterior al horario de cierre';
        return false;
      }
    }
    
    return true;
  }

  private mostrarMensajeExito(mensaje: string) {
    // Aquí podrías implementar un toast o notificación
    console.log(mensaje);
    // Ejemplo simple con alert
    alert(mensaje);
  }

  formatearHora(hora: string): string {
    if (!hora) return 'No definido';
    return hora.substring(0, 5); // Mostrar solo HH:MM
  }

  getHorarioCompleto(area: AreaVenta): string {
    if (!area.horario_apertura || !area.horario_cierre) {
      return 'Horario no definido';
    }
    return `${this.formatearHora(area.horario_apertura)} - ${this.formatearHora(area.horario_cierre)}`;
  }

  estaAbierta(area: AreaVenta): boolean {
    if (!area.horario_apertura || !area.horario_cierre) return false;
    
    const ahora = new Date();
    const horaActual = ahora.getHours().toString().padStart(2, '0') + ':' + 
                      ahora.getMinutes().toString().padStart(2, '0') + ':' + 
                      ahora.getSeconds().toString().padStart(2, '0');
    
    return horaActual >= area.horario_apertura && horaActual <= area.horario_cierre;
  }
}