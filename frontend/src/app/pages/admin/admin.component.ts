import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUsuario } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="demo-topbar">
      <div>
        <div class="eyebrow">Administración</div>
        <div class="sec-title">Usuarios</div>
      </div>
    </div>

    <div class="card" style="max-width:900px;">
      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Hogares</th>
              <th>Movimientos</th>
              <th>Metas</th>
              <th>Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of usuarios">
              <td><strong>{{ u.username }}</strong></td>
              <td>{{ u.email }}</td>
              <td>
                <span class="badge" [class.badge-admin]="u.rol === 'ADMIN'">{{ u.rol }}</span>
              </td>
              <td>{{ u.hogares }}</td>
              <td>{{ u.movimientos }}</td>
              <td>{{ u.metas }}</td>
              <td>{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
              <td>
                <div class="acciones-cell">
                  <button type="button" class="btn btn-secondary btn-xs" (click)="abrirResetPassword(u)" title="Resetear contraseña">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Resetear
                  </button>
                  <button *ngIf="u.rol === 'USER'" type="button" class="btn btn-secondary btn-xs" (click)="promoverAdmin(u)" title="Promover a administrador">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-2 0-4 1-5 3l-1 4c0 3 2 6 6 9 4-3 6-6 6-9l-1-4c-1-2-3-3-5-3z"/><path d="M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>
                    Admin
                  </button>
                  <button type="button" class="btn btn-danger btn-xs" (click)="confirmarEliminar(u)" title="Eliminar usuario">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal reset password -->
    <div class="modal-overlay" *ngIf="usuarioReset" (click)="cerrarModalReset()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-title">Resetear contraseña</div>
        <p style="color:var(--text-2); margin-bottom:12px;">
          Nueva contraseña para <strong>{{ usuarioReset?.username }}</strong>
        </p>
        <div class="field">
          <input type="password" [(ngModel)]="nuevaPassword" name="nuevaPassword" placeholder="Nueva contraseña (mín. 8 caracteres)" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary btn-md" (click)="cerrarModalReset()">Cancelar</button>
          <button type="button" class="btn btn-primary btn-md" (click)="resetPassword()" [disabled]="nuevaPassword.length < 8">
            Guardar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal confirmar eliminar -->
    <div class="modal-overlay" *ngIf="usuarioEliminar" (click)="cerrarModalEliminar()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-title">Eliminar usuario</div>
        <p style="color:var(--text-2); margin-bottom:12px;">
          ¿Estás seguro de eliminar a <strong>{{ usuarioEliminar?.username }}</strong>?
          <br/>Se borrarán todos sus datos (ingresos, gastos, metas, categorías).
        </p>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary btn-md" (click)="cerrarModalEliminar()">Cancelar</button>
          <button type="button" class="btn btn-danger btn-md" (click)="eliminarUsuario()">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-table {
      width:100%;
      border-collapse:collapse;
      font-size:13px;
    }
    .admin-table th, .admin-table td {
      text-align:left;
      padding:10px 8px;
      border-bottom:1px solid var(--border);
      white-space:nowrap;
    }
    .admin-table th {
      font-weight:600;
      color:var(--text-2);
      font-size:11.5px;
      text-transform:uppercase;
      letter-spacing:.05em;
    }
    .admin-table tbody tr:hover {
      background:var(--bg-2);
    }
    .badge {
      display:inline-block;
      padding:2px 8px;
      border-radius:999px;
      font-size:11px;
      font-weight:600;
      background:var(--bg-2);
      color:var(--text-2);
    }
    .badge-admin {
      background:var(--primary-100);
      color:var(--primary-700);
    }
    .acciones-cell {
      display:flex;
      gap:6px;
      flex-wrap:nowrap;
    }
    .btn-xs {
      font-size:11px;
      padding:4px 8px;
      display:inline-flex;
      align-items:center;
      gap:4px;
      white-space:nowrap;
    }
  `]
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  usuarios: AdminUsuario[] = [];

  usuarioReset: AdminUsuario | null = null;
  nuevaPassword = '';

  usuarioEliminar: AdminUsuario | null = null;

  ngOnInit() {
    this.cargarUsuarios();
  }

  private cargarUsuarios() {
    this.adminService.listarUsuarios().subscribe({
      next: (data) => this.usuarios = data,
      error: (err) => this.toast.showApiError(err, 'Error al cargar usuarios'),
    });
  }

  abrirResetPassword(u: AdminUsuario) {
    this.usuarioReset = u;
    this.nuevaPassword = '';
  }

  cerrarModalReset() {
    this.usuarioReset = null;
    this.nuevaPassword = '';
  }

  resetPassword() {
    if (!this.usuarioReset) return;
    this.adminService.resetPassword(this.usuarioReset.id, this.nuevaPassword).subscribe({
      next: (res) => {
        this.toast.show(res.mensaje, 'success');
        this.cerrarModalReset();
      },
      error: (err) => this.toast.showApiError(err, 'Error al resetear contraseña'),
    });
  }

  promoverAdmin(u: AdminUsuario) {
    this.adminService.cambiarRol(u.id, 'ADMIN').subscribe({
      next: (res) => {
        this.toast.show(res.mensaje, 'success');
        this.cargarUsuarios();
      },
      error: (err) => this.toast.showApiError(err, 'Error al cambiar rol'),
    });
  }

  confirmarEliminar(u: AdminUsuario) {
    this.usuarioEliminar = u;
  }

  cerrarModalEliminar() {
    this.usuarioEliminar = null;
  }

  eliminarUsuario() {
    if (!this.usuarioEliminar) return;
    this.adminService.eliminarUsuario(this.usuarioEliminar.id).subscribe({
      next: (res) => {
        this.toast.show(res.mensaje, 'success');
        this.cerrarModalEliminar();
        this.cargarUsuarios();
      },
      error: (err) => this.toast.showApiError(err, 'Error al eliminar usuario'),
    });
  }
}
