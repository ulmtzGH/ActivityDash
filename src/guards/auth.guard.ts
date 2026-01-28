
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ensureInitialized();

  if (authService.isLoggedIn()) {
    return true;
  }

  // Redirect to the login page if not authenticated
  router.navigate(['/login']);
  return false;
};
