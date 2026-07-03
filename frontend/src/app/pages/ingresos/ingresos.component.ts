import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IngresoService } from '../../services/ingreso.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';
import { Ingreso } from '../../models';
import { toInputDate, validarDescripcion, validarMontoPositivo } from '../../core/utils/form-utils';

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerComponent],
  template: `
    <div class="demo-topbar">
      <div>
        <div class="eyebrow">Movimientos</div>
        <div class="sec-title">Ingresos</div>
      </div>
    </div>

    <form *ngIf="hogarId" (ngSubmit)="guardar()" class="card" style="margin-bottom:20px;">
      <div class="card-title">{{ editando ? 'Editar ingreso' : 'Nuevo ingreso' }}</div>
      <div class="fields-grid" style="margin-top:12px;">
        <div class="field">
          <label>Descripción</label>
          <input type="text" [(ngModel)]="form.descripcion" name="descripcion" placeholder="Ej. Salario" required maxlength="100" />
        </div>
        <div class="field">
          <label>Monto</label>
          <input type="number" [(ngModel)]="form.monto" name="monto" placeholder="0.00" required min="0.01" step="0.01" />
        </div>
        <div class="field">
          <label>Tipo</label>
          <select [(ngModel)]="form.tipo" name="tipo">
            <option value="PUNTUAL">Puntual</option>
            <option value="RECURRENTE">Recurrente</option>
            <option value="INDEFINIDO">Indefinido</option>
          </select>
        </div>
        <div class="field">
          <label>Fecha inicio <span *ngIf="form.tipo === 'INDEFINIDO'" style="font-weight:400;color:var(--text-3);">(opcional)</span></label>
          <app-date-picker [(ngModel)]="form.fechaInicio" name="fechaInicio" [required]="form.tipo !== 'INDEFINIDO'" placeholder="dd/mm/yyyy"></app-date-picker>
        </div>
        <div class="field" *ngIf="form.tipo === 'RECURRENTE' || form.tipo === 'INDEFINIDO'">
          <label>Fecha fin <span *ngIf="form.tipo === 'INDEFINIDO'" style="font-weight:400;color:var(--text-3);">(opcional)</span></label>
          <app-date-picker [(ngModel)]="form.fechaFin" name="fechaFin" placeholder="dd/mm/yyyy"></app-date-picker>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-md">{{ editando ? 'Actualizar' : '+ Agregar' }}</button>
          <button *ngIf="editando" type="button" class="btn btn-secondary btn-md" (click)="cancelar()">Cancelar</button>
        </div>
      </div>
    </form>

    <div *ngIf="hogarId" style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">
      <button *ngFor="let p of presets" type="button" class="btn btn-sm"
        [class.btn-primary]="filtroPreset === p.id"
        [class.btn-secondary]="filtroPreset !== p.id"
        style="font-size:12px; padding:4px 12px;"
        (click)="aplicarPreset(p.id)">{{ p.label }}</button>
    </div>

    <div *ngIf="hogarId" style="display:flex; align-items:flex-end; gap:12px; flex-wrap:wrap; margin-bottom:16px;">
      <div style="display:flex; flex-direction:column; gap:2px;">
        <label style="font-size:11px; font-weight:600; color:var(--text-2);">Desde</label>
        <app-date-picker [(ngModel)]="filtroDesde" name="filtroDesde" placeholder="dd/mm/aaaa" style="width:140px;"></app-date-picker>
      </div>
      <div style="display:flex; flex-direction:column; gap:2px;">
        <label style="font-size:11px; font-weight:600; color:var(--text-2);">Hasta</label>
        <app-date-picker [(ngModel)]="filtroHasta" name="filtroHasta" placeholder="dd/mm/aaaa" style="width:140px;"></app-date-picker>
      </div>
      <button type="button" class="btn btn-primary btn-md" (click)="aplicarFiltro()">Filtrar</button>
      <button *ngIf="filtroActivo" type="button" class="btn btn-secondary btn-md" (click)="limpiarFiltro()">Limpiar</button>
    </div>

    <div *ngIf="hogarId && !ingresos.length" class="no-hogar">
      <h3>Todavía no cargaste ingresos</h3>
      <p>Registrá tu primer ingreso para empezar a ver tu balance.</p>
    </div>

    <div *ngIf="ingresos.length" class="card" style="padding:6px 4px;">
      <table class="tx">
        <tr><th>Descripción</th><th>Monto</th><th>Tipo</th><th>Fecha</th><th style="text-align:right;">Acciones</th></tr>
        <tr *ngFor="let i of ingresos">
          <td data-label="Descripción"><div class="tx-name"><span class="tx-icon" style="background:var(--success-100); color:var(--success-700);">$</span>{{ i.descripcion || '-' }}</div></td>
          <td data-label="Monto" class="amt-pos">{{ (i.monto | currency:'ARS':'symbol':'1.0-0':'es-AR') || '-' }}</td>
          <td data-label="Tipo"><span class="badge"
            [class.badge-success]="i.tipo === 'PUNTUAL'"
            [class.badge-warning]="i.tipo === 'RECURRENTE'"
            [class.badge-neutral]="i.tipo === 'INDEFINIDO'">{{ i.tipo ? (i.tipo === 'INDEFINIDO' ? 'Indefinido' : i.tipo) : '-' }}</span></td>
          <td data-label="Fecha">{{ i.fechaInicio ? (i.fechaInicio | date:'dd/MM/yyyy':'UTC':'es-AR') : 'Indefinido' }}</td>
          <td data-label="Acciones" style="text-align:right;">
            <button type="button" class="btn btn-ghost btn-sm" (click)="editar(i)">Editar</button>
            <button type="button" class="btn btn-danger btn-sm" (click)="eliminar(i.id)">Eliminar</button>
          </td>
        </tr>
      </table>
    </div>
  `
})
export class IngresosComponent implements OnInit {
  private ingresoService = inject(IngresoService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);

