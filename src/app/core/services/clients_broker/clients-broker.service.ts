import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { ApplicationStatus, ApplicationSummary, Page } from '../../../models/clients-broker.models';

@Injectable({
  providedIn: 'root'
})
export class ClientsBrokerService {

  // Datos simulados (Mock Data) para el mercado mexicano
  private mockData: ApplicationSummary[] = [
    { applicationId: 'uuid-1', clientFullName: 'Carlos Slim Helú', rfc: 'SIHC400128XXX', loanAmount: 15000000, productName: 'Hipoteca Fija Banorte', status: 'DISBURSED', lastUpdated: new Date().toISOString() },
    { applicationId: 'uuid-2', clientFullName: 'María Félix', rfc: 'FEMA140408XXX', loanAmount: 2500000, productName: 'Hipoteca Perfiles Banamex', status: 'NOTARY', lastUpdated: new Date(Date.now() - 86400000).toISOString() },
    { applicationId: 'uuid-3', clientFullName: 'Guillermo del Toro', rfc: 'TOGG641009XXX', loanAmount: 4800000, productName: 'Hipoteca Libre Santander', status: 'APPROVED', lastUpdated: new Date(Date.now() - 172800000).toISOString() },
    { applicationId: 'uuid-4', clientFullName: 'Salma Hayek', rfc: 'HAJS660902XXX', loanAmount: 8500000, productName: null, status: 'BANK_REVIEW', lastUpdated: new Date(Date.now() - 259200000).toISOString() },
    { applicationId: 'uuid-5', clientFullName: 'Vicente Fernández', rfc: 'FEGV400217XXX', loanAmount: 1200000, productName: 'Apoyo Infonavit Scotiabank', status: 'DOCUMENT_GATHERING', lastUpdated: new Date(Date.now() - 345600000).toISOString() },
    { applicationId: 'uuid-6', clientFullName: 'Frida Kahlo', rfc: 'KACF070706XXX', loanAmount: 900000, productName: 'Hipoteca Fija BBVA', status: 'REJECTED', lastUpdated: new Date(Date.now() - 432000000).toISOString() },
    { applicationId: 'uuid-7', clientFullName: 'Diego Rivera', rfc: 'RIVD861208XXX', loanAmount: 3200000, productName: null, status: 'SIMULATION', lastUpdated: new Date(Date.now() - 518400000).toISOString() },
    { applicationId: 'uuid-8', clientFullName: 'Juan Gabriel', rfc: 'GAJA500107XXX', loanAmount: 1800000, productName: null, status: 'PROSPECT', lastUpdated: new Date(Date.now() - 604800000).toISOString() },
    { applicationId: 'uuid-9', clientFullName: 'Luis Miguel', rfc: 'MIGL700419XXX', loanAmount: 11500000, productName: 'Hipoteca Premier HSBC', status: 'VALUATION', lastUpdated: new Date(Date.now() - 691200000).toISOString() },
  ];

  getPipeline(page: number = 0, size: number = 5): Observable<Page<ApplicationSummary>> {
    const start = page * size;
    const end = start + size;
    const paginatedContent = this.mockData.slice(start, end);

    const mockResponse: Page<ApplicationSummary> = {
      content: paginatedContent,
      totalElements: this.mockData.length,
      totalPages: Math.ceil(this.mockData.length / size),
      number: page,
      size: size
    };

    // Retornamos los datos con un retraso de 800ms para simular internet
    return of(mockResponse).pipe(delay(800));
  }
}
