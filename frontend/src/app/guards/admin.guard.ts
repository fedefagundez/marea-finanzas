import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.me().pipe(
    map(usuario => {
      if (usuario.rol === 'ADMIN') return true;
      return router.createUrlTree(['/dashboard']);
    })
  );
};
