import { Component, OnInit } from '@angular/core';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { AreaVentaService } from '../../services/area-venta.service';
import { Producto, CreateProductoRequest, UpdateProductoRequest } from '../../models/producto.model';
import { Categoria } from '../../models/categoria.model';
import { AreaVenta } from '../../models/area-venta.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-producto',
  imports: [CommonModule,FormsModule,],
  templateUrl: './producto.component.html',
  styleUrl: './producto.component.scss'
})
export class ProductoComponent implements OnInit {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  areasVenta: AreaVenta[] = [];
  
  showCreateModal = false;
  showEditModal = false;
  
  nuevoProducto: CreateProductoRequest = {
    nombre: '',
    precio: 0,
    tiempo_preparacion: 0,
    vendedorFK: 0,
    estado: true,
    ingredientes: []
  };
  
  productoEditando: UpdateProductoRequest = {};
  productoSeleccionadoId?: number;
  
  // Nuevas propiedades para ingredientes
  nuevoIngrediente = '';
  editIngrediente = '';
  
  loading = false;
  errorMessage = '';

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private areaVentaService: AreaVentaService
  ) {}

  ngOnInit() {
    this.cargarProductos();
    this.cargarCategorias();
    this.cargarAreasVenta();
    this.obtenerVendedorId();
  }

  cargarProductos() {
    this.loading = true;
    this.productoService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
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
      },
      error: (error) => {
        console.error('Error cargando áreas de venta:', error);
      }
    });
  }

  obtenerVendedorId() {
    // TODO: Implementar lógica para obtener el ID del vendedor logueado
    this.nuevoProducto.vendedorFK = 1; // Reemplazar con ID real
  }

  abrirCrearModal() {
    this.nuevoProducto = {
      nombre: '',
      precio: 0,
      tiempo_preparacion: 0,
      vendedorFK: this.nuevoProducto.vendedorFK,
      estado: true,
      ingredientes: []
    };
    this.nuevoIngrediente = '';
    this.showCreateModal = true;
  }

  cerrarCrearModal() {
    this.showCreateModal = false;
  }

  abrirEditarModal(producto: Producto) {
    // Crear copia sin id y fecha_registro
    const { id, fecha_registro, ...productoSinId } = producto;
    this.productoEditando = { ...productoSinId };
    
    // Convertir ingredientes a array si es necesario
    if (this.productoEditando.ingredientes && !Array.isArray(this.productoEditando.ingredientes)) {
      this.productoEditando.ingredientes = [];
    }
    
    this.productoSeleccionadoId = producto.id;
    this.editIngrediente = '';
    this.showEditModal = true;
  }

  cerrarEditarModal() {
    this.showEditModal = false;
    this.productoEditando = {};
    this.productoSeleccionadoId = undefined;
  }

  // Métodos para manejar ingredientes - Crear
  agregarIngrediente() {
    if (this.nuevoIngrediente.trim()) {
      if (!this.nuevoProducto.ingredientes) {
        this.nuevoProducto.ingredientes = [];
      }
      this.nuevoProducto.ingredientes.push(this.nuevoIngrediente.trim());
      this.nuevoIngrediente = '';
    }
  }

  eliminarIngrediente(index: number) {
    if (this.nuevoProducto.ingredientes) {
      this.nuevoProducto.ingredientes.splice(index, 1);
    }
  }

  // Métodos para manejar ingredientes - Editar
  agregarIngredienteEditar() {
    if (this.editIngrediente.trim()) {
      if (!this.productoEditando.ingredientes) {
        this.productoEditando.ingredientes = [];
      }
      this.productoEditando.ingredientes.push(this.editIngrediente.trim());
      this.editIngrediente = '';
    }
  }

  eliminarIngredienteEditar(index: number) {
    if (this.productoEditando.ingredientes) {
      this.productoEditando.ingredientes.splice(index, 1);
    }
  }

  // Preparar datos para crear
  prepararDatosCrear(): CreateProductoRequest {
    return {
      ...this.nuevoProducto,
      categoria_id: this.nuevoProducto.categoria_id ? Number(this.nuevoProducto.categoria_id) : undefined,
      area_venta_id: this.nuevoProducto.area_venta_id ? Number(this.nuevoProducto.area_venta_id) : undefined,
      precio: Number(this.nuevoProducto.precio),
      tiempo_preparacion: Number(this.nuevoProducto.tiempo_preparacion),
      calorias: this.nuevoProducto.calorias ? Number(this.nuevoProducto.calorias) : undefined,
      vendedorFK: Number(this.nuevoProducto.vendedorFK)
    };
  }

  // Preparar datos para actualizar
  prepararDatosActualizar(): UpdateProductoRequest {
    const datos: UpdateProductoRequest = {};
    
    if (this.productoEditando.nombre !== undefined) datos.nombre = this.productoEditando.nombre;
    if (this.productoEditando.descripcion !== undefined) datos.descripcion = this.productoEditando.descripcion;
    if (this.productoEditando.precio !== undefined) datos.precio = Number(this.productoEditando.precio);
    if (this.productoEditando.imagen_url !== undefined) datos.imagen_url = this.productoEditando.imagen_url;
    if (this.productoEditando.categoria_id !== undefined) datos.categoria_id = Number(this.productoEditando.categoria_id);
    if (this.productoEditando.area_venta_id !== undefined) datos.area_venta_id = Number(this.productoEditando.area_venta_id);
    if (this.productoEditando.estado !== undefined) datos.estado = this.productoEditando.estado;
    if (this.productoEditando.tiempo_preparacion !== undefined) datos.tiempo_preparacion = Number(this.productoEditando.tiempo_preparacion);
    if (this.productoEditando.ingredientes !== undefined) datos.ingredientes = this.productoEditando.ingredientes;
    if (this.productoEditando.calorias !== undefined) datos.calorias = Number(this.productoEditando.calorias);
    if (this.productoEditando.vendedorFK !== undefined) datos.vendedorFK = Number(this.productoEditando.vendedorFK);
    
    return datos;
  }

  crearProducto() {
    const datos = this.prepararDatosCrear();
    
    this.loading = true;
    this.productoService.createProducto(datos).subscribe({
      next: () => {
        this.cargarProductos();
        this.cerrarCrearModal();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  actualizarProducto() {
    if (!this.productoSeleccionadoId) return;
    
    const datos = this.prepararDatosActualizar();
    
    this.loading = true;
    this.productoService.updateProducto(this.productoSeleccionadoId, datos).subscribe({
      next: () => {
        this.cargarProductos();
        this.cerrarEditarModal();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  eliminarProducto(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.productoService.deleteProducto(id).subscribe({
        next: () => {
          this.cargarProductos();
        },
        error: (error) => {
          this.errorMessage = error.message;
        }
      });
    }
  }

  toggleEstado(producto: Producto) {
    const updateData: UpdateProductoRequest = {
      estado: !producto.estado
    };
    
    this.productoService.updateProducto(producto.id, updateData).subscribe({
      next: () => {
        this.cargarProductos();
      },
      error: (error) => {
        this.errorMessage = error.message;
      }
    });
  }
}