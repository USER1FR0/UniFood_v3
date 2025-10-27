import { Component,OnInit } from '@angular/core';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { AreaVentaService } from '../../services/area-venta.service';
import { PedidoService } from '../../services/pedido.service';
import { Producto } from '../../models/producto.model';
import { Categoria } from '../../models/categoria.model';
import { AreaVenta } from '../../models/area-venta.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalAgregarProductoComponent } from '../modal-agregar-producto/modal-agregar-producto.component';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-cliente-productos',
  imports: [CommonModule, FormsModule, ModalAgregarProductoComponent],
  templateUrl: './cliente-productos.component.html',
  styleUrl: './cliente-productos.component.scss'
})
export class ClienteProductosComponent implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: Categoria[] = [];
  areasVenta: AreaVenta[] = [];
  
  // Filtros - usar strings para los selects
  categoriaSeleccionada: string = '';
  areaSeleccionada: string = '';
  terminoBusqueda = '';
  
  // Modal
  productoSeleccionado: Producto | null = null;
  showDetailModal = false;
  
  // Modal agregar al carrito
  productoParaAgregar: any = null;
  mostrarModalAgregar = false;
  
  loading = false;
  errorMessage = '';

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private areaVentaService: AreaVentaService,
    private pedidoService: PedidoService
  ) {}

  ngOnInit() {
    this.cargarProductos();
    this.cargarCategorias();
    this.cargarAreasVenta();
  }

  cargarProductos() {
    this.loading = true;
    this.productoService.getProductos().subscribe({
      next: (productos) => {
        // Filtrar solo productos activos y que tengan categoría y área válidas
        this.productos = productos.filter(p => p.estado);
        console.log('Productos cargados:', this.productos);
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  cargarCategorias() {
    this.categoriaService.getCategoriasActivas().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        console.log('Categorías cargadas:', this.categorias);
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
      }
    });
  }

  cargarAreasVenta() {
    this.areaVentaService.getAreasVentaActivas().subscribe({
      next: (areas) => {
        this.areasVenta = areas;
        console.log('Áreas de venta cargadas:', this.areasVenta);
      },
      error: (error) => {
        console.error('Error cargando áreas de venta:', error);
      }
    });
  }

  // Filtros corregidos
  aplicarFiltros() {
    console.log('Aplicando filtros...');
    console.log('Categoría seleccionada:', this.categoriaSeleccionada);
    console.log('Área seleccionada:', this.areaSeleccionada);
    console.log('Término búsqueda:', this.terminoBusqueda);

    let productosFiltrados = [...this.productos];

    // Filtro por categoría - convertir a número para comparar
    if (this.categoriaSeleccionada) {
      const categoriaId = Number(this.categoriaSeleccionada);
      console.log('Filtrando por categoría ID:', categoriaId);
      productosFiltrados = productosFiltrados.filter(
        producto => producto.categoria_id === categoriaId
      );
      console.log('Productos después de filtrar por categoría:', productosFiltrados.length);
    }

    // Filtro por área de venta - convertir a número para comparar
    if (this.areaSeleccionada) {
      const areaId = Number(this.areaSeleccionada);
      console.log('Filtrando por área ID:', areaId);
      productosFiltrados = productosFiltrados.filter(
        producto => producto.area_venta_id === areaId
      );
      console.log('Productos después de filtrar por área:', productosFiltrados.length);
    }

    // Filtro por búsqueda
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase().trim();
      console.log('Filtrando por término:', termino);
      productosFiltrados = productosFiltrados.filter(
        producto => 
          producto.nombre.toLowerCase().includes(termino) ||
          (producto.descripcion && producto.descripcion.toLowerCase().includes(termino))
      );
      console.log('Productos después de filtrar por búsqueda:', productosFiltrados.length);
    }

    this.productosFiltrados = productosFiltrados;
    console.log('Productos filtrados final:', this.productosFiltrados);
  }

  limpiarFiltros() {
    this.categoriaSeleccionada = '';
    this.areaSeleccionada = '';
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  // Métodos helpers para el template
  getCategoriaSeleccionadaNombre(): string {
    if (!this.categoriaSeleccionada) return '';
    const categoriaId = Number(this.categoriaSeleccionada);
    return this.getNombreCategoria(categoriaId);
  }

  getAreaSeleccionadaNombre(): string {
    if (!this.areaSeleccionada) return '';
    const areaId = Number(this.areaSeleccionada);
    return this.getNombreAreaVenta(areaId);
  }

  // Modal de detalles
  abrirDetallesModal(producto: Producto) {
    this.productoSeleccionado = producto;
    this.showDetailModal = true;
  }

  cerrarDetallesModal() {
    this.showDetailModal = false;
    this.productoSeleccionado = null;
  }

  // Abrir modal para agregar al carrito
  agregarAlCarrito(producto: Producto, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.productoParaAgregar = producto;
    this.mostrarModalAgregar = true;
  }

  // Cerrar modal de agregar
  cerrarModalAgregar(): void {
    this.mostrarModalAgregar = false;
    this.productoParaAgregar = null;
  }

  // Procesar adición al carrito con cantidad y detalles
  procesarAgregarAlCarrito(datos: { producto: any; cantidad: number; detalles?: string }): void {
    this.pedidoService.agregarAlCarritoDesdeApi(datos.producto.id, datos.cantidad, datos.detalles).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: '¡Agregado!',
          text: `${datos.cantidad}x ${datos.producto.nombre} agregado al carrito`,
          timer: 1500,
          showConfirmButton: false,
          position: 'top-end',
          toast: true
        });
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo agregar el producto',
          timer: 2000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true
        });
      }
    });
  }

  // Helper para ingredientes
  getIngredientesArray(ingredientes: any): string[] {
    if (!ingredientes) return [];
    if (Array.isArray(ingredientes)) return ingredientes;
    return Object.values(ingredientes);
  }

  // Obtener nombre de categoría
  getNombreCategoria(categoriaId: number): string {
    if (!categoriaId) return 'Sin categoría';
    const categoria = this.categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nombre : 'Sin categoría';
  }

  // Obtener nombre de área de venta
  getNombreAreaVenta(areaId: number): string {
    if (!areaId) return 'Sin área';
    const area = this.areasVenta.find(a => a.id === areaId);
    return area ? area.area_venta : 'Sin área';
  }

  // Debug: Verificar datos
  verificarDatos() {
    console.log('=== VERIFICACIÓN DE DATOS ===');
    console.log('Productos totales:', this.productos.length);
    console.log('Productos filtrados:', this.productosFiltrados.length);
    console.log('Categorías:', this.categorias.length);
    console.log('Áreas venta:', this.areasVenta.length);
    console.log('Productos con categoría:', this.productos.filter(p => p.categoria_id).length);
    console.log('Productos con área:', this.productos.filter(p => p.area_venta_id).length);
    
    // Mostrar detalles de algunos productos
    if (this.productos.length > 0) {
      console.log('Primeros 3 productos:', this.productos.slice(0, 3));
    }
  }
}