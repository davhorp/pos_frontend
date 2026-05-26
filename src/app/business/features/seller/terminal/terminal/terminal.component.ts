import { Component, HostListener, inject, OnInit, PLATFORM_ID, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, SlicePipe, UpperCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Modelos y Servicios
import { Product } from '../../../../../models/product.models';
import { CloseShiftRequest } from '../../../../../models/shift/closeShiftRequest.models';
import { environment } from '../../../../../../environments/environment';
import { ShiftService } from '../../../../../core/services/shift/shift.service';
import { CartService } from '../../../../../core/services/cart/cart.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { TicketService } from '../../../../../core/services/ticket/ticket.service';
import { WebSerialPrintService } from '../../../../../core/services/ticket/web-serial-print.service';
import { PosCheckoutComponent } from '../posCheckout/pos-checkout/pos-checkout.component';

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, SlicePipe, UpperCasePipe, DecimalPipe, PosCheckoutComponent],
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.css']
})
export class TerminalComponent implements OnInit {

  // --- Inyección de Dependencias ---
  public cartService = inject(CartService);
  public shiftService = inject(ShiftService);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private ticketService = inject(TicketService);
  private webSerialPrintService = inject(WebSerialPrintService);
  private sanitizer = inject(DomSanitizer);

  // --- Estado Global ---
  showPreviewModal = false;
  rawTicketHtml = '';
  safeTicketHtml: SafeHtml = '';
  
  // --- Búsqueda y Escáner ---
  fondoInicial = 0;
  manualBarcode = '';
  private barcodeBuffer = '';
  private barcodeTimer: any;

  // ==========================================
  // 🔥 NUEVO: CATÁLOGO Y CATEGORÍAS (Abarrotes/Farmacia)
  // ==========================================
  productsList = signal<Product[]>([]);
  activeCategory = signal<string>('TODOS');
  
  // Categorías comunes de acceso rápido
  categories = ['TODOS', 'FARMACIA', 'ABARROTES', 'BEBIDAS', 'GRANEL', 'SERVICIOS'];

  // Computed para filtrar la cuadrícula al tocar una pestaña
  filteredProducts = computed(() => {
    if (this.activeCategory() === 'TODOS') {
      return this.productsList();
    }
    // Asumiendo que tu modelo Product tiene un campo category
    return this.productsList().filter(p => p.category?.toUpperCase() === this.activeCategory());
  });

  // ==========================================
  // ESTADOS DE LA CAJA Y COBRO
  // ==========================================
  showZReportModal = signal<boolean>(false);
  safeZReportHtml: SafeHtml = '';
  rawZReportHtml = '';

  showCloseShiftModal = signal<boolean>(false);
  declaredCash = signal<number>(0);
  isClosing = signal<boolean>(false);
  closeShiftError = signal<string | null>(null);

  isCheckoutModalOpen = signal<boolean>(false);

  ngOnInit() {
    // Simulamos la carga de productos rápidos (los que no tienen código de barras)
    this.loadQuickAccessProducts();
  }

  loadQuickAccessProducts() {
    this.http.get<Product[]>(`${environment.urlPOSSystem}/api/v1/products`)
      .subscribe({
        next: (products) => this.productsList.set(products),
        error: (err) => console.error('Error cargando catálogo rápido', err)
      });
  }

  setCategory(cat: string) {
    this.activeCategory.set(cat);
  }

  addProductToCart(product: Product) {
    this.cartService.addProduct(product);
  }

  // --- APERTURA Y CIERRE DE CAJA ---
  abrirCaja() {
    this.shiftService.isCheckingStatus.set(true); 
    this.shiftService.openShift(this.fondoInicial).subscribe({
      next: () => {
        this.shiftService.isCheckingStatus.set(false);
        this.toastService.show('Caja Abierta', 'Turno iniciado.', 'success', 3000);
      },
      error: (err) => {
        this.shiftService.isCheckingStatus.set(false);
        this.toastService.show('Error', err.error?.message || 'Error de apertura', 'error', 4000);
      }
    });
  }

  openCloseShiftModal() {
    this.declaredCash.set(0); 
    this.closeShiftError.set(null);
    this.showCloseShiftModal.set(true);
  }

