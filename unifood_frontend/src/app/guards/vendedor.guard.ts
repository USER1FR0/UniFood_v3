import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const vendedorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }

  const usuario = authService.obtenerUsuario();
  if (usuario?.rol !== 'vendedor') {
    router.navigate(['/cliente']);
    return false;
  }

  return true;
};