import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize, of } from 'rxjs';
import { CashRegisterShift } from '../../../models/cashRegisterShiftResponse.models';
import { environment } from '../../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { CloseShiftRequest } from '../../../models/shift/closeShiftRequest.models';
import { CloseCashShiftResponse } from '../../../models/shift/closeCashShiftResponse.models';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {

  private http = inject(HttpClient);

  private platformId = inject(PLATFORM_ID);
  public hasActiveShift = signal<boolean>(false);
  public currentShift = signal<CashRegisterShift | null>(null);

  public isCheckingStatus = signal<boolean>(true);

  /**
   * Consulta al backend si el usuario logueado actualmente (leído desde el Token JWT)
   * tiene un turno en estado 'OPEN'.
   * 
   * Si el backend no encuentra un turno abierto, Spring Boot debería 
   * retornar un 404 (Not Found) o un HTTP 200 con un cuerpo vacío (null).
   */
  checkActiveShift(): Observable<CashRegisterShift | null> {

    // 🔥 EL ESCUDO DEFINITIVO: Si estamos en el servidor SSR, abortamos la petición.
    // Devolvemos un Observable vacío 'of(null)' para que no rompa las suscripciones de los componentes.
    if (!isPlatformBrowser(this.platformId)) {
      return of(null); 
    }

    this.isCheckingStatus.set(true);
    return this.http.get<CashRegisterShift | null>(`${environment.urlPOSSystem}${environment.shift_active}`)
    .pipe(
        tap(response => {
          if (response) {
            this.hasActiveShift.set(true);
            this.currentShift.set(response);
          } else {
            // Si el backend responde 204 No Content (null)
            this.hasActiveShift.set(false);
            this.currentShift.set(null);
          }
        }),
        // 🔥 FINALIZE apaga el loader siempre, haya devuelto un turno o haya dado error (Optional.empty / 204)
        finalize(() => this.isCheckingStatus.set(false))
      );
  }

  /**
   * Envía la solicitud para abrir un nuevo turno de caja.
   * 
   * @param openingBalance La cantidad de dinero físico con la que empieza el cajero.
   * @returns El objeto del turno recién creado.
   */
  openShift(openingBalance: number): Observable<CashRegisterShift> {
    return this.http.post<CashRegisterShift>(`${environment.urlPOSSystem}${environment.shift_open}`, { openingBalance })
      .pipe(
        // 'tap' permite ejecutar lógica extra sin alterar la respuesta que llega al componente
        tap(response => {
          this.hasActiveShift.set(true);
          this.currentShift.set(response);
          console.log('Caja abierta exitosamente con ID:', response.id);
        })
      );
  }

  /**
   * Cierra el turno actual del usuario logueado.
   * 
   * @param closingBalance La cantidad de dinero físico que el cajero contó al final de su turno.
   * @returns Un resumen del turno con los descuadres calculados (si el backend lo devuelve).
   */
  closeShift(shiftId: string, request: CloseShiftRequest): Observable<CloseCashShiftResponse> {
    return this.http.post<CloseCashShiftResponse>(`${environment.urlPOSSystem}${environment.shift_close}${shiftId}/close`, request);
  }
}