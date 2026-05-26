interface RecentTransaction {
  id: string;
  time: string;
  cashier: string;
  method: 'EFECTIVO' | 'TARJETA' | 'SPEI' | 'QR';
  amount: number;
  status: 'COMPLETADO' | 'REEMBOLSO';
}