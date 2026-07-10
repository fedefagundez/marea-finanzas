import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HogarService } from '../../services/hogar.service';
import { TarjetaService } from '../../services/tarjeta.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { AuthService } from '../../services/auth.service';
import { Hogar, TarjetaResumen } from '../../models';
import { validarNombre, validarUltimos4 } from '../../core/utils/form-utils';

@Component({
  selector: 'app-hogares',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="demo-topbar">
      <div>
        <div class="eyebrow">Configuración</div>
        <div class="sec-title">Mis Hogares</div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:20px;">
      <div class="card">
        <div class="card-title">Crear nuevo hogar</div>
        <form (ngSubmit)="crearHogar()">
          <div class="field">
            <label>Nombre del hogar</label>
            <input type="text" [(ngModel)]="nuevoNombre" name="nombre" placeholder="Ej. Casa familia Pérez" required />
          </div>
          <button type="submit" class="btn btn-primary btn-md" style="margin-top:12px;">Crear hogar</button>
        </form>
      </div>
      <div class="card">
        <div class="card-title">Unirse a hogar</div>
        <form (ngSubmit)="unirseHogar()">
          <div class="field">
            <label>Token de invitación</label>
            <input type="text" [(ngModel)]="tokenInvitacion" name="token" placeholder="Pega el token aquí" required />
          </div>
          <button type="submit" class="btn btn-secondary btn-md" style="margin-top:12px;">Unirse</button>
        </form>
      </div>
    </div>

    <div class="subhead">Mis hogares</div>
    <div *ngIf="hogares.length === 0" class="no-hogar">
      <h3>No tienes hogares</h3>
      <p>Crea uno nuevo o únete a uno existente usando un token de invitación</p>
    </div>

    <div *ngFor="let h of hogares" class="card" style="margin-bottom:16px;" [style.border-color]="h.id === hogarSeleccionado ? 'var(--accent)' : ''" [style.box-shadow]="h.id === hogarSeleccionado ? 'var(--glow)' : ''">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <div class="card-title" style="font-size:14px; color:var(--text-1); margin-bottom:0;">{{ h.nombre }}</div>
            <span *ngIf="h.id === hogarSeleccionado" class="badge badge-success">Activo</span>
          </div>
          <div style="font-size:12.5px; color:var(--text-2);">Miembros: {{ h.miembros?.length || 0 }}</div>
        </div>
        <div style="display:flex; gap:8px;">
          <button *ngIf="h.id !== hogarSeleccionado" type="button" class="btn btn-primary btn-sm" (click)="seleccionarHogar(h)">Seleccionar</button>
          <button type="button" class="btn btn-secondary btn-sm" (click)="invitar(h)">Invitar</button>
          <button *ngIf="esAdmin(h)" type="button" class="btn btn-danger btn-sm" (click)="eliminarHogar(h)">Eliminar</button>
        </div>
      </div>
      <div *ngIf="linkInvitacion === h.id && h.tokenInvitacion" class="invite-link" style="display:flex; align-items:center; gap:8px;">
        <code style="font-size:13px; user-select:all;">{{ h.tokenInvitacion }}</code>
        <button type="button" class="btn btn-ghost btn-sm" (click)="copiarToken(h.tokenInvitacion!)">Copiar</button>
      </div>

      <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border);">
        <div class="card-title">Miembros</div>
        <div *ngFor="let m of h.miembros || []" style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px 12px; margin-bottom:6px; border-radius:var(--radius-sm); font-size:13.5px; background:var(--surface-2);">
          <span>
            {{ m.usuario.username }}
            <span *ngIf="m.rol === 'ADMIN'" class="badge badge-warning" style="margin-left:6px;">Admin</span>
          </span>
          <button *ngIf="esAdmin(h) && m.rol !== 'ADMIN'" type="button" class="btn btn-danger btn-sm" (click)="quitarMiembro(h.id, m.id)">Quitar</button>
        </div>
      </div>

      <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border);">
        <div class="card-title">Tarjetas de crédito</div>
        <form (ngSubmit)="crearTarjeta(h.id)" class="btn-row">
          <div class="field" style="flex:1;">
            <input type="text" [(ngModel)]="tarjetaNombre" name="nombre" placeholder="Nombre tarjeta" required />
          </div>
          <div class="field" style="width:120px;">
            <input type="text" [(ngModel)]="tarjetaUltimo4" name="ultimo4" placeholder="Últimos 4" maxlength="4" pattern="\\d{4}" required />
          </div>
          <div class="field" style="width:100px;">
            <select [(ngModel)]="tarjetaDiaCierre" name="diaCierre">
              <option value="">Sin cierre</option>
              <option *ngFor="let d of diasMes" [value]="d">Cierre día {{ d }}</option>
            </select>
          </div>
          <button type="submit" class="btn btn-secondary btn-sm">Agregar</button>
        </form>
        <div *ngIf="(h.tarjetas || []).length === 0" style="color:var(--text-3); font-size:13px;">
          Sin tarjetas registradas
        </div>
        <div *ngFor="let t of h.tarjetas || []" style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px 12px; margin-bottom:6px; border-radius:var(--radius-sm); font-size:13.5px; background:var(--surface-2);">
          <ng-container *ngIf="tarjetaEditandoId !== t.id; else editandoTarjeta">
            <span><span class="badge badge-neutral">{{ t.ultimo4 }}</span> {{ t.nombre }}<span *ngIf="t.diaCierre" class="badge badge-info" style="margin-left:6px;">Cierre día {{ t.diaCierre }}</span></span>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn btn-ghost btn-sm" (click)="iniciarEdicionTarjeta(t)">Editar</button>
              <button type="button" class="btn btn-danger btn-sm" (click)="eliminarTarjeta(t.id)">Eliminar</button>
            </div>
          </ng-container>
          <ng-template #editandoTarjeta>
            <div class="field" style="flex:1;">
              <input type="text" [(ngModel)]="tarjetaEditNombre" name="editNombre{{t.id}}" placeholder="Nombre tarjeta" />
            </div>
            <div class="field" style="width:120px;">
              <input type="text" [(ngModel)]="tarjetaEditUltimo4" name="editUltimo4{{t.id}}" placeholder="Últimos 4" maxlength="4" />
            </div>
            <div class="field" style="width:100px;">
              <select [(ngModel)]="tarjetaEditDiaCierre" name="editDiaCierre{{t.id}}">
                <option value="">Sin cierre</option>
                <option *ngFor="let d of diasMes" [value]="d">Cierre día {{ d }}</option>
              </select>
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn btn-primary btn-sm" (click)="guardarEdicionTarjeta(t.id)">Guardar</button>
              <button type="button" class="btn btn-secondary btn-sm" (click)="cancelarEdicionTarjeta()">Cancelar</button>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `
})
export class HogaresComponent implements OnInit {
  private hogarService = inject(HogarService);
  private tarjetaService = inject(TarjetaService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private auth = inject(AuthService);

  hogares: Hogar[] = [];
  hogarSeleccionado = '';
  nuevoNombre = '';
  tokenInvitacion = '';
  linkInvitacion = '';
  readonly diasMes = Array.from({ length: 31 }, (_, i) => i + 1);
  tarjetaNombre = '';
  tarjetaUltimo4 = '';
  tarjetaDiaCierre = '';
  tarjetaEditandoId = '';
  tarjetaEditNombre = '';
  tarjetaEditUltimo4 = '';
  tarjetaEditDiaCierre = '';

  ngOnInit() {
    this.hogarSeleccionado = localStorage.getItem('hogarId') || '';
    this.cargarHogares();
  }

  cargarHogares() {
    this.hogarService.listar().subscribe(hogares => {
      this.hogares = hogares.sort((a, b) => {
        if (a.id === this.hogarSeleccionado) return -1;
        if (b.id === this.hogarSeleccionado) return 1;
        return 0;
      });
    });
  }

  crearHogar() {
    const validacion = validarNombre(this.nuevoNombre, 100);
    if (!validacion.ok) {
      this.toast.show(validacion.mensaje!, 'error');
      return;
    }
    this.hogarService.crear(this.nuevoNombre.trim()).subscribe({
      next: () => {
        this.nuevoNombre = '';
        this.toast.show('Hogar creado exitosamente', 'success');
        this.cargarHogares();
      },
      error: (err) => this.toast.showApiError(err, 'Error al crear')
    });
  }

  unirseHogar() {
    if (!this.tokenInvitacion.trim()) {
      this.toast.show('El token es obligatorio', 'error');
      return;
    }

    let token = this.tokenInvitacion.trim();
    try {
      const url = new URL(token);
      token = url.searchParams.get('token') || token;
    } catch {}

    this.hogarService.unirse(token).subscribe({
      next: () => {
        this.tokenInvitacion = '';
        this.toast.show('Te uniste al hogar exitosamente', 'success');
        this.cargarHogares();
      },
      error: (err) => this.toast.showApiError(err, 'Token inválido')
    });
  }

  seleccionarHogar(h: Hogar) {
    localStorage.setItem('hogarId', h.id);
    this.hogarSeleccionado = h.id;
    this.cargarHogares();
    this.toast.show(`${h.nombre} seleccionado`, 'success');
  }

  invitar(h: Hogar) {
    this.hogarService.invitar(h.id).subscribe({
      next: (res) => {
        this.linkInvitacion = h.id;
        const idx = this.hogares.findIndex(x => x.id === h.id);
        if (idx !== -1) this.hogares[idx].tokenInvitacion = res.tokenInvitacion;
        this.toast.show('Invitación generada', 'success');
      },
      error: (err) => this.toast.showApiError(err, 'Error al generar invitación')
    });
  }

  esAdmin(h: Hogar): boolean {
    const usuarioId = this.auth.currentUser()?.id;
    if (!usuarioId || !h.miembros) return false;
    return h.miembros.some(m => m.usuario.id === usuarioId && m.rol === 'ADMIN');
  }

  async eliminarHogar(h: Hogar) {
    const ok = await this.confirm.confirm(
      `¿Estás seguro de eliminar "${h.nombre}"?\n\nEsta acción eliminará TODOS los ingresos, gastos, tarjetas, categorías y metas asociados a este hogar. No se puede deshacer.`
    );
    if (!ok) return;

    this.hogarService.eliminar(h.id).subscribe({
      next: () => {
        this.toast.show(`Hogar "${h.nombre}" eliminado`, 'error');
        if (this.hogarSeleccionado === h.id) {
          localStorage.removeItem('hogarId');
          this.hogarSeleccionado = '';
        }
        this.cargarHogares();
      },
      error: (err) => this.toast.showApiError(err, 'Error al eliminar hogar')
    });
  }

  quitarMiembro(hogarId: string, miembroId: string) {
    this.hogarService.quitarMiembro(hogarId, miembroId).subscribe({
      next: () => {
        this.toast.show('Miembro eliminado del hogar', 'success');
        this.cargarHogares();
      },
      error: (err) => this.toast.showApiError(err, 'Error al quitar miembro')
    });
  }

  copiarToken(token: string) {
    navigator.clipboard.writeText(token).then(() => {
      this.toast.show('Token copiado al portapapeles', 'success');
    }).catch(() => {
      this.toast.show('No se pudo copiar el token', 'error');
    });
  }

  private validarTarjeta(nombre: string, ultimo4: string): boolean {
    const nombreValido = validarNombre(nombre, 50);
    if (!nombreValido.ok) {
      this.toast.show(nombreValido.mensaje!, 'error');
      return false;
    }
    const ultimo4Valido = validarUltimos4(ultimo4);
    if (!ultimo4Valido.ok) {
      this.toast.show(ultimo4Valido.mensaje!, 'error');
      return false;
    }
    return true;
  }

  crearTarjeta(hogarId: string) {
    const nombre = this.tarjetaNombre.trim();
    const ultimo4 = this.tarjetaUltimo4.trim();
    if (!this.validarTarjeta(nombre, ultimo4)) return;

    const diaCierre = this.tarjetaDiaCierre ? parseInt(this.tarjetaDiaCierre) : undefined;

    this.tarjetaService.crearTarjeta(hogarId, nombre, ultimo4, diaCierre).subscribe({
      next: () => {
        this.tarjetaNombre = '';
        this.tarjetaUltimo4 = '';
        this.tarjetaDiaCierre = '';
        this.toast.show('Tarjeta agregada', 'success');
        this.cargarHogares();
      },
      error: (err) => this.toast.showApiError(err, 'Error al crear tarjeta')
    });
  }

  eliminarTarjeta(id: string) {
    this.tarjetaService.eliminar(id).subscribe({
      next: () => {
        this.toast.show('Tarjeta eliminada', 'success');
        this.cargarHogares();
      },
      error: (err) => this.toast.showApiError(err, 'Error al eliminar')
    });
  }

  iniciarEdicionTarjeta(t: TarjetaResumen) {
    this.tarjetaEditandoId = t.id;
    this.tarjetaEditNombre = t.nombre;
    this.tarjetaEditUltimo4 = t.ultimo4;
    this.tarjetaEditDiaCierre = t.diaCierre ? String(t.diaCierre) : '';
  }

  cancelarEdicionTarjeta() {
    this.tarjetaEditandoId = '';
    this.tarjetaEditNombre = '';
    this.tarjetaEditUltimo4 = '';
    this.tarjetaEditDiaCierre = '';
  }

  guardarEdicionTarjeta(id: string) {
    const nombre = this.tarjetaEditNombre.trim();
    const ultimo4 = this.tarjetaEditUltimo4.trim();
    if (!this.validarTarjeta(nombre, ultimo4)) return;

    const diaCierre = this.tarjetaEditDiaCierre ? parseInt(this.tarjetaEditDiaCierre) : undefined;

    this.tarjetaService.actualizar(id, { nombre, ultimo4, diaCierre }).subscribe({
      next: () => {
        this.cancelarEdicionTarjeta();
        this.toast.show('Tarjeta actualizada', 'success');
        this.cargarHogares();
      },
      error: (err) => this.toast.showApiError(err, 'Error al actualizar')
    });
  }
}
