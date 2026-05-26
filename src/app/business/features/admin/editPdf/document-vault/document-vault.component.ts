import { Component, signal, ElementRef, ViewChild } from '@angular/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PDFDocument, rgb } from 'pdf-lib';
import { FormsModule } from '@angular/forms';

interface DraggableElement {
  id: string;
  text: string;
  x: number;
  y: number;
  pageNumber: number;
}

@Component({
  selector: 'app-document-vault',
  standalone: true,
  imports: [PdfViewerModule, FormsModule],
  templateUrl: './document-vault.component.html',
  styleUrl: './document-vault.component.css'
})
export class DocumentVaultComponent {

  pdfBytes = signal<Uint8Array | null>(null);
  elements = signal<DraggableElement[]>([]);
  isEditMode = signal<boolean>(false);

  private rawPdfBytes: Uint8Array | null = null;
  
  // Dimensiones de la página renderizada para calcular coordenadas
  pdfPageWidth = signal<number>(0);
  pdfPageHeight = signal<number>(0);

  @ViewChild('pdfWrapper') pdfWrapper!: ElementRef;

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const arrayBuffer = await file.arrayBuffer();
      // LA MAGIA ESTÁ AQUÍ: slice(0) crea copias independientes en memoria
      // Copia intacta para que pdf-lib la pueda editar después
      this.rawPdfBytes = new Uint8Array(arrayBuffer.slice(0)); 
      // Copia desechable para que el visor de Angular la consuma
      this.pdfBytes.set(new Uint8Array(arrayBuffer.slice(0))); 
      this.elements.set([]);
    }
  }

  // Se dispara cuando ng2-pdf-viewer termina de pintar una página
  onPageRendered(e: CustomEvent | any) {
    // Guardamos las dimensiones exactas con las que se renderizó en pantalla
    this.pdfPageWidth.set(e.source.viewport.width);
    this.pdfPageHeight.set(e.source.viewport.height);
  }

  toggleEditMode() {
    this.isEditMode.set(!this.isEditMode());
  }

  /**
   * Registra un clic en el Overlay transparente y crea un elemento visual
   */
  addTextOnCanvas(event: MouseEvent) {
    if (!this.isEditMode()) return;

    // Obtener coordenadas relativas al contenedor del PDF
    const rect = this.pdfWrapper.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newElement: DraggableElement = {
      id: crypto.randomUUID(),
      text: 'Firma / Texto Nuevo',
      x: x,
      y: y,
      pageNumber: 1 // Por simplicidad, asumimos la página 1
    };

    this.elements.update(items => [...items, newElement]);
  }

  /**
   * Traduce las coordenadas HTML al PDF real y guarda el archivo
   */
  async savePdfChanges(): Promise<void> {
    // 3. CAMBIO: Validar contra rawPdfBytes en lugar del signal
    if (!this.rawPdfBytes || this.elements().length === 0) return;

    try {
      // 4. CAMBIO: Cargar el documento usando nuestra copia de seguridad intacta
      const pdfDoc = await PDFDocument.load(this.rawPdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const { width: realPdfWidth, height: realPdfHeight } = firstPage.getSize();
      const scaleX = realPdfWidth / this.pdfPageWidth();
      const scaleY = realPdfHeight / this.pdfPageHeight();

      for (const el of this.elements()) {
        const actualX = el.x * scaleX;
        const actualY = realPdfHeight - (el.y * scaleY); 

        firstPage.drawText(el.text, {
          x: actualX,
          y: actualY,
          size: 14,
          // Asegúrate de importar rgb de 'pdf-lib'
          color: rgb(0, 0, 0) 
        });
      }

      const modifiedPdfBytes = await pdfDoc.save();
      
      // 5. CAMBIO: Actualizar AMBAS copias con el PDF ya modificado 
      // usando slice(0) para proteger la memoria nuevamente
      this.rawPdfBytes = new Uint8Array(modifiedPdfBytes.buffer.slice(0));
      this.pdfBytes.set(new Uint8Array(modifiedPdfBytes.buffer.slice(0)));
      
      this.elements.set([]);
      this.isEditMode.set(false);

      alert('¡Documento editado y guardado correctamente!');

    } catch (error) {
      console.error('Error al guardar el PDF', error);
      alert('Hubo un error al procesar el PDF.');
    }
  }

}
