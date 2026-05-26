import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const sellerGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userInfoStr = localStorage.getItem('user_info');

  if (userInfoStr) {
    const userInfo = JSON.parse(userInfoStr);
    // Permitimos acceso si es SELLER o ADMIN
    if (userInfo.role === 'SELLER' || userInfo.role === 'ADMIN') {
      return true;
    }
  }

  // Si no tiene permisos, lo mandamos al login
  router.navigate(['/login']);
  return false;
};
