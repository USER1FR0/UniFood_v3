import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const supervisorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }

  const usuario = authService.obtenerUsuario();
  if (usuario?.rol !== 'supervisor') {
    router.navigate(['/login']);
    return false;
  }

  return true;
};