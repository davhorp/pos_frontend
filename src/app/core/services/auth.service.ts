import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthRequest } from '../../models/authRequest.models';
import { AuthResponse } from '../../models/authResponse.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
// Inyección moderna de Angular (sin constructor)
  private http = inject(HttpClient);
  
  // Asegúrate de usar el puerto correcto de tu backend local o de producción
  private apiUrl = 'http://localhost:8080/api/auth';

  login(credentials: AuthRequest) {
    console.log('Intentando login con:', credentials);
    console.log('URL de login:', `${environment.urlPOSSystem}${environment.login_path}`);
    return this.http.post<AuthResponse>(`${environment.urlPOSSystem}${environment.login_path}`, credentials).pipe(
      tap(response => {
        // Guardamos el token para inyectarlo en futuras peticiones (via Interceptor)
        console.log('Respuesta del login:', response);
        localStorage.setItem('jwt_token', response.token);
        
        // Guardamos los datos del usuario para mostrarlos en la UI (Header del POS)
        localStorage.setItem('user_info', JSON.stringify({
          fullName: response.fullName,
          role: response.role
        }));
      })
    );
  }

  logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
  }
}
