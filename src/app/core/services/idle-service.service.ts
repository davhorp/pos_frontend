import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, timer, Subscription, merge, fromEvent } from 'rxjs';
import { switchMap, take, throttleTime } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IdleServiceService {

  private timeoutSeconds = 900;  // 1 minuto de gracia

  private userActivity$ = new Subject<void>();
  private idleSubscription?: Subscription;

  private tokenKey = 'authToken';
  private refreshTokenKey = 'refreshToken';

  constructor(
    private router: Router,
    private ngZone: NgZone
  ) {
      this.setupIdleTimer();
   }

   //Se invoca cuando hay actividad
   onUserActivity(){
    this.userActivity$.next();
   }

   setupIdleTimer() {
    // Usamos ngZone.runOutsideAngular para que el timer no dispare la detección de cambios innecesariamente
    this.ngZone.runOutsideAngular(() => {
      this.idleSubscription = this.userActivity$
        .pipe(
          // Reinicia el timer cada vez que el usuario hace algo
          switchMap(() => timer(this.timeoutSeconds * 1000))
        )
        .subscribe(() => {
          this.ngZone.run(() => this.logoutUser());
        });
    });
    
  }

   /*logoutUser() {
    console.log('Sesión expirada por inactividad');
    //this.showIdleModal.next(false);
    this.idleSubscription?.unsubscribe();
    // 1. Limpiar localStorage/Cookies
    localStorage.clear();
    // 2. Redirigir al login
    this.router.navigate(['/login']);
    // 3. Detener el timer
    this.idleSubscription?.unsubscribe();
  }*/

  /*startWarningCountdown() {
    console.log('startWarningCountdown');
    this.showIdleModal.next(true);
    // Si en 60 segundos no "renueva", hacemos logout automático
    timer(this.WARNING_TIME * 1000).pipe(take(1)).subscribe(() => {
      this.logoutUser();
    });
  }*/

  /*stayLoggedIn() {
    this.showIdleModal.next(false);
    this.setupIdleTimer(); // Reiniciamos todo el ciclo
    // OPCIONAL: Aquí podrías llamar al backend para refrescar el Token (RefreshToken)
  }*/

  logoutUser() {
    // 1. Limpiar localStorage/Cookies
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    // 2. Redirigir al login
    this.router.navigate(['/login']);
    // 3. Detener el timer
    this.idleSubscription?.unsubscribe();
  }
}
