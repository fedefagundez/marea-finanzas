import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { GastoService } from '../../services/gasto.service';
import { MetaService } from '../../services/meta.service';
import { ConfirmService } from '../../services/confirm.service';
import { CategoriaService } from '../../services/categoria.service';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';
import { hoyInputDate, validarNombre, validarMontoPositivo } from '../../core/utils/form-utils';
import { Meta, Categoria } from '../../models';

@Component({
  selector: 'app-metas',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerComponent],
  template: `
    <div class="demo-topbar">
      <div>
        <div class="eyebrow">Ahorro</div>
        <div class="sec-title">Metas</div>
      </div>
    </div>

    <div *ngIf="!hogarId" class="no-hogar" style="margin-bottom:24px;">
      <h3>Seleccioná un hogar</h3>
      <p>Para ver y crear metas primero tenés que seleccionar un hogar.</p>
    </div>

    <div *ngIf="hogarId" class="card meta-form">
      <div class="card-title">Crear nueva meta</div>
      <form (ngSubmit)="crearMeta()">
        <div class="field">
          <label>Nombre</label>
          <input type="text" [(ngModel)]="nueva.nombre" name="nombre" placeholder="Ej. Vacaciones" required maxlength="100" />
        </div>
        <div class="field" style="margin-top:12px;">
          <label>Monto objetivo</label>
          <input type="number" [(ngModel)]="nueva.montoObjetivo" name="montoObjetivo" placeholder="0" required min="1" step="100" />
        </div>
        <div class="field" style="margin-top:12px;">
          <label>Fecha límite</label>
          <app-date-picker [(ngModel)]="nueva.fechaLimite" name="fechaLimite" [required]="true" placeholder="dd/mm/yyyy"></app-date-picker>
        </div>
        <div class="field" style="margin-top:12px;">
          <label>Cuota mensual <span style="font-weight:400;color:var(--text-3);">(opcional)</span></label>
          <input type="number" [(ngModel)]="nueva.cuotaMensual" name="cuotaMensual" placeholder="0" min="0" step="100" />
          <span class="help">Si la cargás, se creará un gasto recurrente mensual.</span>
        </div>
        <button type="submit" class="btn btn-primary btn-md" style="margin-top:16px;">Crear meta</button>
      </form>
    </div>

    <div class="subhead">Mis metas</div>
    <div *ngIf="metas.length === 0" class="no-hogar">
      <h3>No tenés metas</h3>
      <p>Creá una meta para empezar a ahorrar</p>
    </div>

    <div class="metas-grid">
      <div *ngFor="let m of metas" class="card meta-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div>
            <div class="card-title" style="font-size:14px; color:var(--text-1); margin-bottom:2px;">{{ m.nombre }}</div>
            <div style="font-size:12px; color:var(--text-3);">Hasta {{ m.fechaLimite | date:'dd/MM/yyyy' }}</div>
          </div>
          <button type="button" class="btn btn-danger btn-sm" (click)="eliminarMeta(m.id)">Eliminar</button>
        </div>
        <div style="display:flex; align-items:center; gap:16px;">
          <div class="ring" style="width:64px; height:64px;" [style.background]="getRingBg(m)">
            <div style="width:48px; height:48px; border-radius:50%; background:var(--surface); display:flex; align-items:center; justify-content:center;">
              <span style="font-size:13px;">{{ getPorcentaje(m) }}%</span>
            </div>
          </div>
          <div>
            <div style="font-family:var(--font-display); font-weight:700; font-size:16px;">
              {{ m.montoActual | currency:'ARS':'symbol':'1.0-0':'es-AR' }}
              <span style="color:var(--text-3); font-weight:500; font-size:12px;"> / {{ m.montoObjetivo | currency:'ARS':'symbol':'1.0-0':'es-AR' }}</span>
            </div>
            <div style="font-size:11.5px; color:var(--text-3); margin-top:2px;">{{ getDiasRestantes(m) }} días restantes</div>
          </div>
        </div>
        <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border);">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <span style="font-size:12px; font-weight:600; color:var(--text-2);">Cuota mensual</span>
            <span *ngIf="m.cuotaMensual" class="badge badge-warning">Gasto recurrente</span>
            <span *ngIf="!m.cuotaMensual" style="font-size:11px; color:var(--text-3);">Sin cuota</span>
          </div>
          <div style="display:flex; gap:8px;">
            <input type="number" [(ngModel)]="m.cuotaMensual" name="cuotaMensual{{m.id}}" placeholder="0" step="100" style="flex:1; font-family:var(--font-body); font-size:14px; color:var(--text-1); background:var(--surface); border:1.5px solid var(--border-strong); border-radius:var(--radius-sm); padding:10px 12px; outline:none;" />
            <button type="button" class="btn btn-secondary btn-sm" (click)="actualizarCuota(m)">Guardar</button>
          </div>
          <div *ngIf="m.cuotaMensual" style="font-size:11px; color:var(--text-3); margin-top:6px;">
            Esta cuota figura como un gasto recurrente mensual.
          </div>
        </div>

        <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border);">
          <div class="field" style="width:100%;">
            <label>Agregar ahorro puntual</label>
            <input type="number" [(ngModel)]="montoAhorro[m.id]" placeholder="0" step="100" />
          </div>
          <button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px;" (click)="agregarAhorro(m)">Agregar</button>
        </div>
      </div>
    </div>
  `
})
export class MetasComponent implements OnInit {
  private toast = inject(ToastService);
  private gastoService = inject(GastoService);
  private metaService = inject(MetaService);
  private confirmService = inject(ConfirmService);
  private categoriaService = inject(CategoriaService);

