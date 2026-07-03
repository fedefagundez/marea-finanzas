import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Usuario } from '../../models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
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
          <input type="email" [value]="usuario?.email" disabled />
        </div>
        <div class="field" style="margin-top:16px;">
          <label>Miembro desde</label>
          <input type="text" [value]="usuario?.createdAt | date:'dd/MM/yyyy'" disabled />
        </div>
      </div>
    </div>
  `
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  usuario: Usuario | null = null;

  ngOnInit() {
    this.authService.me().subscribe({
      next: (user) => this.usuario = user,
      error: (err) => this.toast.showApiError(err, 'Error al cargar perfil')
    });
  }
}
