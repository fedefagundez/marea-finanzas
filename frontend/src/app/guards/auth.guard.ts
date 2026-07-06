import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  if (!authService.currentUser()) {
    try {
      const user = await firstValueFrom(authService.me());
      if (user) authService.saveUser(user);
    } catch {
      authService.logout();
      return router.createUrlTree(['/login']);
    }
  }

  return true;
};