  hogarId = '';
  metas: Meta[] = [];
  montoAhorro: { [key: string]: number } = {};
  private categoriaMetaId: string | null = null;

  nueva: { nombre: string; montoObjetivo: number; fechaLimite: string; cuotaMensual: number } = {
    nombre: '', montoObjetivo: 0, fechaLimite: '', cuotaMensual: 0
  };

  ngOnInit() {
    this.hogarId = localStorage.getItem('hogarId') || '';
    if (this.hogarId) {
      this.cargarMetas();
      this.cargarCategoriaMeta();
    }
  }

  private cargarMetas() {
    this.metaService.listar(this.hogarId).subscribe(m => this.metas = m);
  }

  private cargarCategoriaMeta() {
    if (!this.hogarId) return;
    this.categoriaService.listar(this.hogarId).subscribe(cats => {
      const meta = cats.find(c => c.nombre === 'Metas');
      this.categoriaMetaId = meta?.id ?? null;
    });
  }

  private crearGastoMeta(m: Meta): Promise<string | undefined> {
    const cuota = m.cuotaMensual;
    if (!this.hogarId || !cuota) return Promise.resolve(undefined);
    return new Promise((resolve) => {
      this.gastoService.crear({
        hogarId: this.hogarId,
        descripcion: `Ahorro meta: ${m.nombre}`,
        monto: cuota,
        tipo: 'RECURRENTE',
        fechaInicio: hoyInputDate(),
        categoriaId: this.categoriaMetaId ?? undefined,
      }).subscribe({
        next: (g) => resolve(g.id),
        error: () => resolve(undefined)
      });
    });
  }

  private actualizarGastoMeta(m: Meta) {
    if (!m.gastoId || !m.cuotaMensual) return;
    this.gastoService.actualizar(m.gastoId, {
      descripcion: `Ahorro meta: ${m.nombre}`,
      monto: m.cuotaMensual,
      tipo: 'RECURRENTE',
    }).subscribe();
  }

  private eliminarGastoMeta(m: Meta) {
    if (!m.gastoId) return;
    this.gastoService.eliminar(m.gastoId).subscribe();
  }

