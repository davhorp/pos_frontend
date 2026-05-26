import { Injectable, signal, effect, computed } from '@angular/core';
import { Theme } from '../../models/theme.model';

@Injectable({
  providedIn: 'root'
})
export class ThemeServiceService {

  /*rivate appTheme = signal<'light' | 'dark' | 'system'>('system');
  private themes: Theme[] = [
    { name: 'light', icon: 'light_mode' },
    { name: 'dark', icon: 'dark_mode' },
    { name: 'system', icon: 'desktop_windows' },
  ];

  public darkMode = signal<boolean>(
    localStorage.getItem('theme') === 'dark'
  );

  selectedTheme = computed(() =>
    this.themes.find((t) => t.name === this.appTheme())
  );

  getThemes() {
    return this.themes;
  }

  setTheme(theme: 'light' | 'dark' | 'system') {
    this.appTheme.set(theme);
  }

  constructor() {
    // El 'effect' se ejecuta automáticamente cada vez que darkMode cambia
    effect(() => {

      const appTheme = this.appTheme();
      const colorScheme = appTheme === 'system' ? 'light dark' : appTheme;
      document.body.style.setProperty('color-scheme', colorScheme);

      const mode = this.darkMode() ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', mode);
      localStorage.setItem('theme', mode);
    });
  }

  toggleTheme() {
    this.darkMode.update(v => !v);
  }*/

}
