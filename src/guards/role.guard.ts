
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['roles'] as Array<string>;
  const currentUserRole = authService.currentUser()?.role;

  if (!currentUserRole || !expectedRoles.includes(currentUserRole)) {
    // Redirect to the main dashboard if the user doesn't have the required role
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
