
import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { User, UserRole } from '../../../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export default class LoginComponent {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Manejo de estado moderno con Signals (Angular 16+)
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Definición del formulario reactivo
  loginForm = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  currentUser = signal<User | null>(null);
  userData: User | null = null;

  // Mapa de rutas por rol
  private readonly dashboardRoutes: Record<UserRole, string> = {
    ROLE_BROKER: '/admin/dashboard',
    docente: '/docente/dashboard',
    alumno: '/alumno/mis-clases',
    padre: '/tutor/seguimiento'
  };

  private toastService = inject(ToastService);

  onSubmit() {
    console.log('1. Botón presionado. Validando formulario...');
    
    if (this.loginForm.invalid) {
      console.warn('❌ EL FORMULARIO ES INVÁLIDO. Revisa que llenaste ambos campos y que coinciden con el formControlName del HTML.');
      this.loginForm.markAllAsTouched();
      return;
    }

    console.log('2. Formulario válido. Enviando datos a Spring Boot:', this.loginForm.getRawValue());
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        console.log('3. ✅ Respuesta 200 OK recibida del servidor:', response);
        
        if (!response.token) {
          console.error('❌ CUIDADO: El backend no devolvió un campo llamado "token". Revisa la estructura del JSON.');
        }
        
        // 1. 🔥 GUARDAR EL TOKEN PARA EL INTERCEPTOR
        localStorage.setItem('jwt_token', response.token);
        
        // 2. 🔥 GUARDAR LOS DATOS DEL USUARIO PARA EL MENÚ LATERAL
        localStorage.setItem('user_info', JSON.stringify(response));
        this.isLoading.set(false);
        
        // 3. NAVEGAR SEGÚN EL ROL
        console.log('4. Intentando navegar...');
        
        if (response.role === 'ADMIN') {
          // ⚠️ NOTA: Si el admin va a otra pantalla, cambia '/seller/terminal' por '/admin/dashboard'
          this.router.navigate(['/admin/dashboard'])
            .then(navigates => {
              if (navigates) {
                console.log('5. ✅ Navegación exitosa (ADMIN).');
              } else {
                console.error('❌ LA NAVEGACIÓN FUE CANCELADA POR UN GUARD.');
              }
            })
            .catch(err => {
              console.error('🚨 ERROR CRÍTICO AL NAVEGAR (ADMIN):', err);
            });
            
        } else {
          // Navegación para Cajeros/Vendedores
          this.router.navigate(['/seller/terminal'])
            .then(navigates => {
              if (navigates) {
                console.log('5. ✅ Navegación exitosa (SELLER).');
              } else {
                console.error('❌ LA NAVEGACIÓN FUE CANCELADA POR UN GUARD.');
              }
            })
            .catch(err => {
              console.error('🚨 ERROR CRÍTICO AL INTENTAR DIBUJAR LA TERMINAL:', err);
            });
        }
      }, // 🔥 Esta es la coma clave que separaba el next del error y estaba mal estructurada
      
      error: (error) => {
        console.error('❌ ERROR DEL SERVIDOR O RED:', error);
        this.isLoading.set(false);
        
        if (error.status === 401 || error.status === 403) {
          this.errorMessage.set('Usuario o contraseña incorrectos.');
          this.toastService.show(
            'Error de Acceso', 
            'Usuario o contraseña incorrectos.', 
            'error',
            3000
          );
        } else {
          this.errorMessage.set('Error de conexión con el servidor. Intenta de nuevo.');
          this.toastService.show(
            'Error de Conectividad', 
            'Error de conexión con el servidor. Intenta de nuevo.', 
            'error',
            3000
          );
        }
      }
    });
  }

}