  async crearMeta() {
    const nombreValido = validarNombre(this.nueva.nombre);
    if (!nombreValido.ok) { this.toast.show(nombreValido.mensaje!, 'error'); return; }

    const montoValido = validarMontoPositivo(this.nueva.montoObjetivo);
    if (!montoValido.ok) { this.toast.show(montoValido.mensaje!, 'error'); return; }

    if (!this.nueva.fechaLimite) {
      this.toast.show('La fecha límite es obligatoria', 'error');
      return;
    }
    if (!this.hogarId) {
      this.toast.show('Seleccioná un hogar primero', 'error');
      return;
    }
    if (this.nueva.fechaLimite < hoyInputDate()) {
      this.toast.show('La fecha límite no puede ser anterior a hoy', 'error');
      return;
    }

    const cuota = this.nueva.cuotaMensual > 0 ? this.nueva.cuotaMensual : undefined;

    this.metaService.crear({
      hogarId: this.hogarId,
      nombre: this.nueva.nombre.trim(),
      montoObjetivo: this.nueva.montoObjetivo,
      fechaLimite: this.nueva.fechaLimite,
      cuotaMensual: cuota,
    }).subscribe({
      next: async (meta) => {
        let gastoId: string | undefined;
        if (cuota) {
          gastoId = await this.crearGastoMeta(meta);
          if (gastoId) {
            this.metaService.actualizar(meta.id, { gastoId }).subscribe(m => {
              this.metas = [m, ...this.metas.filter(x => x.id !== m.id)];
            });
          }
        }
        if (!gastoId) this.metas = [meta, ...this.metas];
        this.nueva = { nombre: '', montoObjetivo: 0, fechaLimite: '', cuotaMensual: 0 };
        this.toast.show('Meta creada', 'success');
      },
      error: () => this.toast.show('Error al crear meta', 'error'),
    });
  }

  async eliminarMeta(id: string) {
    const ok = await this.confirmService.confirm('¿Eliminar esta meta? También se eliminará el gasto recurrente asociado si lo tiene.');
    if (!ok) return;

    const meta = this.metas.find(m => m.id === id);
    if (meta?.gastoId) this.eliminarGastoMeta(meta);

    this.metaService.eliminar(id).subscribe({
      next: () => {
        this.metas = this.metas.filter(m => m.id !== id);
        this.toast.show('Meta eliminada', 'success');
      },
      error: () => this.toast.show('Error al eliminar meta', 'error'),
    });
  }

  actualizarCuota(m: Meta) {
    if (!m.cuotaMensual || m.cuotaMensual <= 0) {
      if (m.gastoId) this.eliminarGastoMeta(m);
      this.metaService.actualizar(m.id, { cuotaMensual: null, gastoId: null }).subscribe(m2 => {
        this.metas = this.metas.map(x => x.id === m2.id ? m2 : x);
        this.toast.show('Cuota mensual eliminada', 'success');
      });
      return;
    }

    const update = () => {
      this.metaService.actualizar(m.id, { cuotaMensual: m.cuotaMensual!, gastoId: m.gastoId }).subscribe(m2 => {
        this.metas = this.metas.map(x => x.id === m2.id ? m2 : x);
        this.toast.show('Cuota mensual actualizada', 'success');
      });
    };

    if (m.gastoId) {
      this.actualizarGastoMeta(m);
      update();
    } else {
      this.crearGastoMeta(m).then(gastoId => {
        if (gastoId) m.gastoId = gastoId;
        update();
      });
    }
  }

  agregarAhorro(m: Meta) {
    const monto = this.montoAhorro[m.id] || 0;
    if (monto <= 0) return;

    const nuevoActual = Math.min(m.montoActual + monto, m.montoObjetivo);
    this.metaService.actualizar(m.id, { montoActual: nuevoActual }).subscribe(m2 => {
      this.metas = this.metas.map(x => x.id === m2.id ? m2 : x);
      this.montoAhorro[m.id] = 0;

      this.gastoService.crear({
        hogarId: this.hogarId,
        descripcion: `Ahorro: ${m.nombre}`,
        monto,
        tipo: 'PUNTUAL',
        fechaInicio: hoyInputDate(),
        categoriaId: this.categoriaMetaId ?? undefined,
      }).subscribe();

      this.toast.show('Ahorro registrado', 'success');
    });
  }

  getPorcentaje(m: Meta): number {
    return Math.round((m.montoActual / m.montoObjetivo) * 100);
  }

  getRingBg(m: Meta): string {
    const pct = this.getPorcentaje(m);
    return `conic-gradient(var(--primary-500) 0% ${pct}%, var(--n-200) ${pct}% 100%)`;
  }

  getDiasRestantes(m: Meta): number {
    const hoy = new Date();
    const limite = new Date(m.fechaLimite);
    const diff = Math.ceil((limite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }
}
