import { Component, signal, computed, inject, Input, Output, EventEmitter, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../../../environments/environment';
import { CartService } from '../../../../../../core/services/cart/cart.service';
import { SaleRequest } from '../../../../../../models/sale/saleRequest.models';
import { SaleService } from '../../../../../../core/services/sale/sale.service';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-pos-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, QRCodeModule],
  templateUrl: './pos-checkout.component.html',
  styleUrl: './pos-checkout.component.css'
})
export class PosCheckoutComponent {

  private http = inject(HttpClient);
  private saleService = inject(SaleService);
  public cartService = inject(CartService);

  @Input({ required: true }) set amountToCharge(val: number) {
    this.totalSale.set(val);
  }

  @Output() paymentCompleted = new EventEmitter<string>(); 
  @Output() cancelCheckout = new EventEmitter<void>();

  // ==========================================
  // ESTADOS DEL COMPONENTE
  // ==========================================
  totalSale = signal<number>(0); 
  paymentMethod = signal<'EFECTIVO' | 'TARJETA' | 'SPEI' | 'QR' | 'MONEDERO'>('EFECTIVO');
  transactionNumber = signal<string>(''); 
  isProcessingPayment = signal<boolean>(false);

  // 🔥 NUEVO: Estados para cobro en Efectivo
  amountTendered = signal<number | null>(null); 

  // Variables del Monedero Electrónico
  customerPhone = signal<string>('');
  walletBalance = signal<number>(0);       
  isSearchingWallet = signal<boolean>(false);
  walletChecked = signal<boolean>(false);   

  cardBrand = signal<string>('VISA'); 
  lastFourDigits = signal<string>('');
  authCode = signal<string>('');

  transferBank = signal<string>('BBVA');
  trackingKey = signal<string>('');

  qrMode = signal<'DYNAMIC' | 'STATIC'>('DYNAMIC');
  qrOperationNumber = signal<string>('');
  qrDynamicData = '';
  totalToPay = 0;

  private readonly ACCUMULATION_RATE = 0.02;

  constructor() {
  // 🔥 Este effect vigila los cambios en el monto y el banco
  effect(() => {
    const monto = this.finalAmountToPay();
    const banco = this.transferBank();
    
    // Solo regenera si el método seleccionado es QR
    if (this.paymentMethod() === 'QR') {
      this.generateDynamicQR();
    }
  });
}

  // ==========================================
  // CÁLCULOS REACTIVOS (Computed)
  // ==========================================
  estimatedEarnings = computed(() => this.totalSale() * this.ACCUMULATION_RATE);

  walletDiscount = computed(() => {
    if (this.paymentMethod() === 'MONEDERO') return Math.min(this.totalSale(), this.walletBalance());
    return 0;
  });

  finalAmountToPay = computed(() => {
    if (this.paymentMethod() === 'MONEDERO') {
      const remainder = this.totalSale() - this.walletBalance();
      return remainder > 0 ? remainder : 0;
    }
    return this.totalSale();
  });

  // OPCIONAL: Si permites que el cajero cambie de banco en el modal,
  // puedes llamar a esta función para que el QR se actualice en tiempo real
  onBankChange() {
    this.generateDynamicQR();
  }

  /**
   * Genera el payload que el cliente leerá con su celular.
   * Puede ser un simple texto, un JSON, o un formato bancario específico (como CoDi o un link de MercadoPago).
   */
 generateDynamicQR() {
    const transferInfo = {
      banco: this.transferBank(), // Accede al valor del signal con ()
      clabe: '012345678901234567',
      monto: this.finalAmountToPay(), // 🔥 Usa el signal reactivo
      concepto: 'Compra POS'
    };
    
    this.qrDynamicData = JSON.stringify(transferInfo);
  }

  // 🔥 NUEVO: Cálculo de cambio en tiempo real
  changeAmount = computed(() => {
    const tendered = this.amountTendered() || 0;
    const toPay = this.finalAmountToPay();
    return tendered > toPay ? tendered - toPay : 0;
  });

