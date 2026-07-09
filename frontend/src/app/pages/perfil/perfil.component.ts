import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ReporteService } from '../../services/reporte.service';
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

    <div class="card" style="max-width:480px; margin-top:20px;">
      <div class="card-title">Exportar / Importar datos</div>
      <div style="margin-top:12px;">
        <p style="font-size:13px; color:var(--text-2); margin-bottom:12px;">
          Descargá tus movimientos en CSV o importalos desde un archivo.
        </p>

        <button type="button" class="btn btn-primary btn-md" (click)="exportarCsv()" [disabled]="exportando">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {{ exportando ? 'Exportando…' : 'Descargar CSV' }}
        </button>

        <div style="margin-top:16px; border-top:1px solid var(--border); padding-top:16px;">
          <label style="font-size:13px; font-weight:600; color:var(--text-2); display:block; margin-bottom:8px;">
            Importar CSV
          </label>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <input #fileInput type="file" accept=".csv" (change)="onArchivoSeleccionado($event)" hidden />
            <button type="button" class="btn btn-secondary btn-md" (click)="fileInput.click()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {{ archivoImportar ? archivoImportar.name : 'Seleccionar archivo' }}
            </button>
            <button type="button" class="btn btn-primary btn-md"
              (click)="importarCsv()" [disabled]="!archivoImportar || importando"
              style="margin-left:4px;">
              {{ importando ? 'Importando…' : 'Importar' }}
            </button>
            <button *ngIf="archivoImportar" type="button" class="btn btn-secondary btn-md" (click)="limpiarArchivo()" style="font-size:12px; padding:0 12px;">
              ✕
            </button>
          </div>
          <p *ngIf="!archivoImportar" style="font-size:11.5px; color:var(--text-3); margin-top:6px;">
            Formatos aceptados: .csv
          </p>
        </div>

        <div style="margin-top:16px; border-top:1px solid var(--border); padding-top:16px;">
          <label style="font-size:13px; font-weight:600; color:var(--text-2); display:block; margin-bottom:8px;">
            Restaurar CSV completo
          </label>
          <p style="font-size:12px; color:var(--text-3); margin-bottom:8px;">
            Creá un hogar y restaurá todos los datos desde un CSV exportado.
          </p>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <input #restoreFileInput type="file" accept=".csv" (change)="onRestoreArchivoSeleccionado($event)" hidden />
            <button type="button" class="btn btn-secondary btn-md" (click)="restoreFileInput.click()">
              {{ archivoRestaurar ? archivoRestaurar.name : 'Seleccionar archivo' }}
            </button>
            <button type="button" class="btn btn-primary btn-md"
              (click)="restaurarCsv()" [disabled]="!archivoRestaurar || restaurando">
              {{ restaurando ? 'Restaurando…' : 'Restaurar' }}
            </button>
            <button *ngIf="archivoRestaurar" type="button" class="btn btn-secondary btn-md" (click)="limpiarRestore()" style="font-size:12px; padding:0 12px;">
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private reporteService = inject(ReporteService);
  private toast = inject(ToastService);

  usuario: Usuario | null = null;
  editandoEmail = false;

  emailForm = { nuevoEmail: '', password: '' };
  passwordForm = { actual: '', nueva: '', confirmar: '' };

  exportando = false;
  importando = false;
  archivoImportar: File | null = null;
  restaurando = false;
  archivoRestaurar: File | null = null;

  ngOnInit() {
    this.cargarPerfil();
  }

  private cargarPerfil() {
    this.authService.me().subscribe({
      next: (user) => {
        this.usuario = user;
        this.authService.saveUser(user);
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

  onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivoImportar = input.files?.item(0) ?? null;
  }

  limpiarArchivo() {
    this.archivoImportar = null;
    const input = document.querySelector<HTMLInputElement>('input[type="file"][accept=".csv"]');
    if (input) input.value = '';
  }

  exportarCsv() {
    const hogarId = localStorage.getItem('hogarId');
    if (!hogarId) { this.toast.show('Seleccioná un hogar primero', 'error'); return; }

    this.exportando = true;
    this.reporteService.exportarCsv(hogarId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `marea-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exportando = false;
        this.toast.show('CSV descargado', 'success');
      },
      error: (err) => {
        this.exportando = false;
        this.toast.showApiError(err, 'Error al exportar');
      }
    });
  }

  importarCsv() {
    if (!this.archivoImportar) return;
    const hogarId = localStorage.getItem('hogarId');
    if (!hogarId) { this.toast.show('Seleccioná un hogar primero', 'error'); return; }

    this.importando = true;
    this.reporteService.importarCsv(hogarId, this.archivoImportar).subscribe({
      next: (res) => {
        this.importando = false;
        this.archivoImportar = null;
        this.toast.show(res.mensaje, 'success');
        if (res.errores?.length) {
          console.warn('Errores de importación:', res.errores);
        }
      },
      error: (err) => {
        this.importando = false;
        this.toast.showApiError(err, 'Error al importar');
      }
    });
  }

  onRestoreArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivoRestaurar = input.files?.item(0) ?? null;
  }

  limpiarRestore() {
    this.archivoRestaurar = null;
    const input = document.querySelector<HTMLInputElement>('input[type="file"][accept=".csv"]');
    if (input) input.value = '';
  }

  restaurarCsv() {
    if (!this.archivoRestaurar) return;
    this.restaurando = true;
    this.reporteService.restaurarCsv(this.archivoRestaurar).subscribe({
      next: (res) => {
        this.restaurando = false;
        this.archivoRestaurar = null;
        this.toast.show(res.mensaje, 'success');
        if (res.errores?.length) {
          console.warn('Errores de restauración:', res.errores);
        }
      },
      error: (err) => {
        this.restaurando = false;
        this.toast.showApiError(err, 'Error al restaurar');
      }
    });
  }
}
