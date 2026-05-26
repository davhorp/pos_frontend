import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  // Solo ejecutamos esto si estamos en el navegador real
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('jwt_token');

    if (token) {
      const cloned = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      return next(cloned);
    }
  }

  // Si estamos en Node.js, la petición pasa sin token
  return next(req);
};