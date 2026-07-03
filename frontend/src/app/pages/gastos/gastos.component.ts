import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GastoService } from '../../services/gasto.service';
import { TarjetaService } from '../../services/tarjeta.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';
import { ArsCurrencyPipe } from '../../core/pipes/ars-currency.pipe';
import { Gasto, TarjetaCredito } from '../../models';
import { toInputDate, validarDescripcion, validarMontoPositivo } from '../../core/utils/form-utils';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerComponent, ArsCurrencyPipe],
  template: `
    <div class="demo-topbar">
      <div>
        <div class="eyebrow">Movimientos</div>
        <div class="sec-title">Gastos</div>
      </div>
    </div>

    <form *ngIf="hogarId" (ngSubmit)="guardar()" class="card" style="margin-bottom:20px;">
      <div class="card-title">{{ editando ? 'Editar gasto' : 'Nuevo gasto' }}</div>
      <div class="fields-grid" style="margin-top:12px;">
        <div class="field">
          <label>Descripción</label>
          <input type="text" [(ngModel)]="form.descripcion" name="descripcion" placeholder="Ej. Supermercado" required maxlength="100" />
        </div>
        <div class="field">
          <label>{{ form.tipo === 'RECURRENTE' ? 'Monto total' : 'Monto' }}</label>
          <input type="number" [(ngModel)]="form.monto" name="monto" placeholder="0.00" required min="0.01" step="0.01" />
        </div>
        <div class="field">
          <label>Tipo</label>
          <select [(ngModel)]="form.tipo" name="tipo" (ngModelChange)="onTipoChange()">
            <option value="PUNTUAL">Puntual</option>
            <option value="RECURRENTE">Recurrente</option>
            <option value="INDEFINIDO">Indefinido</option>
          </select>
        </div>
        <div class="field">
          <label>Fecha <span *ngIf="form.tipo === 'INDEFINIDO'" style="font-weight:400;color:var(--text-3);">(opcional)</span></label>
          <app-date-picker [(ngModel)]="form.fechaInicio" name="fechaInicio" [required]="form.tipo !== 'INDEFINIDO'" placeholder="dd/mm/yyyy"></app-date-picker>
        </div>
        <div class="field" *ngIf="form.tipo === 'RECURRENTE'">
          <label>Cuotas</label>
          <input type="number" [(ngModel)]="form.cuotasTotales" name="cuotasTotales" placeholder="1" min="1" />
        </div>
        <div class="field">
          <label>Tarjeta</label>
          <select [(ngModel)]="form.tarjetaId" name="tarjetaId">
            <option value="">Sin tarjeta</option>
            <option *ngFor="let t of tarjetas" [value]="t.id">{{ t.nombre }} ({{ t.ultimo4 }})</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-md">{{ editando ? 'Actualizar' : '+ Agregar' }}</button>
          <button *ngIf="editando" type="button" class="btn btn-secondary btn-md" (click)="cancelar()">Cancelar</button>
        </div>
      </div>
      <div *ngIf="form.tipo === 'RECURRENTE'" style="margin-top:10px; font-size:12px; color:var(--text-2);">
        En compras con cuotas, el <strong>monto es el total de la compra</strong> y se divide en pagos mensuales.
        <span *ngIf="form.cuotasTotales && form.monto">
          Cada cuota será de <strong>{{ form.monto / form.cuotasTotales | currency:'ARS':'symbol':'1.0-0':'es-AR' }} mensuales</strong>.
        </span>
      </div>
    </form>

    <div *ngIf="hogarId && !gastos.length" class="no-hogar">
      <h3>Todavía no cargaste gastos</h3>
      <p>Registrá tu primer gasto para empezar a controlar tus finanzas.</p>
    </div>

    <div *ngIf="gastos.length" class="card" style="padding:6px 4px;">
      <table class="tx">
        <tr><th>Descripción</th><th>Monto</th><th>Tipo</th><th>Fecha</th><th>Cuotas</th><th>Tarjeta</th><th style="text-align:right;">Acciones</th></tr>
        <tr *ngFor="let g of gastos">
          <td data-label="Descripción"><div class="tx-name"><span class="tx-icon" style="background:var(--primary-50); color:var(--primary-700);">$</span>{{ g.descripcion || '-' }}</div></td>
          <td data-label="Monto" class="amt-neg">
            <div *ngIf="g.cuotasTotales; else montoSimple" style="display:flex; flex-direction:column; line-height:1.3;">
              <span>{{ g.monto / g.cuotasTotales | currency:'ARS':'symbol':'1.0-0':'es-AR' }} /mes</span>
              <span style="font-size:11px; color:var(--text-3); font-weight:500;">{{ g.cuotasTotales }} cuotas de {{ g.monto | currency:'ARS':'symbol':'1.0-0':'es-AR' }}</span>
            </div>
            <ng-template #montoSimple>{{ (g.monto | currency:'ARS':'symbol':'1.0-0':'es-AR') || '-' }}</ng-template>
          </td>
          <td data-label="Tipo"><span class="badge"
            [class.badge-danger]="g.tipo === 'PUNTUAL'"
            [class.badge-warning]="g.tipo === 'RECURRENTE'"
            [class.badge-neutral]="g.tipo === 'INDEFINIDO'">{{ g.tipo ? (g.tipo === 'INDEFINIDO' ? 'Indefinido' : g.tipo) : '-' }}</span></td>
          <td data-label="Fecha">{{ g.fechaInicio ? (g.fechaInicio | date:'dd/MM/yyyy':'UTC':'es-AR') : 'Indefinido' }}</td>
          <td data-label="Cuotas">
            <span *ngIf="g.cuotasTotales">{{ g.cuotasPagadas || 0 }}/{{ g.cuotasTotales }}</span>
            <span *ngIf="!g.cuotasTotales">-</span>
            <button *ngIf="g.cuotasTotales && (g.cuotasPagadas || 0) < g.cuotasTotales" type="button" class="btn btn-secondary btn-sm" (click)="pagarCuota(g.id)">+1</button>
          </td>
          <td data-label="Tarjeta">{{ g.tarjeta?.nombre || '-' }}</td>
          <td data-label="Acciones" style="text-align:right;">
            <button type="button" class="btn btn-ghost btn-sm" (click)="editar(g)">Editar</button>
            <button type="button" class="btn btn-danger btn-sm" (click)="eliminar(g.id)">Eliminar</button>
          </td>
        </tr>
      </table>
    </div>
  `
})
export class GastosComponent implements OnInit {
  private gastoService = inject(GastoService);
  private tarjetaService = inject(TarjetaService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);

