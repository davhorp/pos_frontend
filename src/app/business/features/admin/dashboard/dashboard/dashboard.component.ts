import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { AbsPipe } from '../../../../../pipes/abs.pipe';
import { FormsModule } from '@angular/forms';

// 🔥 1. PEGA ESTAS INTERFACES AQUÍ (Fuera de la clase)
interface SalesMetric {
  title: string;
  value: number;
  percentageChange: number;
  icon: string;
  isCurrency: boolean;
}

interface DashboardResponse {
  metrics: SalesMetric[];
  paymentMethods: PaymentMethodData[];
}

interface RecentTransaction {
  id: string;
  time: string;
  cashier: string;
  method: 'EFECTIVO' | 'TARJETA' | 'SPEI' | 'QR';
  amount: number;
  status: 'COMPLETADO' | 'REEMBOLSO';
}

export interface PaymentMethodData {
  name: string;
  amount: number;
  color: string;
}

type FilterType = 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, CurrencyPipe, AbsPipe, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})

export class DashboardComponent  implements OnInit {

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  // ==========================================
  // ESTADO DE FILTROS (Signals)
  // ==========================================
  activeFilter = signal<FilterType>('TODAY');
  startDate = signal<string>(this.formatDate(new Date()));
  endDate = signal<string>(this.formatDate(new Date()));

  quickFilters = [
    { label: 'Hoy', value: 'TODAY' as FilterType },
    { label: 'Esta Semana', value: 'WEEK' as FilterType },
    { label: 'Este Mes', value: 'MONTH' as FilterType },
    { label: 'Este Trimestre', value: 'QUARTER' as FilterType },
    { label: 'Este Año', value: 'YEAR' as FilterType }
  ];

  // ==========================================
  // ESTADO DE DATOS (Signals)
  // ==========================================
  metrics = signal<SalesMetric[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Esto buscará automáticamente la tarjeta que tenga la palabra "Ventas" y extraerá su valor.
  totalSales = computed(() => {
    const ventasMetric = this.metrics().find(m => m.title.toLowerCase().includes('ventas'));
    return ventasMetric ? ventasMetric.value : 0;
  });

  secondaryMetrics = computed(() => {
    return this.metrics().filter(m => !m.title.toLowerCase().includes('Ventas Hoy'));
  });

  // 2. Desglose por Método de Pago (Para una gráfica de pastel o barras)
  paymentMethods = signal<PaymentMethodData[]>([]);
  // 3. Tabla de Últimas Ventas
  recentTransactions = signal<RecentTransaction[]>([
    { id: 'TX-8821', time: '12:35 PM', cashier: 'María L.', method: 'EFECTIVO', amount: 150.00, status: 'COMPLETADO' },
    { id: 'TX-8820', time: '12:22 PM', cashier: 'María L.', method: 'TARJETA', amount: 340.50, status: 'COMPLETADO' },
    { id: 'TX-8819', time: '11:45 AM', cashier: 'Carlos M.', method: 'QR', amount: 85.00, status: 'COMPLETADO' },
    { id: 'TX-8818', time: '11:10 AM', cashier: 'María L.', method: 'SPEI', amount: 560.00, status: 'COMPLETADO' },
    { id: 'TX-8817', time: '10:05 AM', cashier: 'Carlos M.', method: 'TARJETA', amount: 120.00, status: 'REEMBOLSO' }
  ]);

  // ==========================================
  // CICLO DE VIDA
  // ==========================================
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.applyFilter('TODAY');
    }
  }

  // ==========================================
  // LÓGICA DE FILTROS
  // ==========================================
  applyFilter(type: FilterType) {
    this.activeFilter.set(type);
    
    if (type !== 'CUSTOM') {
      const { start, end } = this.calculateDateRange(type);
      this.startDate.set(this.formatDate(start));
      this.endDate.set(this.formatDate(end));
    }
    this.loadMetrics();
  }

  onCustomDateChange() {
    this.activeFilter.set('CUSTOM');
    this.loadMetrics();
  }

  // ==========================================
  // LLAMADA HTTP (Backend)
  // ==========================================
  private loadMetrics(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    // NOTA: Para que el filtro funcione en el backend, deberás modificar tu endpoint en 
    // Spring Boot para que acepte parámetros startDate y endDate:
    // const url = `${environment.urlPOSSystem}${environment.loadMetrics_admin}?start=${this.startDate()}&end=${this.endDate()}`;
    const params = new HttpParams()
      .set('startDate', this.startDate())
      .set('endDate', this.endDate());
    console.log(`Cargando métricas con filtro: ${this.activeFilter()} (${this.startDate()} - ${this.endDate()})`);
    this.http.get<DashboardResponse>(environment.urlPOSSystem.concat(environment.loadMetrics_admin), { params }).subscribe({
      next: (data) => {
        this.metrics.set(data.metrics); 
        this.paymentMethods.set(data.paymentMethods);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar las métricas:', err);
        this.error.set('No se pudieron cargar los datos del dashboard.');
        this.isLoading.set(false);
      }
    });
  }

  // ==========================================
  // UTILIDADES UI Y FECHAS
  // ==========================================
  getMethodClass(method: string): string {
    const classes: Record<string, string> = {
      'EFECTIVO': 'badge-success',
      'TARJETA': 'badge-primary',
      'SPEI': 'badge-purple',
      'QR': 'badge-warning'
    };
    return classes[method] || 'badge-default';
  }

  calculatePercentage(amount: number): number {
    const total = this.paymentMethods().reduce((sum, m) => sum + m.amount, 0);
    return total > 0 ? (amount / total) * 100 : 0;
  }

  private calculateDateRange(type: FilterType): { start: Date, end: Date } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = new Date(today);
    let end = new Date(today);

    switch (type) {
      case 'TODAY':
        break; // start y end son hoy
      case 'WEEK':
        console.log('Calculando rango semanal...');
        const day = today.getDay();
        console.log(`Día de la semana (0=Dom, 1=Lun, ...): ${day}`);
        // Ajustamos para que la semana empiece en Lunes (1) y no en Domingo (0)
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        console.log(`Diferencia para ajustar al lunes: ${diff}`);
        start = new Date(today); // Clonamos para no mutar 'today'
        console.log(`Fecha antes de ajuste: ${start}`);
        start.setDate(diff);
        console.log(`Fecha de inicio de semana: ${start}`);
        break;
      case 'MONTH':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'QUARTER':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), currentQuarter * 3, 1);
        break;
      case 'YEAR':
        start = new Date(today.getFullYear(), 0, 1);
        break;
    }
    return { start, end };
  }

  private formatDate(date: Date): string {
    // Extraemos el año, mes y día de la zona horaria LOCAL del navegador, no del UTC.
    const year = date.getFullYear();
    // Le sumamos 1 al mes porque en JavaScript los meses van de 0 a 11
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Retorna el formato estricto YYYY-MM-DD que necesitan los <input type="date">
    return `${year}-${month}-${day}`;
  }

  downloadReport() {
    console.log(`Generando reporte Z del ${this.startDate()} al ${this.endDate()}`);
    // Aquí podrías llamar a otro endpoint de Spring Boot que devuelva un PDF/Excel
  }
  
}