  // 🔥 NUEVO: Validación de seguridad para bloquear el botón de cobrar
  isPaymentValid = computed(() => {
    if (this.paymentMethod() === 'EFECTIVO') {
      return (this.amountTendered() || 0) >= this.finalAmountToPay();
    }
    // Añadimos el QR a la regla que exige escribir el número de transacción
    if (this.paymentMethod() === 'TARJETA' || this.paymentMethod() === 'SPEI' || this.paymentMethod() === 'QR') {
      return this.transactionNumber().trim().length > 0;
    }
    return true; 
  });

  // ==========================================
  // LÓGICA DE NEGOCIO
  // ==========================================
  setPaymentMethod(method: 'EFECTIVO' | 'TARJETA' | 'SPEI' | 'QR' | 'MONEDERO') {
  this.paymentMethod.set(method);
  
  // Si no es efectivo ni monedero, limpiamos campos de efectivo
  if (method !== 'EFECTIVO' && method !== 'MONEDERO') {
    this.amountTendered.set(null); 
  }
  
  // Si no es tarjeta/spei/qr, limpiamos el folio
  if (method === 'EFECTIVO' || method === 'MONEDERO') {
    this.transactionNumber.set(''); 
  }

  if (method !== 'TARJETA') {
     this.lastFourDigits.set('');
     this.authCode.set('');
  }

  if (method !== 'SPEI') {
     this.transferBank.set('BBVA');
     this.trackingKey.set('');
  }

  if (method === 'QR') {
    this.transactionNumber.set(''); // Usaremos transactionNumber para el rastreo del QR
  }
}

  // Funciones rápidas para efectivo
  setExactAmount() { this.amountTendered.set(this.finalAmountToPay()); }
  setQuickAmount(amount: number) { this.amountTendered.set(amount); }

  checkWalletStatus() {
    const phone = this.customerPhone().trim();
    if (phone.length < 10) return;
    this.isSearchingWallet.set(true);
    this.walletChecked.set(false);

    const url = `${environment.urlPOSSystem}/api/v1/wallets/check`;
    const params = new HttpParams().set('phoneNumber', phone);

    this.http.get<{ balance: number }>(url, { params }).subscribe({
      next: (res) => {
        this.walletBalance.set(res.balance);
        this.isSearchingWallet.set(false);
        this.walletChecked.set(true);
      },
      error: () => {
        this.walletBalance.set(0);
        this.isSearchingWallet.set(false);
        this.walletChecked.set(true);
      }
    });
  }

  cancelar() { this.cancelCheckout.emit(); }

  confirmarPago() {
    if (!this.isPaymentValid()) return;

    this.isProcessingPayment.set(true);

    const itemsPayload = this.cartService.cart().map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.product.price 
    }));

    const saleRequest: SaleRequest = {
      paymentMethod: this.paymentMethod(),
      totalAmount: this.totalSale(),
      amountTendered: this.paymentMethod() === 'EFECTIVO' ? (this.amountTendered() || this.totalSale()) : this.totalSale(),
      items: itemsPayload,
      // 🔥 Nuevos campos mapeados
      cardBrand: this.paymentMethod() === 'TARJETA' ? this.cardBrand() : undefined,
      lastFourDigits: this.paymentMethod() === 'TARJETA' ? this.lastFourDigits() : undefined,
      authCode: this.paymentMethod() === 'TARJETA' ? this.authCode() : undefined,
      customerPhone: this.customerPhone().trim() || undefined,
      walletRedeemedAmount: this.paymentMethod() === 'MONEDERO' ? this.walletDiscount() : 0,

      bankName: this.paymentMethod() === 'SPEI' ? this.transferBank() : undefined,
      trackingKey: this.paymentMethod() === 'SPEI' ? this.trackingKey() : undefined,
      transactionNumber: this.transactionNumber() || this.trackingKey() || undefined,
    };

    this.saleService.processCheckout(saleRequest).subscribe({
      next: (response) => {
        this.isProcessingPayment.set(false);
        this.paymentCompleted.emit(response.ticketId); 
      },
      error: (err) => {
        this.isProcessingPayment.set(false);
        alert(`Error al procesar el pago: ${err.error?.message || err.message}`);
      }
    });
  }

}
