import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  constructor() { }

  // Signal reactivo para leer el estado desde cualquier componente
  isLoading = signal<boolean>(false);
  
  // Contador para manejar peticiones simultáneas
  private activeRequests = 0;

  show() {
    this.activeRequests++;
    this.isLoading.set(true);
  }

  hide() {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0; // Prevenir números negativos
      this.isLoading.set(false);
    }
  }
}
