import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div style="text-align:center; margin-bottom:24px;">
          <svg width="40" height="40" viewBox="0 0 30 30" fill="none" style="margin:0 auto 12px;">
            <circle cx="15" cy="15" r="15" fill="#06B6D4"/>
            <path d="M4 17c2.5-3 4.5 3 7 0s4.5-3 7 0 4.5 3 7 0" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>
            <path d="M4 21c2.5-3 4.5 3 7 0s4.5-3 7 0 4.5 3 7 0" stroke="#fff" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".55"/>
          </svg>
          <h2>Iniciar Sesión</h2>
          <p>Gestiona las finanzas de tu hogar</p>
        </div>
        <form (ngSubmit)="login()">
          <div class="field">
            <label>Usuario o email</label>
            <input type="text" [(ngModel)]="username" name="username" placeholder="tu@email.com" required />
          </div>
          <div class="field">
            <label>Contraseña</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required />
          </div>
          <div style="text-align:right; margin:-8px 0 12px;">
            <a routerLink="/forgot-password" style="font-size:13px; color:var(--accent-strong); text-decoration:none;">¿Olvidaste tu contraseña?</a>
          </div>
          <button class="btn btn-primary btn-md" type="submit">Entrar</button>
        </form>
        <div class="auth-footer">
          ¿No tienes cuenta? <a routerLink="/register">Regístrate</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  username = '';
  password = '';

  login() {
    this.username = this.username.trim();
    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.authService.saveTokens(res.token, res.refreshToken);
        this.authService.saveUser(res.usuario);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => this.toast.showApiError(err, 'Error al iniciar sesión')
    });
  }
}
