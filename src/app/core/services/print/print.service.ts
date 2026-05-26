import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PrintService {
  
  imprimirConvenio(datos: any) {
    // En una app real, podrías abrir una nueva pestaña con una ruta específica
    // Aquí simplemente activamos el diálogo de impresión del navegador
    window.print();
  }
}