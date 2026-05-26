export interface CloseCashShiftResponse {
  id: string;
  openedAt: string;
  closedAt: string;
  openingBalance: number;
  closingBalance: number;
  status: string;
  username: string;
  corteZ : string;
  discrepancy?: number;
  closingTicketHtml?: string;
}