import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeServiceService } from '../../../core/services/theme-service.service';
import { MaterialModule } from '../../../ui/material-module';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MaterialModule, TitleCasePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  public nameFullUsr : string | null = localStorage.getItem('nameFullUsr');
  public profileUsr : string | null = localStorage.getItem('profileUsr');

  public themeService = inject(ThemeServiceService);

  constructor(private authService: AuthService) { 

  }

  logout(): void {
    this.authService.logout();
  }

}
