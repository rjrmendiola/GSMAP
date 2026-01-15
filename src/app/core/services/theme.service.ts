import { Injectable, signal } from '@angular/core';
import { Theme } from '../models/theme.model';
import { effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public theme = signal<Theme>({ mode: 'light', color: 'base' });

  constructor() {
    this.loadTheme();
    effect(() => {
      this.setTheme();
    });
  }

  private loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme) {
      const parsedTheme = JSON.parse(theme);
      // Force light mode - override any saved dark theme
      if (parsedTheme.mode === 'dark') {
        parsedTheme.mode = 'light';
      }
      this.theme.set(parsedTheme);
    } else {
      // If no theme saved, default to light
      this.theme.set({ mode: 'light', color: 'base' });
    }
  }

  private setTheme() {
    localStorage.setItem('theme', JSON.stringify(this.theme()));
    this.setThemeClass();
  }

  public get isDark(): boolean {
    return this.theme().mode == 'dark';
  }

  private setThemeClass() {
    const htmlElement = document.querySelector('html')!;
    // Remove 'dark' class if present and force light mode
    if (this.theme().mode === 'light') {
      htmlElement.classList.remove('dark');
      htmlElement.className = 'light';
    } else {
      htmlElement.className = this.theme().mode;
    }
    htmlElement.setAttribute('data-theme', this.theme().color);
  }
}
