import { Component, HostListener, inject, OnInit, PLATFORM_ID, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, isPlatformBrowser, SlicePipe, UpperCasePipe } from '@angular/common';
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
import { WalletService } from '../../../../../core/services/wallet/wallet.service';

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, SlicePipe, UpperCasePipe, DecimalPipe, PosCheckoutComponent],
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.css']
})
export class TerminalComponent implements OnInit {

  private platformId = inject(PLATFORM_ID);

  // --- Inyección de Dependencias ---
  public cartService = inject(CartService);
  public shiftService = inject(ShiftService);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private ticketService = inject(TicketService);
  private webSerialPrintService = inject(WebSerialPrintService);
  private sanitizer = inject(DomSanitizer);
  private walletService = inject(WalletService);

  // --- Estado Global ---
  showPreviewModal = false;
  rawTicketHtml = '';
  safeTicketHtml: SafeHtml = '';
  
  // --- Búsqueda y Escáner ---
  fondoInicial = 0;
  manualBarcode = '';
  customerPhone = signal<string>('');
  isEmailModalOpen = signal<boolean>(false);
  private barcodeBuffer = '';
  private barcodeTimer: any;

  // ==========================================
  // 🔥 NUEVO: CATÁLOGO Y CATEGORÍAS (Abarrotes/Farmacia)
  // ==========================================
  productsList = signal<Product[]>([]);
  activeCategory = signal<string>('TODOS');

  searchTerm = signal<string>('');
  
  // Categorías comunes de acceso rápido
  categories = ['TODOS', 'FARMACIA', 'ABARROTES', 'BEBIDAS', 'GRANEL', 'SERVICIOS'];

  // Computed para filtrar la cuadrícula al tocar una pestaña
 filteredProducts = computed(() => {
  const term = this.searchTerm().trim().toLowerCase();
  const category = this.activeCategory(); 
  const allProducts = this.productsList(); 

  return allProducts.filter(p => {
    // 1. Filtro de Categoría: Siempre activo
    // Si la categoría es 'TODOS', se cumple para todos los productos.
    const matchesCategory = (category === 'TODOS' || p.category === category);
    
    // 2. Filtro de Búsqueda: Solo se evalúa si hay un término
    const matchesSearch = term.length === 0 || 
                          p.barcode.toLowerCase().includes(term) || 
                          p.name.toLowerCase().includes(term);

    // El producto debe cumplir AMBAS condiciones para mostrarse
    return matchesCategory && matchesSearch;
  });
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

  isCloseShiftModalOpen = signal<boolean>(false);
  isProcessingClose = signal<boolean>(false);
  actualCashInDrawer = signal<number | null>(null);
  isSendingEmail = signal<boolean>(false);


  // Signal para controlar el nuevo modal buscador
isWalletSearchModalOpen = signal<boolean>(false);
walletPhoneInput = signal<string>('');

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadQuickAccessProducts();
    }
  }

  loadQuickAccessProducts() {
    this.http.get<Product[]>(`${environment.urlPOSSystem}${environment.all_products_active}`)
      .subscribe({
        next: (products) => this.productsList.set(products),
        error: (err) => console.error('Error cargando catálogo rápido', err)
      });
  }

  setCategory(cat: string) {
    this.searchTerm.set(''); // Limpiamos el término de búsqueda al cambiar de categoría
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

  /**
   * Cierra el modal de cierre de turno.
   */
  closeShiftModal() {
    if (this.isProcessingClose()) return;
    this.isCloseShiftModalOpen.set(false);
  }

  openCloseShiftModal() {
    this.declaredCash.set(0); 
    this.closeShiftError.set(null);
    this.showCloseShiftModal.set(true);

    this.actualCashInDrawer.set(null);
    this.isCloseShiftModalOpen.set(true);
  }

  cancelCloseShift() { this.showCloseShiftModal.set(false); }

  confirmCloseShift() {

    if (this.actualCashInDrawer() === null) return;
    
    this.isProcessingClose.set(true);

    if (this.declaredCash() < 0) {
      this.closeShiftError.set('El monto declarado no puede ser negativo.');
      return;
    }
    this.isClosing.set(true);
    this.closeShiftError.set(null);

    const request: CloseShiftRequest = { declaredCash: this.actualCashInDrawer()! };

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
               this.isProcessingClose.set(false);
              this.isCloseShiftModalOpen.set(false);
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
    this.fondoInicial = 0;
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
      // Limpiamos ambos inputs al terminar de agregar el producto
      this.manualBarcode = ''; 
      this.searchTerm.set(''); 
    }
  }

