import { Routes } from '@angular/router';
import { SellerLayoutComponent } from './layout/seller-layout/seller-layout.component';
import { TerminalComponent } from './terminal/terminal/terminal.component';

// Componente Layout/Wrapper para el vendedor (opcional, si tiene su propio menú superior)
// import { SellerLayoutComponent } from './layout/seller-layout.component';

export const SELLER_ROUTES: Routes = [
    {
        path: '',
        component: SellerLayoutComponent,
        children: [
            { path: 'terminal', 
                component: TerminalComponent
            },
           /* { path: 'cash-movements', loadComponent: () => import('./cash-movements/cash-movements.component').then(c => c.CashMovementsComponent) },
            { path: 'shift-close', loadComponent: () => import('./shift-close/shift-close.component').then(c => c.ShiftCloseComponent) },
            { path: 'tickets', loadComponent: () => import('./tickets/tickets.component').then(c => c.TicketsComponent) },
            { path: 'price-checker', loadComponent: () => import('./price-checker/price-checker.component').then(c => c.PriceCheckerComponent) },
            { path: '', redirectTo: 'terminal', pathMatch: 'full' }*/
    ]
    }
];