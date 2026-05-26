import { Component, signal} from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../../core/services/toast.service';

interface MenuItem {
  title: string;
  icon: string; // Puede ser un emoji o la clase de FontAwesome/Google Icons
  route: string;
  divider?: boolean; // Para poner una línea separadora en el menú
}
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    FormsModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {

  isCollapsed = signal(false);

  toggleSidebar() {
    this.isCollapsed.update(val => !val);
  }

  menuItems: MenuItem[] = [
    { title: 'Dashboard', icon: '📊', route: '/admin/dashboard' },
    
    { title: 'Productos', icon: '📦', route: '/admin/products', divider: true },
    { title: 'Categorías', icon: '🏷️', route: '/admin/categories' },
    { title: 'Ajustes de Stock', icon: '⚖️', route: '/admin/stock-adjustments' },
    
    { title: 'Historial de Ventas', icon: '🧾', route: '/admin/sales', divider: true },
    
    { title: 'Cortes de Caja', icon: '💵', route: '/admin/shifts', divider: true },
    
    { title: 'Usuarios', icon: '👥', route: '/admin/users', divider: true },
    
    { title: 'Configuración', icon: '⚙️', route: '/admin/settings' }
  ];

  // Método para cerrar sesión
  logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    // this.router.navigate(['/auth/login']);
  }
  
}
