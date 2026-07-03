import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
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
          <h2>Recuperar contraseña</h2>
          <p>Ingresá tu email y te enviaremos un enlace para restablecerla.</p>
        </div>

        <form (ngSubmit)="enviar()">
          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="tu@email.com" required />
          </div>
          <button class="btn btn-primary btn-md" type="submit" [disabled]="cargando">
            {{ cargando ? 'Enviando...' : 'Enviar enlace' }}
          </button>
        </form>

        <div class="auth-footer">
          <a routerLink="/login">Volver al inicio de sesión</a>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  email = '';
  cargando = false;

  enviar() {
    if (!this.email) {
      this.toast.show('Ingresá tu email', 'error');
      return;
    }

    this.cargando = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.cargando = false;
        this.toast.show('Si el email está registrado, recibirás instrucciones.', 'success');
        this.email = '';
      },
      error: () => {
        this.cargando = false;
        this.toast.show('Si el email está registrado, recibirás instrucciones.', 'info');
        this.email = '';
      }
    });
  }
}
