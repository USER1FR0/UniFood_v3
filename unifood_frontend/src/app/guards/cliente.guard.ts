import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const clienteGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }

  const usuario = authService.obtenerUsuario();
  if (usuario?.rol !== 'cliente') {
    router.navigate(['/vendedor']);
    return false;
  }

  return true;
};