import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Producto, CreateProductoRequest, UpdateProductoRequest } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://localhost:3000/unifood/api/productos';

  constructor(private http: HttpClient) {}

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createProducto(productoData: CreateProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, productoData)
      .pipe(catchError(this.handleError));
  }

  updateProducto(id: number, productoData: UpdateProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, productoData)
      .pipe(catchError(this.handleError));
  }

  deleteProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar con el servidor';
          break;
        case 400:
          errorMessage = 'Datos inválidos';
          break;
        case 404:
          errorMessage = 'Producto no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = error.error?.message || `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Error en ProductoService:', error);
    return throwError(() => new Error(errorMessage));
  }
}