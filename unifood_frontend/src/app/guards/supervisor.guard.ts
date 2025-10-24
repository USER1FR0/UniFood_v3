import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const supervisorGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.obtenerUsuario();

  if (usuario?.rol === 'supervisor') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

