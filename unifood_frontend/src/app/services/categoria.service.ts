import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  Categoria, 
  CreateCategoriaRequest, 
  UpdateCategoriaRequest 
} from '../models/categoria.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private apiUrl = 'http://localhost:3000/unifood/api/categorias';

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las categorías
   */
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtener una categoría por ID
   */
  getCategoriaById(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Crear una nueva categoría
   */
  createCategoria(categoriaData: CreateCategoriaRequest): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, categoriaData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Actualizar una categoría existente
   */
  updateCategoria(id: number, categoriaData: UpdateCategoriaRequest): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}/${id}`, categoriaData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Eliminar una categoría
   */
  deleteCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Cambiar el status de una categoría (activar/desactivar)
   */
  cambiarStatusCategoria(id: number, status: boolean): Observable<Categoria> {
    const updateData: UpdateCategoriaRequest = {
      status: status
    };
    
    return this.http.put<Categoria>(`${this.apiUrl}/${id}`, updateData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtener categorías activas
   */
  getCategoriasActivas(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl)
      .pipe(
        map(categorias => categorias.filter(categoria => categoria.status === true)),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener categorías por nombre (búsqueda)
   */
  buscarCategoriasPorNombre(nombre: string): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl)
      .pipe(
        map(categorias => categorias.filter(categoria => 
          categoria.nombre.toLowerCase().includes(nombre.toLowerCase())
        )),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener categorías con productos asociados (si necesitas esta funcionalidad)
   */
  getCategoriasConProductos(): Observable<Categoria[]> {
    // Nota: Esto podría requerir un endpoint específico en el backend
    // Por ahora, simplemente devolvemos todas las categorías
    return this.getCategorias();
  }

  /**
   * Verificar si una categoría existe por nombre
   */
  verificarCategoriaExistente(nombre: string): Observable<boolean> {
    return this.http.get<Categoria[]>(this.apiUrl)
      .pipe(
        map(categorias => categorias.some(categoria => 
          categoria.nombre.toLowerCase() === nombre.toLowerCase()
        )),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener estadísticas básicas de categorías
   */
  getEstadisticasCategorias(): Observable<{ total: number, activas: number, inactivas: number }> {
    return this.http.get<Categoria[]>(this.apiUrl)
      .pipe(
        map(categorias => {
          const total = categorias.length;
          const activas = categorias.filter(c => c.status).length;
          const inactivas = total - activas;
          
          return { total, activas, inactivas };
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          break;
        case 400:
          errorMessage = 'Datos inválidos. Verifica la información ingresada.';
          break;
        case 401:
          errorMessage = 'No autorizado. Tu sesión puede haber expirado.';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          errorMessage = 'La categoría solicitada no fue encontrada.';
          break;
        case 409:
          errorMessage = 'Ya existe una categoría con ese nombre.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intenta más tarde.';
          break;
        default:
          // Si el backend devuelve un mensaje de error personalizado
          errorMessage = error.error?.message || error.error?.error || `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Error en CategoriaService:', error);
    return throwError(() => new Error(errorMessage));
  }
}