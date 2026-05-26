import { SaleItemRequest } from "./saleItemRequest.models";

export interface SaleRequest {
  paymentMethod: string;
  totalAmount: number;
  amountTendered?: number;
  items: SaleItemRequest[];
  
  // Campos opcionales para métodos digitales
  cardBrand?: string;
  lastFourDigits?: string;
  authCode?: string;
  transactionNumber?: string;
  
  // 🔥 Campos para transferencia
  bankName?: string;    // Asegúrate de que el nombre sea este
  trackingKey?: string; // Asegúrate de que el nombre sea este
  
  // Campos del Monedero
  customerPhone?: string;
  walletRedeemedAmount?: number;
}