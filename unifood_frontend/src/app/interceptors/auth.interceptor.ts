import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = authService.obtenerToken();
  
  // Debug logs
  //console.log('Interceptor ejecutándose');
  //console.log('URL:', req.url);
  //console.log(' Token:', token ? 'Existe' : 'No existe');

  let clonedReq = req;
  
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });


  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {      

      return throwError(() => error);
    })
  );
};