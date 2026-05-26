import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from './loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Opcional: Si quieres que una petición NO muestre el loading global,
  // puedes enviarla con un header específico y filtrarla aquí.
  if (req.headers.has('X-Skip-Loading')) {
    const clonedReq = req.clone({ headers: req.headers.delete('X-Skip-Loading') });
    return next(clonedReq);
  }

  // Encendemos el loader
  loadingService.show();

  // Continuamos la petición y nos aseguramos de apagarlo al finalizar
  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
    })
  );
};
