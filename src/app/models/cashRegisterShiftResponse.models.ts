export interface CashRegisterShift {
  id: string;          // UUID en Java se recibe como string
  openedAt: string;    // Fechas en formato ISO string
  closedAt: string | null;
  openingBalance: number;
  closingBalance: number | null;
  status: 'OPEN' | 'CLOSED';
  username: string;
}