  hogarId = '';
  ingresos: Ingreso[] = [];
  editando = false;
  editId = '';
  filtroDesde = '';
  filtroHasta = '';
  filtroActivo = false;
  filtroPreset = 'este-mes';
  readonly presets = [
    { id: 'este-mes', label: 'Este mes' },
    { id: 'mes-anterior', label: 'Mes anterior' },
    { id: 'ultimos-3', label: 'Últ. 3 meses' },
    { id: 'ultimos-6', label: 'Últ. 6 meses' },
    { id: 'este-anio', label: 'Este año' },
  ];

  form: { descripcion: string; monto: number; tipo: 'PUNTUAL' | 'RECURRENTE' | 'INDEFINIDO'; fechaInicio: string; fechaFin: string } = { descripcion: '', monto: 0, tipo: 'PUNTUAL', fechaInicio: '', fechaFin: '' };

  ngOnInit() {
    this.hogarId = localStorage.getItem('hogarId') || '';
    if (this.hogarId) this.aplicarPreset('este-mes');
  }

  private calcularPreset(preset: string) {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = hoy.getMonth();
    switch (preset) {
      case 'este-mes': {
        const desde = new Date(y, m, 1);
        const hasta = new Date(y, m + 1, 0);
        return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
      }
      case 'mes-anterior': {
        const desde = new Date(y, m - 1, 1);
        const hasta = new Date(y, m, 0);
        return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
      }
      case 'ultimos-3': {
        const desde = new Date(y, m - 3, 1);
        const hasta = hoy;
        return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
      }
      case 'ultimos-6': {
        const desde = new Date(y, m - 6, 1);
        const hasta = hoy;
        return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
      }
      case 'este-anio': {
        const desde = new Date(y, 0, 1);
        const hasta = new Date(y, 11, 31);
        return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
      }
      default:
        return { desde: '', hasta: '' };
    }
  }

  aplicarPreset(preset: string) {
    this.filtroPreset = preset;
    const { desde, hasta } = this.calcularPreset(preset);
    this.filtroDesde = desde;
    this.filtroHasta = hasta;
    this.filtroActivo = true;
    this.ingresoService.listarPorFiltros(this.hogarId, desde || undefined, hasta || undefined).subscribe(i => this.ingresos = i);
  }

  aplicarFiltro() {
    if (!this.hogarId) return;
    this.filtroPreset = 'personalizado';
    this.filtroActivo = true;
    this.ingresoService.listarPorFiltros(this.hogarId, this.filtroDesde || undefined, this.filtroHasta || undefined).subscribe(i => {
      this.ingresos = i;
    });
  }

  limpiarFiltro() {
    this.aplicarPreset('este-mes');
  }

  guardar() {
    const desc = validarDescripcion(this.form.descripcion);
    if (!desc.ok) { this.toast.show(desc.mensaje!, 'error'); return; }

    const monto = validarMontoPositivo(this.form.monto);
    if (!monto.ok) { this.toast.show(monto.mensaje!, 'error'); return; }

    if (this.form.tipo !== 'INDEFINIDO' && !this.form.fechaInicio) {
      this.toast.show('La fecha de inicio es obligatoria para este tipo', 'error');
      return;
    }
    if (this.form.fechaInicio && this.form.fechaFin && this.form.fechaFin < this.form.fechaInicio) {
      this.toast.show('La fecha de fin debe ser mayor o igual a la de inicio', 'error');
      return;
    }

    const payload = {
      descripcion: this.form.descripcion.trim(),
      monto: this.form.monto,
      tipo: this.form.tipo,
      fechaInicio: this.form.fechaInicio || undefined,
      fechaFin: this.form.fechaFin || undefined
    };
    if (this.editando) {
      this.ingresoService.actualizar(this.editId, payload).subscribe({
        next: () => { this.cancelar(); this.aplicarPreset(this.filtroPreset); this.toast.show('Ingreso actualizado', 'success'); },
        error: (err) => this.toast.showApiError(err, 'Error al actualizar')
      });
    } else {
      this.ingresoService.crear({ hogarId: this.hogarId, ...payload }).subscribe({
        next: () => { this.resetForm(); this.aplicarPreset(this.filtroPreset); this.toast.show('Ingreso creado', 'success'); },
        error: (err) => this.toast.showApiError(err, 'Error al crear')
      });
    }
  }

  editar(i: Ingreso) {
    this.editando = true;
    this.editId = i.id;
    this.form = {
      descripcion: i.descripcion,
      monto: i.monto,
      tipo: i.tipo,
      fechaInicio: toInputDate(i.fechaInicio),
      fechaFin: toInputDate(i.fechaFin)
    };
  }

  cancelar() {
    this.editando = false;
    this.editId = '';
    this.resetForm();
  }

  resetForm() {
    this.form = { descripcion: '', monto: 0, tipo: 'PUNTUAL', fechaInicio: '', fechaFin: '' };
  }

  async eliminar(id: string) {
    const ok = await this.confirmService.confirm('¿Eliminar este ingreso?');
    if (ok) {
      this.ingresoService.eliminar(id).subscribe(() => { this.aplicarPreset(this.filtroPreset); this.toast.show('Ingreso eliminado', 'success'); });
    }
  }
}
