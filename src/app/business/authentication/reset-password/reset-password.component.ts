import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangedPasswordService } from '../../../core/services/changed-password.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export default class ResetPasswordComponent implements OnDestroy{

  formResetPassword: FormGroup;
  codeVerification: string = '';
  newPassword: string = '';
  emailChangedPasswordUser : string | null = localStorage.getItem('emailChangedPassword')

  // Iniciamos el contador en 600 segundos (10 minutos)
  tiempoRestante = signal(600);
  intervalo: any;

  constructor(
      private router: Router, 
      private fb: FormBuilder,
      private resetPassServ: ChangedPasswordService) {
        this.formResetPassword = this.fb.group({
          codeVerification: ['', Validators.required],
          newPassword: ['', Validators.required]
        });
        this.iniciarContador();
      }

  forwardLogin(): void {
    this.router.navigate(['/login']);
  }

  requestNewCode(): void {
    if (this.emailChangedPasswordUser) {
      this.resetPassServ.requestChangedPassword(this.emailChangedPasswordUser).subscribe({
        next: (response) => {
          // Reiniciar el contador
          this.tiempoRestante.set(600);
          this.iniciarContador();
        },
        error: (err) => console.error('Error al reenviar el código de verificación', err)
      });
  }
}

  resetPassword(): void{
    if (this.formResetPassword.valid) {
      const email = this.emailChangedPasswordUser;
      const codeVerification = this.formResetPassword.get('codeVerification')?.value;
      const newPassword = this.formResetPassword.get('newPassword')?.value;
      if (!email || !codeVerification || !newPassword) {
        console.error('Faltan datos para restablecer la contraseña');
        return;
      }
      this.resetPassServ.resetPassword(email, codeVerification, newPassword).subscribe({
      next: (response)=> {
        if(response.response.codeResult === '200'){
          localStorage.removeItem('emailChangedPassword');
          this.router.navigate(['/login'])
        }
      },
      error: (err) => console.error('Error al momento de actualizar cambio de contraseña', err)
    })
    } else {
      this.formResetPassword.markAllAsTouched(); // Muestra errores si intenta enviar
    }
  }

  ngOnDestroy() {
    this.detenerContador();
  }

  detenerContador() {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  // Transformar segundos a formato MM:SS
  get tiempoFormateado() {
    const minutos = Math.floor(this.tiempoRestante() / 60);
    const segundos = this.tiempoRestante() % 60;
    return `${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;
  }

  iniciarContador() {
    this.intervalo = setInterval(() => {
      if (this.tiempoRestante() > 0) {
        this.tiempoRestante.update(t => t - 1);
      } else {
        this.detenerContador();
      }
    }, 1000);
  }

}
