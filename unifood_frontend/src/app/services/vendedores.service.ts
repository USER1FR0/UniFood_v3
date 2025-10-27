import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

  getVendedores(): Observable<Vendedor[]> {
    return this.http.get<Vendedor[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getVendedorById(id: number): Observable<Vendedor> {
    return this.http.get<Vendedor>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createVendedor(vendedorData: CreateVendedorRequest): Observable<Vendedor> {
    return this.http.post<Vendedor>(this.apiUrl, vendedorData)
      .pipe(catchError(this.handleError));
  }

  updateVendedor(id: number, vendedorData: UpdateVendedorRequest): Observable<Vendedor> {
    return this.http.put<Vendedor>(`${this.apiUrl}/${id}`, vendedorData)
      .pipe(catchError(this.handleError));
  }

  deleteVendedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  cambiarEstatusVendedor(id: number, estatus: boolean): Observable<Vendedor> {
    const estatusString = estatus ? 'Activo' : 'Inactivo';
    const updateData: UpdateVendedorRequest = { estatus: estatusString };
    
    return this.http.put<Vendedor>(`${this.apiUrl}/${id}`, updateData)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
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
          errorMessage = error.error?.message || 'Ya existe un usuario con ese correo electrónico.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intenta más tarde.';
          break;
        default:
          errorMessage = error.error?.message || error.error?.error || `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Error en VendedoresService:', error);
    return throwError(() => new Error(errorMessage));
  }
}