import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GastoService } from '../../services/gasto.service';
import { TarjetaService } from '../../services/tarjeta.service';
import { CategoriaService } from '../../services/categoria.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';
import { Gasto, TarjetaCredito, Categoria } from '../../models';
import { toInputDate, validarDescripcion, validarMontoPositivo } from '../../core/utils/form-utils';
import { presets } from '../../core/utils/date-presets';
import calcularRango from '../../core/utils/date-presets';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePickerComponent],
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
          <label>Categoría</label>
          <select [(ngModel)]="form.categoriaId" name="categoriaId">
            <option value="">Sin categoría</option>
            <option *ngFor="let c of categorias" [value]="c.id">{{ c.icon }} {{ c.nombre }}</option>
          </select>
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
        <app-date-picker [(ngModel)]="filtroDesde" name="filtroDesde" placeholder="dd/mm/aaaa" style="width:130px;"></app-date-picker>
      </div>
      <div style="display:flex; flex-direction:column; gap:2px;">
        <label style="font-size:11px; font-weight:600; color:var(--text-2);">Hasta</label>
        <app-date-picker [(ngModel)]="filtroHasta" name="filtroHasta" placeholder="dd/mm/aaaa" style="width:130px;"></app-date-picker>
      </div>
      <ng-container *ngIf="!isMobile || filtrosExtraAbierto">
        <div style="display:flex; flex-direction:column; gap:2px;">
          <label style="font-size:11px; font-weight:600; color:var(--text-2);">Tipo</label>
          <select [(ngModel)]="filtroTipo" name="filtroTipo" class="select-filter">
            <option value="">Todos</option>
            <option value="PUNTUAL">Puntual</option>
            <option value="RECURRENTE">Recurrente</option>
            <option value="INDEFINIDO">Indefinido</option>
          </select>
        </div>
        <div style="display:flex; flex-direction:column; gap:2px;">
          <label style="font-size:11px; font-weight:600; color:var(--text-2);">Categoría</label>
          <select [(ngModel)]="filtroCategoriaId" name="filtroCategoriaId" class="select-filter">
            <option value="">Todas</option>
            <option *ngFor="let c of categorias" [value]="c.id">{{ c.icon }} {{ c.nombre }}</option>
          </select>
        </div>
        <div style="display:flex; flex-direction:column; gap:2px;">
          <label style="font-size:11px; font-weight:600; color:var(--text-2);">Tarjeta</label>
          <select [(ngModel)]="filtroTarjetaId" name="filtroTarjetaId" class="select-filter">
            <option value="">Todas</option>
            <option *ngFor="let t of tarjetas" [value]="t.id">{{ t.nombre }} ({{ t.ultimo4 }})</option>
          </select>
        </div>
      </ng-container>
      <button *ngIf="isMobile && !filtrosExtraAbierto" type="button" class="btn btn-secondary btn-md" (click)="filtrosExtraAbierto = true" style="font-size:12px;">+ Más filtros</button>
      <button *ngIf="isMobile && filtrosExtraAbierto" type="button" class="btn btn-secondary btn-md" (click)="filtrosExtraAbierto = false" style="font-size:12px;">− Menos filtros</button>
      <button type="button" class="btn btn-primary btn-md" (click)="aplicarFiltro()">Filtrar</button>
      <button *ngIf="filtroActivo" type="button" class="btn btn-secondary btn-md" (click)="limpiarFiltro()">Limpiar</button>
    </div>

    <div *ngIf="!hogarId" class="no-hogar">
      <h3>Seleccioná un hogar</h3>
      <p>Necesitás seleccionar o crear un hogar para empezar a registrar gastos.</p>
      <button type="button" class="btn btn-primary btn-md" routerLink="/hogares">Ir a hogares</button>
    </div>

    <div *ngIf="hogarId && !gastos.length" class="no-hogar">
      <h3>Todavía no cargaste gastos</h3>
      <p>Registrá tu primer gasto para empezar a controlar tus finanzas.</p>
    </div>

    <div *ngIf="hogarId && gastos.length" class="card" style="padding:6px 4px;">
      <table class="tx">
        <tr><th>Descripción</th><th>Monto</th><th>Tipo</th><th>Fecha</th><th>Cuotas</th><th>Categoría</th><th>Tarjeta</th><th style="text-align:right;">Acciones</th></tr>
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
          <td data-label="Categoría">
            <span *ngIf="g.categoria" style="display:inline-flex; align-items:center; gap:4px;">
              <span class="cat-icon" style="width:24px;height:24px;font-size:14px;background:var(--n-100);color:var(--n-600);">{{ g.categoria.icon }}</span>
              {{ g.categoria.nombre }}
            </span>
            <span *ngIf="!g.categoria">-</span>
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
  private categoriaService = inject(CategoriaService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);

  tarjetas: TarjetaCredito[] = [];
  categorias: Categoria[] = [];
  gastos: Gasto[] = [];
  hogarId = '';
  editando = false;
  editId = '';
  gastoOriginal: Gasto | null = null;

  form: { descripcion: string; monto: number; tipo: 'PUNTUAL' | 'RECURRENTE' | 'INDEFINIDO'; fechaInicio: string; cuotasTotales: number; tarjetaId: string; categoriaId: string } = { descripcion: '', monto: 0, tipo: 'PUNTUAL', fechaInicio: '', cuotasTotales: 0, tarjetaId: '', categoriaId: '' };

  filtroDesde = '';
  filtroHasta = '';
  filtroTipo = '';
  filtroCategoriaId = '';
  filtroTarjetaId = '';
  filtroActivo = false;
  filtroPreset = 'este-mes';
  filtrosExtraAbierto = false;
  isMobile = window.innerWidth <= 768;

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth <= 768; }
  readonly presets = presets;

  ngOnInit() {
    this.hogarId = localStorage.getItem('hogarId') || '';
    if (this.hogarId) {
      this.cargarDatos();
      this.aplicarPreset('este-mes');
    }
  }

  cargarDatos() {
    if (!this.hogarId) return;
    this.tarjetaService.listarPorHogar(this.hogarId).subscribe(t => this.tarjetas = t);
    this.categoriaService.listar(this.hogarId).subscribe(c => this.categorias = c);
  }

  aplicarPreset(preset: string) {
    this.filtroPreset = preset;
    this.filtroTipo = '';
    this.filtroCategoriaId = '';
    this.filtroTarjetaId = '';
    const { desde, hasta } = calcularRango(preset);
    this.filtroDesde = desde;
    this.filtroHasta = hasta;
    this.filtroActivo = true;
    this.gastoService.listarPorFiltros(this.hogarId, {
      desde: desde || undefined,
      hasta: hasta || undefined,
    }).subscribe(g => this.gastos = g);
  }

  aplicarFiltro() {
    if (!this.hogarId) return;
    this.filtroPreset = 'personalizado';
    this.filtroActivo = true;
    this.gastoService.listarPorFiltros(this.hogarId, {
      desde: this.filtroDesde || undefined,
      hasta: this.filtroHasta || undefined,
      tipo: this.filtroTipo || undefined,
      categoriaId: this.filtroCategoriaId || undefined,
      tarjetaId: this.filtroTarjetaId || undefined,
    }).subscribe(g => this.gastos = g);
  }

  limpiarFiltro() {
    this.aplicarPreset('este-mes');
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
      tarjetaId: this.form.tarjetaId || undefined,
      categoriaId: this.form.categoriaId || undefined
    };
    if (this.editando) {
      this.gastoService.actualizar(this.editId, payload).subscribe({
        next: () => { this.cancelar(); this.cargarDatos(); this.aplicarPreset(this.filtroPreset); this.toast.show('Gasto actualizado', 'success'); },
        error: (err) => this.toast.showApiError(err, 'Error al actualizar')
      });
    } else {
      this.gastoService.crear({ hogarId: this.hogarId, ...payload }).subscribe({
        next: () => { this.resetForm(); this.cargarDatos(); this.aplicarPreset(this.filtroPreset); this.toast.show('Gasto creado', 'success'); },
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
      tarjetaId: g.tarjetaId || '',
      categoriaId: g.categoriaId || ''
    };
  }

  cancelar() {
    this.editando = false;
    this.editId = '';
    this.gastoOriginal = null;
    this.resetForm();
  }

  resetForm() {
    this.form = { descripcion: '', monto: 0, tipo: 'PUNTUAL', fechaInicio: '', cuotasTotales: 0, tarjetaId: '', categoriaId: '' };
  }

  pagarCuota(id: string) {
    this.gastoService.pagarCuota(id).subscribe(() => { this.cargarDatos(); this.aplicarPreset(this.filtroPreset); });
  }

  async eliminar(id: string) {
    const ok = await this.confirmService.confirm('¿Eliminar este gasto?');
    if (ok) {
      this.gastoService.eliminar(id).subscribe(() => { this.cargarDatos(); this.aplicarPreset(this.filtroPreset); this.toast.show('Gasto eliminado', 'success'); });
    }
  }
}
