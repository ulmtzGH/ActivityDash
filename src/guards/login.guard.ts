
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ensureInitialized();

  if (authService.isLoggedIn()) {
    // Redirect to the dashboard if already logged in
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
