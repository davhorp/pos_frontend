import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    // Opcional: Un componente 'Layout' que contenga el Sidebar y Navbar de Admin
    loadComponent: () => import('./layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        title: 'Panel de Control - Admin',
        loadComponent: () => import('./dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
     {
        path: 'usuarios',
        title: 'Editar PDFs - Admin',
        loadComponent: () => import('./editPdf/document-vault/document-vault.component').then(m => m.DocumentVaultComponent)
      },
    /*  {
        path: 'configuracion',
        title: 'Configuración del Ciclo Escolar',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      },*/
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];