import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TicketResponse } from '../../../models/ticket/ticketResponse.models';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TicketService {

  private http = inject(HttpClient);

  /**
   * Obtiene el ticket en formato de texto plano desde Spring Boot
   */
  getTicket(saleId: string): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${environment.urlPOSSystem}${environment.ticket}/${saleId}`);
  }

  /**
   * Obtiene el ticket térmico del estado de cuenta de un cliente.
   */
  getWalletStatementTicket(phoneNumber: string) {
    return this.http.get<{ ticketContent: string, uuid: string, nameTicket: string }>(
      `${environment.urlPOSSystem}/api/pos/wallets/${phoneNumber}/statement/ticket`
    );
  }
}
