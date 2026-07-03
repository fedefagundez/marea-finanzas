import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
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
          <h2>Crear Cuenta</h2>
          <p>Únete a Marea y controla tus finanzas</p>
        </div>
        <form (ngSubmit)="register()">
          <div class="field">
            <label>Usuario</label>
            <input type="text" [(ngModel)]="username" name="username" placeholder="nombre de usuario" required minlength="3" />
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="tu@email.com" required />
          </div>
          <div class="field">
            <label>Contraseña</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="mínimo 8 caracteres" required minlength="8" />
          </div>
          <button class="btn btn-primary btn-md" type="submit">Registrarse</button>
        </form>
        <div class="auth-footer">
          ¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  username = '';
  email = '';
  password = '';

  register() {
    if (!this.email || !this.password || !this.username) {
      this.toast.show('Todos los campos son obligatorios', 'error');
      return;
    }
    if (this.username.length < 3 || this.username.length > 50 || !/^[a-zA-Z0-9_]+$/.test(this.username)) {
      this.toast.show('El usuario debe tener entre 3 y 50 caracteres y solo letras, números o guiones bajos', 'error');
      return;
    }
    if (this.password.length < 8) {
      this.toast.show('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }
    if (!this.email.includes('@')) {
      this.toast.show('Email inválido', 'error');
      return;
    }
    this.authService.register(this.username, this.email, this.password).subscribe({
      next: (res) => {
        this.authService.saveTokens(res.token, res.refreshToken);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => this.toast.showApiError(err, 'Error al registrar')
    });
  }
}
