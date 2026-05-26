import { Injectable } from '@angular/core';
import JsBarcode from 'jsbarcode';

@Injectable({
  providedIn: 'root'
})
export class WebSerialPrintService {

  // Mantiene la conexión abierta para no preguntar en cada venta
  private port: any; 

  // Recibimos el texto limpio de Java Y el ID de la venta
  async connectAndPrint(ticketText: string, ticketId: string): Promise<void> {
    if (!('serial' in navigator)) {
      alert('Usa Google Chrome o Edge para imprimir tickets.');
      return;
    }

    try {
      if (!this.port) {
        this.port = await (navigator as any).serial.requestPort();
        await this.port.open({ baudRate: 9600 }); 
      }

      const writer = this.port.writable.getWriter();
      const encoder = new TextEncoder();

      // 1. COMANDOS BÁSICOS
      const INIT = new Uint8Array([0x1B, 0x40]); // Iniciar impresora
      const ALIGN_CENTER = new Uint8Array([0x1B, 0x61, 0x01]); // Centrar
      const ALIGN_LEFT = new Uint8Array([0x1B, 0x61, 0x00]); // Izquierda
      const CUT = new Uint8Array([0x1D, 0x56, 0x41, 0x10]); // Cortar papel

      // 2. ENVIAR TEXTO DEL TICKET (Lo que armó Java)
      await writer.write(INIT);
      await writer.write(encoder.encode(ticketText));

      // 3. 🔥 DIBUJAR CÓDIGO DE BARRAS DESDE ANGULAR 🔥
      const shortId = ticketId.substring(0, 8).toUpperCase();
      
      await writer.write(ALIGN_CENTER); // Centramos el barcode
      
      // GS h 80 (Altura del código: 80 puntos)
      await writer.write(new Uint8Array([0x1D, 0x68, 80])); 
      
      // GS H 2 (Poner el texto corto debajo de las barras)
      await writer.write(new Uint8Array([0x1D, 0x48, 2])); 
      
      // GS k 4 [datos] 0x00 (Imprimir CODE39)
      await writer.write(new Uint8Array([0x1D, 0x6B, 4]));
      await writer.write(encoder.encode(shortId)); // Ej. A1B2C3D4
      await writer.write(new Uint8Array([0x00])); // Terminador Nulo (En JS sí funciona)

      // 4. ESPACIO FINAL Y CORTE
      await writer.write(ALIGN_LEFT);
      await writer.write(encoder.encode('\n\n\n\n\n')); // Espacio para que el papel salga
      await writer.write(CUT); 

      writer.releaseLock();
      console.log('¡Ticket y Barcode impresos desde Angular!');

    } catch (error) {
      console.error(error);
      this.port = null;
    }
  }

  /**
   * Imprime el texto formateado usando el sistema del Sistema Operativo
   * de forma invisible mediante un Iframe.
   */
  printViaIframe(ticketText: string): string {
    return `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { margin: 0; }
            body { 
                margin: 0; 
                padding: 0;
                font-family: 'Courier New', Courier, monospace; 
                font-size: 7.3px; 
                color: #000000;
                background-color: #FFFFFF;
                text-rendering: geometricPrecision;
              }
            .ticket-text { white-space: pre-wrap; }
            .barcode-container { text-align: center; margin-top: 10px; margin-bottom: 25px; }
            .barcode-container svg { max-width: 90%; height: auto; }
          </style>
        </head>
        <body>
          <div class="ticket-text">${ticketText}</div>
          <div>
            --------------------------------------------
            <br><br> <!-- Espacio para que el papel salga después de imprimir -->
          </div>
        </body>
      </html>
    `;
  }

  /**
   * 1. Solo genera el código HTML estático del ticket (Ideal para previsualizar)
   */
  generateTicketHtml(ticketText: string, ticketId: string): string {
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    JsBarcode(svgElement, ticketId, {
      format: 'CODE39',
      width: 1.5,
      height: 40,
      displayValue: true,
      fontSize: 14,
      margin: 0
    });

    const barcodeSvgHtml = svgElement.outerHTML;

    return `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { margin: 0; }
            body { 
                margin: 0; 
                padding: 0;
                font-family: 'Courier New', Courier, monospace; 
                font-size: 7.3px; 
                color: #000000;
                background-color: #FFFFFF;
                text-rendering: geometricPrecision;
              }
            .ticket-text { white-space: pre-wrap; }
            .barcode-container { text-align: center; margin-top: 10px; margin-bottom: 25px; }
            .barcode-container svg { max-width: 90%; height: auto; }
          </style>
        </head>
        <body>
          <div class="ticket-text">${ticketText}</div>
          <div class="barcode-container">
            ${barcodeSvgHtml}
          </div>
          <div>
            -----------------------------------------
            <br><br> <!-- Espacio para que el papel salga después de imprimir -->
          </div>
        </body>
      </html>
    `;
  }

  /**
   * 2. Recibe el HTML ya armado y lo imprime de forma invisible
   */
  printHtml(htmlContent: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 3000);
      }, 250);
    }
  }
}
