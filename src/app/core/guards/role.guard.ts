import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserRole } from '../../models/auth.models';
import LoginComponent from '../../business/authentication/login/login.component';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const loginService = inject(LoginComponent);
    const router = inject(Router);
    const user = loginService.currentUser();

    if (user && allowedRoles.includes(user.rol)) {
      return true;
    }

    // Si no tiene permiso, lo mandamos al login o a una página de "Acceso Denegado"
    router.navigate(['/unauthorized']);
    return false;
  };
};
