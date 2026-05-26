import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SaleResponse } from '../../../models/sale/saleResponse.models';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SaleRequest } from '../../../models/sale/saleRequest.models';

@Injectable({
  providedIn: 'root'
})
export class SaleService {

  private http = inject(HttpClient);

  /**
   * Envía el carrito de compras y el método de pago al backend
   */
  processCheckout(request: SaleRequest): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(`${environment.urlPOSSystem}${environment.checkout}`, request).pipe(
      catchError(this.handleError)
    )
  }

  // Manejo de errores centralizado para extraer el mensaje de tu ApiErrorResponse
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido al cobrar.';
    if (error.error && error.error.message) {
      errorMessage = error.error.message; // El mensaje que viene de Java
    }
    return throwError(() => new Error(errorMessage));
  }
}