  cancelCloseShift() { this.showCloseShiftModal.set(false); }

  confirmCloseShift() {
    if (this.declaredCash() < 0) {
      this.closeShiftError.set('El monto declarado no puede ser negativo.');
      return;
    }
    this.isClosing.set(true);
    this.closeShiftError.set(null);

    const request: CloseShiftRequest = { declaredCash: this.declaredCash() };

    this.shiftService.checkActiveShift().subscribe({
      next: (shift) => {
        if (!shift?.id) {
          this.closeShiftError.set('No se encontró el turno activo.');
          this.isClosing.set(false);
          return;
        }

        this.shiftService.closeShift(shift.id, request).subscribe({
          next: (response) => {
            this.isClosing.set(false);
            this.showCloseShiftModal.set(false); 
            if (response.corteZ) {
               this.rawZReportHtml = this.webSerialPrintService.printViaIframe(response.corteZ);
               this.safeZReportHtml = this.sanitizer.bypassSecurityTrustHtml(this.rawZReportHtml);
               this.showZReportModal.set(true); 
            }
            this.toastService.show('Corte Z Exitoso', 'Caja cerrada.', 'success', 5000);
            this.shiftService.hasActiveShift.set(false);
          },
          error: (err) => {
            this.isClosing.set(false);
            this.closeShiftError.set(err.error?.message || 'Error al cerrar caja.');
          }
        });
      },
      error: () => {
        this.isClosing.set(false);
        this.closeShiftError.set('Error en el servidor.');
      }
    });
  }

  printZReport() {
    this.webSerialPrintService.printHtml(this.rawZReportHtml);
    this.showZReportModal.set(false);
  }

  // --- LECTOR DE CÓDIGO DE BARRAS ---
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.shiftService.hasActiveShift()) return;
    if (this.showCloseShiftModal() || this.isCheckoutModalOpen() || this.showPreviewModal || this.showZReportModal()) return;
    if (event.target instanceof HTMLInputElement) return; 
    
    if (event.key === 'Enter') {
      if (this.barcodeBuffer.length > 0) {
        this.searchAndAddProduct(this.barcodeBuffer);
        this.barcodeBuffer = '';
      }
    } else if (event.key.length === 1) {
      this.barcodeBuffer += event.key;
      clearTimeout(this.barcodeTimer);
      this.barcodeTimer = setTimeout(() => this.barcodeBuffer = '', 300); 
    }
  }

  searchManualBarcode() {
    const code = this.manualBarcode.trim();
    if (code.length > 0) {
      this.searchAndAddProduct(code);
      this.manualBarcode = ''; 
    }
  }

  private searchAndAddProduct(barcode: string) {
    this.http.get<Product>(`${environment.urlPOSSystem}${environment.search_product}${barcode}`)
      .subscribe({
        next: (product) => this.cartService.addProduct(product),
        error: () => this.toastService.show('No Encontrado', `SKU ${barcode} no existe.`, 'error', 3000)
      });
  }

  // --- FLUJO DE COBRO ---
  openCheckoutModal() {
    if (this.cartService.cart().length === 0) return;
    this.isCheckoutModalOpen.set(true);
  }

  closeCheckoutModal() { this.isCheckoutModalOpen.set(false); }

  handlePaymentSuccess(ticketId: string) {
    this.isCheckoutModalOpen.set(false);
    this.cartService.clearCart();        
    this.onCheckoutSuccess(ticketId);
  }

  onCheckoutSuccess(ticketId: string) {
    this.ticketService.getTicket(ticketId).subscribe({
      next: (ticketRes) => {
        this.rawTicketHtml = this.webSerialPrintService.generateTicketHtml(ticketRes.ticketContent, ticketRes.uuid);
        this.safeTicketHtml = this.sanitizer.bypassSecurityTrustHtml(this.rawTicketHtml);
        this.showPreviewModal = true;
      }
    });
  }

  confirmPrint() {
    this.webSerialPrintService.printHtml(this.rawTicketHtml);
    this.showPreviewModal = false; 
  }
  closeModal() { this.showPreviewModal = false; }
}