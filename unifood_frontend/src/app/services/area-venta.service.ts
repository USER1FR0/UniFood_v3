import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  AreaVenta, 
  CreateAreaVentaRequest, 
  UpdateAreaVentaRequest 
} from '../models/area-venta.model';

@Injectable({
  providedIn: 'root'
})
export class AreaVentaService {
  private apiUrl = 'http://localhost:3000/unifood/api/area-venta';

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las áreas de venta
   */
  getAreasVenta(): Observable<AreaVenta[]> {
    return this.http.get<AreaVenta[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtener un área de venta por ID
   */
  getAreaVentaById(id: number): Observable<AreaVenta> {
    return this.http.get<AreaVenta>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Crear una nueva área de venta
   */
  createAreaVenta(areaVentaData: CreateAreaVentaRequest): Observable<AreaVenta> {
    return this.http.post<AreaVenta>(this.apiUrl, areaVentaData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Actualizar un área de venta existente
   */
  updateAreaVenta(id: number, areaVentaData: UpdateAreaVentaRequest): Observable<AreaVenta> {
    return this.http.put<AreaVenta>(`${this.apiUrl}/${id}`, areaVentaData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Eliminar un área de venta
   */
  deleteAreaVenta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Cambiar el status de un área de venta (activar/desactivar)
   */
  cambiarStatusAreaVenta(id: number, status: boolean): Observable<AreaVenta> {
    const updateData: UpdateAreaVentaRequest = {
      status: status
    };
    
    return this.http.put<AreaVenta>(`${this.apiUrl}/${id}`, updateData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtener áreas de venta activas
   */
  getAreasVentaActivas(): Observable<AreaVenta[]> {
    return this.http.get<AreaVenta[]>(this.apiUrl)
      .pipe(
        map(areas => areas.filter(area => area.status === true)),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener áreas de venta por horario (áreas que están abiertas en el momento actual)
   */
  getAreasVentaAbiertas(): Observable<AreaVenta[]> {
    const ahora = new Date();
    const horaActual = ahora.getHours().toString().padStart(2, '0') + ':' + 
                      ahora.getMinutes().toString().padStart(2, '0') + ':' + 
                      ahora.getSeconds().toString().padStart(2, '0');

    return this.http.get<AreaVenta[]>(this.apiUrl)
      .pipe(
        map(areas => areas.filter(area => {
          if (!area.status) return false;
          if (!area.horario_apertura || !area.horario_cierre) return true;
          
          return horaActual >= area.horario_apertura && horaActual <= area.horario_cierre;
        })),
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
          errorMessage = 'El área de venta solicitada no fue encontrada.';
          break;
        case 409:
          errorMessage = 'Ya existe un área de venta con ese nombre.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intenta más tarde.';
          break;
        default:
          // Si el backend devuelve un mensaje de error personalizado
          errorMessage = error.error?.message || error.error?.error || `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Error en AreaVentaService:', error);
    return throwError(() => new Error(errorMessage));
  }
}