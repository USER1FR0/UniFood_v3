import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-modal-agregar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-agregar-producto.component.html',
  styleUrls: ['./modal-agregar-producto.component.scss']
})
export class ModalAgregarProductoComponent {
  @Input() producto: any = null;
  @Input() mostrar: boolean = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() agregar = new EventEmitter<{ producto: any; cantidad: number; detalles?: string }>();

  cantidad: number = 1;
  detalles: string = '';

  readonly placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%235B9A97' width='400' height='300'/%3E%3Cg fill='%23FFFFFF' opacity='0.3'%3E%3Cpath d='M200 80c-33.1 0-60 26.9-60 60s26.9 60 60 60 60-26.9 60-60-26.9-60-60-60zm0 100c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z'/%3E%3Cpath d='M200 120c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 30c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z'/%3E%3Ccircle cx='160' cy='120' r='8'/%3E%3Ccircle cx='240' cy='120' r='8'/%3E%3Cpath d='M200 160c-16.5 0-30 13.5-30 30h10c0-11 9-20 20-20s20 9 20 20h10c0-16.5-13.5-30-30-30z'/%3E%3C/g%3E%3Ctext x='200' y='260' font-family='Arial, sans-serif' font-size='24' fill='%23FFFFFF' text-anchor='middle' font-weight='bold'%3EUniFood%3C/text%3E%3C/svg%3E`;

  cerrarModal(): void {
    this.cantidad = 1;
    this.detalles = '';
    this.cerrar.emit();
  }

  incrementarCantidad(): void {
    this.cantidad++;
  }

  decrementarCantidad(): void {
    if (this.cantidad > 1) {
      this.cantidad--;
    }
  }

  agregarAlCarrito(): void {
    if (this.producto) {
      this.agregar.emit({
        producto: this.producto,
        cantidad: this.cantidad,
        detalles: this.detalles || undefined
      });
      this.cerrarModal();
    }
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(precio);
  }

  obtenerImagenProducto(producto: any): string {
    return producto?.imagen_url || this.placeholderImage;
  }

  onImageError(event: any): void {
    if (event.target.src !== this.placeholderImage) {
      event.target.src = this.placeholderImage;
    }
  }

  getIngredientesArray(ingredientes: any): string[] {
    if (!ingredientes) return [];
    if (Array.isArray(ingredientes)) return ingredientes;
    if (typeof ingredientes === 'object') return Object.values(ingredientes);
    return [];
  }

  calcularSubtotal(): number {
    return (this.producto?.precio || 0) * this.cantidad;
  }
}

