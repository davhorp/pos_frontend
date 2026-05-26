import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
   { 
        path: 'admin', 
        //canActivate: [roleGuard(['admin'])],
        loadChildren: () => import('./business/features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
    },
    // NUEVA RUTA PARA EL SELLER
    { 
        path: 'seller', 
        // canActivate: [roleGuard(['ADMIN', 'SELLER'])], // Un admin también debería poder operar una caja
        loadChildren: () => import('./business/features/seller/seller.routes').then(m => m.SELLER_ROUTES)
    },
    {
        path: 'login',
        loadComponent: ()=> import('./business/authentication/login/login.component'),
        //canActivate: [AuthenticatedGuard]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
