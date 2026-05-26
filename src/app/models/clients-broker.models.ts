export type ApplicationStatus = 
  | 'PROSPECT' 
  | 'SIMULATION' 
  | 'DOCUMENT_GATHERING' 
  | 'BANK_REVIEW' 
  | 'APPROVED' 
  | 'VALUATION' 
  | 'NOTARY' 
  | 'DISBURSED' 
  | 'REJECTED';

export interface ApplicationSummary {
  applicationId: string;
  clientFullName: string;
  rfc: string;
  loanAmount: number;
  productName: string | null;
  status: ApplicationStatus;
  lastUpdated: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}