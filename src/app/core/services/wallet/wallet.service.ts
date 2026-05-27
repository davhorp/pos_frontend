import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  constructor() { }

  private http = inject(HttpClient);
  private apiUrl = `${environment.urlPOSSystem}/api/pos/wallets`;

  /**
   * Envía la solicitud al backend para generar y enviar el estado de cuenta por correo.
   * @param phone Número de teléfono del cliente
   * @param email Correo destino
   */
  sendEmailStatement(phone: string, email: string): Observable<string> {
    const body = { email }; // Esto mapea al record EmailRequest en Java
    return this.http.post(`${this.apiUrl}/${phone}/statement/email`, body, {
      responseType: 'text' // El backend retorna un ResponseEntity<String>
    });
  }
}
