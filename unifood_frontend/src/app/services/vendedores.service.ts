import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  Vendedor, 
  CreateVendedorRequest, 
  UpdateVendedorRequest
} from '../models/vendedor.model';

@Injectable({
  providedIn: 'root'
})
export class VendedoresService {
  private apiUrl = 'http://localhost:3000/unifood/api/vendedores';

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los vendedores
   */
  getVendedores(): Observable<Vendedor[]> {
    return this.http.get<Vendedor[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtener un vendedor por ID
   */
  getVendedorById(id: number): Observable<Vendedor> {
    return this.http.get<Vendedor>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Crear un nuevo vendedor
   */
  createVendedor(vendedorData: CreateVendedorRequest): Observable<Vendedor> {
    return this.http.post<Vendedor>(this.apiUrl, vendedorData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Actualizar un vendedor existente
   */
  updateVendedor(id: number, vendedorData: UpdateVendedorRequest): Observable<Vendedor> {
    return this.http.put<Vendedor>(`${this.apiUrl}/${id}`, vendedorData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Eliminar un vendedor
   */
  deleteVendedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Cambiar el estatus de un vendedor (activar/desactivar)
   */
  cambiarEstatusVendedor(id: number, estatus: boolean): Observable<Vendedor> {
    return this.http.patch<Vendedor>(`${this.apiUrl}/${id}`, { estatus })
      .pipe(
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
          errorMessage = 'El recurso solicitado no fue encontrado.';
          break;
        case 409:
          errorMessage = 'Ya existe un vendedor con ese número de empleado o email.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intenta más tarde.';
          break;
        default:
          // Si el backend devuelve un mensaje de error personalizado
          errorMessage = error.error?.message || error.error?.error || `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Error en VendedoresService:', error);
    return throwError(() => new Error(errorMessage));
  }
}