import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IdleServiceService } from './core/services/idle-service.service';
import { AuthService } from './core/services/auth.service';
import { ToastComponent } from './ui/toast/toast/toast.component';
import { ToastContainerComponent } from './ui/toast/toast-container/toast-container.component';
import { LoadingComponent } from './core/services/loading/loading/loading.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{

  title = 'ng-menu-dashboard';

  constructor(
    public idleService: IdleServiceService,
    private authService: AuthService
  ) {

  }

  ngOnInit(): void {
  }

  // Escucha clics, pulsaciones de teclas y scroll
  @HostListener('window:mousemove')
  @HostListener('window:keypress')
  @HostListener('window:click')
  @HostListener('window:scroll')
  refreshUserState() {
    this.idleService.onUserActivity();
  }
}