  onSearchInput(value: string) {
    this.searchTerm.set(value);
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

  /**
   * Maneja el cambio de cantidad manual para productos a granel (decimales).
   */
  onGranelQuantityChange(productId: string, value: any) {
    const numericValue = parseFloat(value);
    
    // Solo actualiza si es un número válido y mayor a cero
    if (!isNaN(numericValue) && numericValue > 0) {
      this.cartService.updateQuantity(productId, numericValue);
    } else if (value === '' || numericValue === 0) {
      // Opcional: Si borra todo, puedes decidir si eliminar el producto o dejarlo en 0 temporalmente
      // this.cartService.removeItem(productId);
    }
  }

  confirmPrint() {
    console.log('Imprimiendo ticket...');
    console.log(this.rawTicketHtml);
    this.webSerialPrintService.printHtml(this.rawTicketHtml);
    this.showPreviewModal = false; 
  }

  closeModal() { this.showPreviewModal = false; }

  imprimirEstadoCuenta() {
    const phone = this.customerPhone().trim();
    if (phone.length !== 10) return;

    this.ticketService.getWalletStatementTicket(phone).subscribe({
      next: (res) => {
        // Usamos tu servicio de impresión serial web existente
        this.webSerialPrintService.printHtml(res.ticketContent);
        this.toastService.show('Imprimiendo', 'Estado de cuenta enviado a la impresora.', 'success', 3000);
      },
      error: (err) => {
        this.toastService.show('Error', 'No se pudo generar el estado de cuenta.', 'error', 3000);
      }
    });
  }

  /**
 * Abre el modal de envío de correo
 */
abrirModalEmail() {
  if (this.walletPhoneInput().length !== 10) {
    this.toastService.show('Atención', 'Primero debes tener un número de teléfono válido.', 'warning', 3000);
    return;
  }
  this.isEmailModalOpen.set(true);
}

/**
 * Cierra el modal de envío de correo
 */
closeEmailModal() {
  this.isEmailModalOpen.set(false);
}

/**
 * Lógica para enviar el PDF por correo
 */
confirmSendEmail(email: string) {
  const phone = this.walletPhoneInput(); // O el teléfono que tengas en tu buscador
  // Validación básica antes de enviar
  if (!email || !email.includes('@')) {
    this.toastService.show('Error', 'Ingrese un correo electrónico válido.', 'error', 3000);
    return;
  }
  this.isSendingEmail.set(true);
  // Llamada al servicio
  this.walletService.sendEmailStatement(phone, email).subscribe({
    next: (response) => {
      this.toastService.show('Éxito', response, 'success', 3000);
      this.isSendingEmail.set(false); // Desactivamos carga
      this.closeEmailModal() // Cerrar modal tras éxito
    },
    error: (err) => {
      console.error('Error enviando correo:', err);
      this.toastService.show('Error', 'No se pudo enviar el correo.', 'error', 3000);
      this.isSendingEmail.set(false); // Desactivamos carga aunque falle
    }
  });
}

openWalletSearchModal() {
  this.walletPhoneInput.set('');
  this.isWalletSearchModalOpen.set(true);
}

closeWalletSearchModal() {
  this.isWalletSearchModalOpen.set(false);
}

// Método para disparar la acción después de buscar el teléfono
handleWalletAction(action: 'PRINT' | 'EMAIL') {
  const phone = this.walletPhoneInput();
  if (phone.length !== 10) {
    this.toastService.show('Error', 'Ingrese un teléfono de 10 dígitos.', 'error', 3000);
    return;
  }
  
  if (action === 'PRINT') {
    this.imprimirEstadoCuentaDesdeModal(phone);
  } else {
    this.abrirModalEmail(); // Reutilizamos el modal que ya tienes
  }
  this.closeWalletSearchModal();
}

imprimirEstadoCuentaDesdeModal(phone: string) {
  this.ticketService.getWalletStatementTicket(phone).subscribe({
    next: (res) => {
      console.log('Impresión solicitada al servicio de impresión serial web.');
      this.rawTicketHtml = this.webSerialPrintService.printViaIframeWallet(res.ticketContent);
      this.safeTicketHtml = this.sanitizer.bypassSecurityTrustHtml(this.rawTicketHtml);
      this.showPreviewModal = true;
      this.toastService.show('Éxito', 'Imprimiendo estado de cuenta...', 'success', 3000);
    },
    error: () => this.toastService.show('Advertencia', 'No se encontró el monedero.', 'warning', 3000)
  });
}

}