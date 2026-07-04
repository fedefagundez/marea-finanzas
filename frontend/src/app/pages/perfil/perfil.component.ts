import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Usuario } from '../../models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="demo-topbar">
      <div>
        <div class="eyebrow">Cuenta</div>
        <div class="sec-title">Mi perfil</div>
      </div>
    </div>

    <div class="card" style="max-width:480px;">
      <div class="card-title">Datos de la cuenta</div>
      <div style="margin-top:12px;">
        <div class="field">
          <label>Usuario</label>
          <input type="text" [value]="usuario?.username" disabled />
        </div>

        <div class="field" style="margin-top:16px;">
          <label>Email</label>
          <div style="display:flex; gap:8px;">
            <input type="email" [(ngModel)]="emailForm.nuevoEmail" name="nuevoEmail"
              [disabled]="!editandoEmail" style="flex:1;" />
            <button type="button" class="btn btn-secondary btn-md" (click)="toggleEditEmail()"
              style="flex-shrink:0;">
              {{ editandoEmail ? 'Cancelar' : 'Cambiar' }}
            </button>
          </div>
        </div>
        <div *ngIf="editandoEmail" class="field" style="margin-top:12px;">
          <label>Contraseña actual</label>
          <input type="password" [(ngModel)]="emailForm.password" name="emailPassword" />
        </div>
        <button *ngIf="editandoEmail" type="button" class="btn btn-primary btn-md" (click)="guardarEmail()"
          [disabled]="!emailForm.nuevoEmail || !emailForm.password">
          Guardar email
        </button>

        <div class="field" style="margin-top:16px;">
          <label>Miembro desde</label>
          <input type="text" [value]="usuario?.createdAt | date:'dd/MM/yyyy'" disabled />
        </div>
      </div>
    </div>

    <div class="card" style="max-width:480px; margin-top:20px;">
      <div class="card-title">Cambiar contraseña</div>
      <div style="margin-top:12px;">
        <div class="field">
          <label>Contraseña actual</label>
          <input type="password" [(ngModel)]="passwordForm.actual" name="passwordActual" />
        </div>
        <div class="field" style="margin-top:12px;">
          <label>Nueva contraseña</label>
          <input type="password" [(ngModel)]="passwordForm.nueva" name="passwordNueva" />
        </div>
        <div class="field" style="margin-top:12px;">
          <label>Confirmar nueva contraseña</label>
          <input type="password" [(ngModel)]="passwordForm.confirmar" name="passwordConfirmar" />
        </div>
        <button type="button" class="btn btn-primary btn-md" style="margin-top:12px;"
          (click)="guardarContrasenia()"
          [disabled]="!passwordForm.actual || !passwordForm.nueva || !passwordForm.confirmar">
          Cambiar contraseña
        </button>
      </div>
    </div>
  `
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  usuario: Usuario | null = null;
  editandoEmail = false;

  emailForm = { nuevoEmail: '', password: '' };
  passwordForm = { actual: '', nueva: '', confirmar: '' };

  ngOnInit() {
    this.cargarPerfil();
  }

  private cargarPerfil() {
    this.authService.me().subscribe({
      next: (user) => {
        this.usuario = user;
        this.emailForm.nuevoEmail = user.email;
      },
      error: (err) => this.toast.showApiError(err, 'Error al cargar perfil')
    });
  }

  toggleEditEmail() {
    this.editandoEmail = !this.editandoEmail;
    if (!this.editandoEmail) {
      this.emailForm.password = '';
      this.emailForm.nuevoEmail = this.usuario?.email || '';
    }
  }

  guardarEmail() {
    this.authService.cambiarEmail(this.emailForm.nuevoEmail, this.emailForm.password).subscribe({
      next: (res) => {
        this.toast.show(res.mensaje, 'success');
        this.editandoEmail = false;
        this.emailForm.password = '';
        this.cargarPerfil();
      },
      error: (err) => this.toast.showApiError(err, 'Error al cambiar email')
    });
  }

  guardarContrasenia() {
    if (this.passwordForm.nueva !== this.passwordForm.confirmar) {
      this.toast.show('Las contraseñas no coinciden', 'error');
      return;
    }
    if (this.passwordForm.nueva.length < 8) {
      this.toast.show('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }
    this.authService.cambiarContrasenia(this.passwordForm.actual, this.passwordForm.nueva).subscribe({
      next: (res) => {
        this.toast.show(res.mensaje, 'success');
        this.passwordForm = { actual: '', nueva: '', confirmar: '' };
      },
      error: (err) => this.toast.showApiError(err, 'Error al cambiar contraseña')
    });
  }
}
