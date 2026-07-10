import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header class="mobile-header">
        <div class="brand">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="15" fill="#06B6D4"/>
            <path d="M4 17c2.5-3 4.5 3 7 0s4.5-3 7 0 4.5 3 7 0" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
            <path d="M4 21c2.5-3 4.5 3 7 0s4.5-3 7 0 4.5 3 7 0" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".55"/>
          </svg>
          <div>
            <div class="brand-name">Marea</div>
            <div class="brand-tag">Finanzas del hogar</div>
          </div>
        </div>
        <button type="button" class="hamburger" [class.abierto]="menuAbierto" (click)="menuAbierto = !menuAbierto" aria-label="Menú">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      <nav class="rail" [class.abierto]="menuAbierto">
        <div class="brand desktop-brand">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="15" fill="#06B6D4"/>
            <path d="M4 17c2.5-3 4.5 3 7 0s4.5-3 7 0 4.5 3 7 0" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
            <path d="M4 21c2.5-3 4.5 3 7 0s4.5-3 7 0 4.5 3 7 0" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".55"/>
          </svg>
          <div>
            <div class="brand-name">Marea</div>
            <div class="brand-tag">Finanzas del hogar</div>
          </div>
        </div>

        <div class="rail-nav">
          <a class="rail-link" routerLink="/dashboard" routerLinkActive="active" (click)="cerrarMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M9 9v11"/>
            </svg>
            Dashboard
          </a>
          <a class="rail-link" routerLink="/ingresos" routerLinkActive="active" (click)="cerrarMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 15l5-5 5 5"/><path d="M12 10v10"/><path d="M5 4h14"/>
            </svg>
            Ingresos
          </a>
          <a class="rail-link" routerLink="/gastos" routerLinkActive="active" (click)="cerrarMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 9l5 5 5-5"/><path d="M12 14V4"/><path d="M5 20h14"/>
            </svg>
            Gastos
          </a>
          <a class="rail-link" routerLink="/hogares" routerLinkActive="active" (click)="cerrarMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V10"/><path d="M10 20.5v-6h4v6"/>
            </svg>
            Hogares
          </a>
          <a class="rail-link" routerLink="/metas" routerLinkActive="active" (click)="cerrarMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>
            </svg>
            Metas
          </a>
          <a class="rail-link" routerLink="/categorias" routerLinkActive="active" (click)="cerrarMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="8.5"/><path d="M12 12V3.5A8.5 8.5 0 0 1 20.5 12H12z"/>
            </svg>
            Categorías
          </a>
          <a class="rail-link" routerLink="/simulaciones" routerLinkActive="active" (click)="cerrarMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v18h18"/><path d="M7 16l4-5 4 3 5-7"/>
            </svg>
            Simulaciones
          </a>
          <a class="rail-link" routerLink="/perfil" routerLinkActive="active" (click)="cerrarMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.2-3.8 4-5.5 7-5.5s5.8 1.7 7 5.5"/>
            </svg>
            Perfil
          </a>
          <a *ngIf="authService.currentUser()?.rol === 'ADMIN'" class="rail-link" routerLink="/admin" routerLinkActive="active" (click)="cerrarMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3c-2 0-4 1-5 3l-1 4c0 3 2 6 6 9 4-3 6-6 6-9l-1-4c-1-2-3-3-5-3z"/><path d="M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
            </svg>
            Admin
          </a>
        </div>

        <div class="rail-footer">
          <div class="rail-toggle">
            <span>{{ themeService.current() === 'dark' ? 'Modo oscuro' : 'Modo claro' }}</span>
            <button type="button" class="switch" [class.on]="themeService.current() === 'dark'"
                    (click)="themeService.toggle()" aria-label="Cambiar tema"></button>
          </div>
          <a class="rail-link" style="margin-top:8px; color:var(--danger-500);" (click)="authService.logout(); cerrarMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>
            </svg>
            Cerrar sesión
          </a>
        </div>
      </nav>

      <main class="main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class MainLayoutComponent {
  themeService = inject(ThemeService);
  authService = inject(AuthService);

  menuAbierto = false;

  cerrarMenu() {
    this.menuAbierto = false;
  }
}
