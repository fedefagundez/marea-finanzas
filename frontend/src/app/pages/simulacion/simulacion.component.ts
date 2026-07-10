import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SimulacionService } from '../../services/simulacion.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';
import { EvolutionChartComponent } from '../../components/evolution-chart/evolution-chart.component';
import { ArsCurrencyPipe } from '../../core/pipes/ars-currency.pipe';
import { Simulacion, ItemSimulacion, ProyeccionSimulacionItem } from '../../models';
import { toInputDate } from '../../core/utils/form-utils';

@Component({
  selector: 'app-simulacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePickerComponent, EvolutionChartComponent, ArsCurrencyPipe],
  template: `
    <div class="demo-topbar">
      <div style="display:flex; align-items:center; gap:10px;">
        <a routerLink="/simulaciones" style="color:var(--text-3); text-decoration:none; font-size:18px;">←</a>
        <div>
          <div class="eyebrow">Simulación</div>
          <div class="sec-title">{{ simulacion?.nombre || 'Cargando...' }}</div>
        </div>
      </div>
    </div>

    <div *ngIf="cargando" style="text-align:center; padding:40px 0; color:var(--text-3); font-size:13px;">
      Cargando...
    </div>

    <div *ngIf="!cargando && !simulacion" class="no-hogar">
      <h3>Simulación no encontrada</h3>
      <button type="button" class="btn btn-primary btn-md" routerLink="/simulaciones">Volver</button>
    </div>

    <div *ngIf="!cargando && simulacion">
      <!-- Formulario de items -->
      <form (ngSubmit)="guardarItem()" class="card" style="margin-bottom:20px;">
        <div class="card-title">{{ editandoItem ? 'Editar item' : 'Agregar item simulado' }}</div>
        <div class="fields-grid" style="margin-top:12px;">
          <div class="field">
            <label>Descripción</label>
            <input type="text" [(ngModel)]="form.descripcion" name="descripcion" placeholder="Ej. Pasajes" required maxlength="100" />
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
            <label>Subtipo</label>
            <select [(ngModel)]="form.subtipo" name="subtipo">
              <option value="GASTO">Gasto</option>
              <option value="INGRESO">Ingreso</option>
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
          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-md">{{ editandoItem ? 'Actualizar' : '+ Agregar' }}</button>
            <button *ngIf="editandoItem" type="button" class="btn btn-secondary btn-md" (click)="cancelarEdicion()">Cancelar</button>
          </div>
        </div>
        <div *ngIf="form.tipo === 'RECURRENTE' && form.monto && form.cuotasTotales" style="margin-top:10px; font-size:12px; color:var(--text-2);">
          Cada cuota será de <strong>{{ form.monto / form.cuotasTotales | arsCurrency }} mensuales</strong>.
        </div>
      </form>

      <!-- Tabla de items -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title" style="display:flex; align-items:center; justify-content:space-between;">
          <span>Items simulados ({{ items.length }})</span>
        </div>
        <div *ngIf="items.length === 0" style="text-align:center; padding:24px 0; font-size:13px; color:var(--text-3);">
          Agregá items para comenzar la simulación
        </div>
        <div *ngIf="items.length > 0" class="tx" style="padding:6px 4px;">
          <table class="tx">
            <thead>
              <tr>
                <th>Item</th>
                <th>Tipo</th>
                <th>Período</th>
                <th style="text-align:right;">Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items">
                <td>
                  <div class="tx-name">
                    <span class="tx-icon" [style.background]="item.subtipo === 'INGRESO' ? 'var(--success-100)' : 'var(--primary-50)'" [style.color]="item.subtipo === 'INGRESO' ? 'var(--success-700)' : 'var(--primary-700)'">{{ item.subtipo === 'INGRESO' ? '+' : '-' }}</span>
                    {{ item.descripcion }}
                  </div>
                </td>
                <td>
                  <span class="badge" [class.badge-success]="item.subtipo === 'INGRESO'" [class.badge-danger]="item.subtipo === 'GASTO'">
                    {{ item.subtipo === 'INGRESO' ? 'Ingreso' : 'Gasto' }}
                  </span>
                  <span class="badge badge-neutral" style="margin-left:4px;">{{ item.tipo | lowercase }}</span>
                </td>
                <td style="font-size:12px; color:var(--text-2);">
                  <span *ngIf="item.fechaInicio">{{ item.fechaInicio | date:'dd/MM/yyyy' }}</span>
                  <span *ngIf="!item.fechaInicio">Sin fecha</span>
                  <span *ngIf="item.cuotasTotales"> · {{ item.cuotasTotales }} cuotas</span>
                </td>
                <td style="text-align:right; font-family:var(--font-mono); font-weight:600;" [class.amt-pos]="item.subtipo === 'INGRESO'" [class.amt-neg]="item.subtipo === 'GASTO'">
                  {{ item.monto | arsCurrency }}
                </td>
                <td style="white-space:nowrap;">
                  <button type="button" class="btn btn-ghost btn-sm" (click)="editarItem(item)" title="Editar">✏️</button>
                  <button type="button" class="btn btn-ghost btn-sm" (click)="eliminarItem(item)" title="Eliminar" style="color:var(--danger-500);">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Proyección -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title">Proyección a futuro</div>
        <div *ngIf="!proyeccion.length" style="text-align:center; padding:24px 0; font-size:13px; color:var(--text-3);">
          Agregá items para ver la proyección
        </div>
        <div *ngIf="proyeccion.length">
          <app-evolution-chart [data]="proyeccionChart" style="display:block; height:300px; margin-top:6px;"></app-evolution-chart>
          <table class="tx" style="margin-top:16px; padding:6px 4px;">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Tipo</th>
                <th style="text-align:right;">Ingresos</th>
                <th style="text-align:right;">Gastos</th>
                <th style="text-align:right;">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of proyeccion">
                <td style="font-weight:500;">{{ p.label }}</td>
                <td>
                  <span class="badge" [class.badge-success]="p.tipo === 'REAL'" [class.badge-warning]="p.tipo === 'SIMULADO'">
                    {{ p.tipo === 'REAL' ? 'Real' : 'Simulado' }}
                  </span>
                </td>
                <td style="text-align:right;" class="amt-pos">{{ p.ingresos | arsCurrency }}</td>
                <td style="text-align:right;" class="amt-neg">{{ p.gastos | arsCurrency }}</td>
                <td style="text-align:right; font-weight:700;" [style.color]="p.balance >= 0 ? 'var(--success-600)' : 'var(--danger-600)'">{{ p.balance | arsCurrency }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class SimulacionComponent implements OnInit {
  private simulacionService = inject(SimulacionService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  simulacion: Simulacion | null = null;
  items: ItemSimulacion[] = [];
  proyeccion: ProyeccionSimulacionItem[] = [];
  proyeccionChart: { mes: string; label: string; ingresos: number; gastos: number; balance: number; tipo: 'REAL' | 'PROYECTADO' }[] = [];
  cargando = true;
  editandoItem: ItemSimulacion | null = null;

  form = {
    descripcion: '',
    monto: null as number | null,
    tipo: 'RECURRENTE' as string,
    subtipo: 'GASTO' as string,
    fechaInicio: null as string | null,
    cuotasTotales: null as number | null,
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarSimulacion(id);
    } else {
      this.cargando = false;
    }
  }

  cargarSimulacion(id: string) {
    this.cargando = true;
    this.simulacionService.listar(localStorage.getItem('hogarId') || '').subscribe({
      next: (simulaciones) => {
        this.simulacion = simulaciones.find(s => s.id === id) || null;
        if (this.simulacion) {
          this.cargarItems();
          this.cargarProyeccion();
        } else {
          this.cargando = false;
        }
      },
      error: () => { this.cargando = false; },
    });
  }

  cargarItems() {
    if (!this.simulacion) return;
    // Los items vienen incluidos en la proyección, pero podemos obtenerlos del listado
    // Como no hay endpoint dedicado para listar items, usamos el de proyección
    this.simulacionService.proyeccion(this.simulacion.id).subscribe({
      next: (res) => {
        this.proyeccion = res.data;
        this.proyeccionChart = res.data.map(d => ({
          mes: d.mes,
          label: d.label,
          ingresos: d.ingresos,
          gastos: d.gastos,
          balance: d.balance,
          tipo: d.tipo === 'REAL' ? 'REAL' : 'PROYECTADO' as const,
        }));
      },
      error: () => {},
    });
  }

  cargarItemsDetalle() {
    // Necesitamos un endpoint para listar items. Por ahora refrescamos todo.
    // Los items se obtienen del listado de la BD directamente.
    // Como no hay GET /items, usamos el mismo trick.
    this.cargarItems();
  }

  guardarItem() {
    if (!this.simulacion || !this.form.descripcion.trim() || !this.form.monto) return;

    const payload = {
      descripcion: this.form.descripcion.trim(),
      monto: this.form.monto,
      tipo: this.form.tipo as 'PUNTUAL' | 'RECURRENTE' | 'INDEFINIDO',
      subtipo: this.form.subtipo as 'INGRESO' | 'GASTO',
      fechaInicio: this.form.fechaInicio || undefined,
      cuotasTotales: this.form.tipo === 'RECURRENTE' ? (this.form.cuotasTotales ?? undefined) : undefined,
    };

    if (this.editandoItem) {
      this.simulacionService.actualizarItem(this.editandoItem.id, payload).subscribe({
        next: () => {
          this.toast.show('Item actualizado', 'success');
          this.cancelarEdicion();
          this.cargarItems();
          this.cargarProyeccion();
        },
        error: () => this.toast.show('Error al actualizar', 'error'),
      });
    } else {
      this.simulacionService.agregarItem(this.simulacion.id, payload).subscribe({
        next: () => {
          this.toast.show('Item agregado', 'success');
          this.limpiarForm();
          this.cargarItems();
          this.cargarProyeccion();
        },
        error: () => this.toast.show('Error al agregar', 'error'),
      });
    }
  }

  editarItem(item: ItemSimulacion) {
    this.editandoItem = item;
    this.form = {
      descripcion: item.descripcion,
      monto: item.monto,
      tipo: item.tipo,
      subtipo: item.subtipo,
      fechaInicio: item.fechaInicio || null,
      cuotasTotales: item.cuotasTotales || null,
    };
  }

  cancelarEdicion() {
    this.editandoItem = null;
    this.limpiarForm();
  }

  limpiarForm() {
    this.form = {
      descripcion: '',
      monto: null,
      tipo: 'RECURRENTE',
      subtipo: 'GASTO',
      fechaInicio: null,
      cuotasTotales: null,
    };
  }

  async eliminarItem(item: ItemSimulacion) {
    const ok = await this.confirm.confirm(`¿Eliminar "${item.descripcion}"?`);
    if (!ok) return;
    this.simulacionService.eliminarItem(item.id).subscribe({
      next: () => {
        this.toast.show('Item eliminado', 'success');
        this.cargarItems();
        this.cargarProyeccion();
      },
      error: () => this.toast.show('Error al eliminar', 'error'),
    });
  }

  cargarProyeccion() {
    if (!this.simulacion) return;
    this.simulacionService.proyeccion(this.simulacion.id).subscribe({
      next: (res) => {
        this.proyeccion = res.data;
        this.proyeccionChart = res.data.map(d => ({
          mes: d.mes,
          label: d.label,
          ingresos: d.ingresos,
          gastos: d.gastos,
          balance: d.balance,
          tipo: d.tipo === 'REAL' ? 'REAL' : 'PROYECTADO' as const,
        }));
        // Refrescar items
        this.cargarItemsDesdeProyeccion(res.data);
      },
      error: () => {},
    });
  }

  private cargarItemsDesdeProyeccion(_data: ProyeccionSimulacionItem[]) {
    // Los items individuales no vienen en la proyección.
    // Necesitamos un endpoint GET /:id/items. Lo agregamos al service.
    if (!this.simulacion) return;
    this.simulacionService.listarItems(this.simulacion.id).subscribe({
      next: (items) => { this.items = items; this.cargando = false; },
      error: () => { this.cargando = false; },
    });
  }
}
