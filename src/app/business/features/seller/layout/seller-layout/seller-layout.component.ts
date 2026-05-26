import { afterNextRender, Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShiftService } from '../../../../../core/services/shift/shift.service';
import { CartService } from '../../../../../core/services/cart/cart.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './seller-layout.component.html',
  styleUrl: './seller-layout.component.css'
})
export class SellerLayoutComponent implements OnInit {

  public shiftService = inject(ShiftService);
  public cartService = inject(CartService);
  private router = inject(Router);

  private platformId = inject(PLATFORM_ID);

  username = signal<string>('Vendedor');

  constructor() {
    // 🔥 afterNextRender garantiza que este código SOLO se ejecute en el navegador (cliente)
    afterNextRender(() => {
      const userInfoStr = localStorage.getItem('user_info');
      
      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          this.username.set(userInfo.fullName || 'Vendedor');
        } catch (e) {
          console.error("Error parseando user_info", e);
        }
      }
    });
  }

  ngOnInit() {
    // 🔥 2. LA MAGIA: Solo disparamos la petición si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.shiftService.checkActiveShift().subscribe({
        // Es buena práctica manejar el error para que no se muera silenciosamente
        error: (err) => console.error("Error al validar el turno:", err) 
      }); 
    }
  }

  /**
   * Cierra la sesión limpiando el almacenamiento y redirigiendo al Login
   */
  logout() {
    this.cartService.clearCart()
    // Puedes reemplazar esto por tu AuthService si ya tienes un método de logout
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    this.router.navigate(['/login']);
  }
}
