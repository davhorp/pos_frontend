import { Injectable } from '@angular/core';
import { createWorker } from 'tesseract.js';

@Injectable({
  providedIn: 'root'
})
export class OcrService {

  constructor() { }

  async extractCurpFromImage(imagePath: string): Promise<string> {
    const worker = await createWorker('spa'); // Usar idioma español
    const ret = await worker.recognize(imagePath);
    const text = ret.data.text;
    await worker.terminate();

    return this.findCurpInText(text);
  }

  private findCurpInText(text: string): string {
    const curpRegex = /[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]{2}/;
    const match = text.match(curpRegex);
    return match ? match[0] : 'CURP no encontrada';
  }

}