  tarjetas: TarjetaCredito[] = [];
  gastos: Gasto[] = [];
  hogarId = '';
  editando = false;
  editId = '';
  gastoOriginal: Gasto | null = null;

  form: { descripcion: string; monto: number; tipo: 'PUNTUAL' | 'RECURRENTE' | 'INDEFINIDO'; fechaInicio: string; cuotasTotales: number; tarjetaId: string } = { descripcion: '', monto: 0, tipo: 'PUNTUAL', fechaInicio: '', cuotasTotales: 0, tarjetaId: '' };

  ngOnInit() {
    this.hogarId = localStorage.getItem('hogarId') || '';
    if (this.hogarId) this.cargarDatos();
  }

  cargarDatos() {
    if (!this.hogarId) return;
    this.tarjetaService.listarPorHogar(this.hogarId).subscribe(t => this.tarjetas = t);
    this.gastoService.listarPorHogar(this.hogarId).subscribe(g => {
      console.log('[Gastos] datos recibidos:', g);
      this.gastos = g;
    });
  }

  onTipoChange() {
    if (this.form.tipo !== 'RECURRENTE') {
      this.form.cuotasTotales = 0;
    }
  }

  guardar() {
    const desc = validarDescripcion(this.form.descripcion);
    if (!desc.ok) { this.toast.show(desc.mensaje!, 'error'); return; }

    const monto = validarMontoPositivo(this.form.monto);
    if (!monto.ok) { this.toast.show(monto.mensaje!, 'error'); return; }

    if (this.form.tipo !== 'INDEFINIDO' && !this.form.fechaInicio) {
      this.toast.show('La fecha es obligatoria para este tipo', 'error');
      return;
    }
    if (this.form.tipo === 'RECURRENTE' && this.form.cuotasTotales && this.form.cuotasTotales < 1) {
      this.toast.show('Las cuotas deben ser al menos 1', 'error');
      return;
    }
    if (this.form.tipo !== 'RECURRENTE') {
      this.form.cuotasTotales = 0;
    }
    if (
      this.editando &&
      this.gastoOriginal &&
      this.form.cuotasTotales &&
      this.gastoOriginal.cuotasPagadas > this.form.cuotasTotales
    ) {
      this.toast.show('Las cuotas totales no pueden ser menores a las cuotas pagadas', 'error');
      return;
    }

    const payload = {
      descripcion: this.form.descripcion.trim(),
      monto: this.form.monto,
      tipo: this.form.tipo,
      fechaInicio: this.form.fechaInicio || undefined,
      cuotasTotales: this.form.tipo === 'RECURRENTE' ? (this.form.cuotasTotales || undefined) : undefined,
      tarjetaId: this.form.tarjetaId || undefined
    };
    if (this.editando) {
      this.gastoService.actualizar(this.editId, payload).subscribe({
        next: () => { this.cancelar(); this.cargarDatos(); this.toast.show('Gasto actualizado', 'success'); },
        error: (err) => this.toast.showApiError(err, 'Error al actualizar')
      });
    } else {
      this.gastoService.crear({ hogarId: this.hogarId, ...payload }).subscribe({
        next: () => { this.resetForm(); this.cargarDatos(); this.toast.show('Gasto creado', 'success'); },
        error: (err) => this.toast.showApiError(err, 'Error al crear')
      });
    }
  }

  editar(g: Gasto) {
    this.editando = true;
    this.editId = g.id;
    this.gastoOriginal = g;
    this.form = {
      descripcion: g.descripcion,
      monto: g.monto,
      tipo: g.tipo,
      fechaInicio: toInputDate(g.fechaInicio),
      cuotasTotales: g.cuotasTotales || 0,
      tarjetaId: g.tarjetaId || ''
    };
  }

  cancelar() {
    this.editando = false;
    this.editId = '';
    this.gastoOriginal = null;
    this.resetForm();
  }

  resetForm() {
    this.form = { descripcion: '', monto: 0, tipo: 'PUNTUAL', fechaInicio: '', cuotasTotales: 0, tarjetaId: '' };
  }

  pagarCuota(id: string) {
    this.gastoService.pagarCuota(id).subscribe(() => this.cargarDatos());
  }

  async eliminar(id: string) {
    const ok = await this.confirmService.confirm('¿Eliminar este gasto?');
    if (ok) {
      this.gastoService.eliminar(id).subscribe(() => { this.cargarDatos(); this.toast.show('Gasto eliminado', 'success'); });
    }
  }
}
