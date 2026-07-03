import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reset-password',
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
          <h2>Nueva contraseña</h2>
          <p>Elegí una contraseña segura de al menos 8 caracteres.</p>
        </div>

        <form (ngSubmit)="guardar()">
          <div class="field">
            <label>Nueva contraseña</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required minlength="8" />
          </div>
          <div class="field">
            <label>Repetir contraseña</label>
            <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="••••••••" required />
          </div>
          <button class="btn btn-primary btn-md" type="submit" [disabled]="cargando">
            {{ cargando ? 'Guardando...' : 'Guardar contraseña' }}
          </button>
        </form>

        <div class="auth-footer">
          <a routerLink="/login">Volver al inicio de sesión</a>
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  token = '';
  password = '';
  confirmPassword = '';
  cargando = false;

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.toast.show('El enlace de recuperación no es válido', 'error');
      this.router.navigate(['/login']);
    }
  }

  guardar() {
    if (this.password.length < 8) {
      this.toast.show('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.toast.show('Las contraseñas no coinciden', 'error');
      return;
    }

    this.cargando = true;
    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.toast.show('Contraseña actualizada correctamente', 'success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.cargando = false;
        this.toast.showApiError(err, 'No se pudo restablecer la contraseña');
      }
    });
  }
}
