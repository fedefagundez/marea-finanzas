import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../services/categoria.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { Categoria } from '../../models';

const ICONOS_DISPONIBLES = [
  '📂', '💡', '📚', '🛒', '🏥', '🚗', '🎬', '🍕', '🏠', '💻',
  '📱', '✈️', '🎮', '👕', '💊', '🐾', '🎵', '📦', '🔧', '💼',
  '🎓', '🍽️', '☕', '🍺', '🎂', '🥩', '🥗', '🧃', '🚌', '⛽',
  '🚇', '🚲', '🛵', '🏡', '🔑', '🛋️', '🛏️', '🧹', '🔌', '💧',
  '🔥', '❄️', '📺', '🔔', '📞', '📶', '💳', '💰', '🏦', '📊',
  '📈',   '🎯', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾',
  '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🥋', '⛳', '🏄', '🚴',
  '🤸', '🤼', '🏋️', '🤺', '⛸️', '🎿', '🛹', '🥅', '🎽', '🏃',
  '🎁', '🎊', '🎉', '🌟', '💎', '👶',
  '👤', '👥', '❤️', '💪', '🧠', '👀', '🦷', '✂️', '💄', '🛁',
  '🐕', '🐈', '🐟', '🌱', '🌻', '🌿', '♻️', '🔋', '🪫', '📝',
  '📋', '📌', '📍', '🧾', '📃', '🗂️', '🕐', '📅', '📆', '🔐',
  '🔒', '🔓', '🛡️', '⚙️', '🖨️', '🖥️', '⌨️', '🖱️', '🎧', '📷',
];

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="demo-topbar">
      <div>
        <div class="eyebrow">Configuración</div>
        <div class="sec-title">Categorías de gastos</div>
      </div>
    </div>

    <form *ngIf="hogarId" (ngSubmit)="guardar()" class="card" style="margin-bottom:20px;">
      <div class="card-title">{{ editando ? 'Editar categoría' : 'Nueva categoría' }}</div>
      <div class="fields-grid" style="margin-top:12px;">
        <div class="field">
          <label>Nombre</label>
          <input type="text" [(ngModel)]="form.nombre" name="nombre" placeholder="Ej. Supermercado" required maxlength="50" />
        </div>
        <div class="field">
          <label>Icono</label>
          <div class="icon-dropdown">
            <button type="button" class="icon-trigger" (click)="iconOpen = !iconOpen" (blur)="cerrarIcono()">
              <span>{{ form.icon }}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div class="icon-panel" *ngIf="iconOpen" (mousedown)="$event.preventDefault()">
              <button *ngFor="let icon of iconos" type="button" class="icon-opt" [class.selected]="form.icon === icon" (click)="seleccionarIcono(icon)">{{ icon }}</button>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-md">{{ editando ? 'Actualizar' : 'Crear' }}</button>
          <button *ngIf="editando" type="button" class="btn btn-secondary btn-md" (click)="cancelar()">Cancelar</button>
        </div>
      </div>
    </form>

    <div *ngIf="!categorias.length && !editando" class="no-hogar">
      <h3>Sin categorías</h3>
      <p>Creá tu primera categoría personalizada.</p>
    </div>

    <div *ngIf="categorias.length" class="card" style="padding:4px;">
      <table class="tx">
        <thead><tr><th>Icono</th><th>Nombre</th><th>Tipo</th><th style="text-align:right;">Acciones</th></tr></thead>
        <tbody><tr *ngFor="let c of categorias">
          <td data-label="Icono"><span class="cat-icon" style="background:var(--n-100); color:var(--n-600); font-size:18px;">{{ c.icon }}</span></td>
          <td data-label="Nombre"><strong>{{ c.nombre }}</strong></td>
          <td data-label="Tipo">
            <span class="badge" [class.badge-neutral]="!c.usuarioId" [class.badge-success]="!!c.usuarioId">
              {{ c.usuarioId ? 'Personal' : 'Global' }}
            </span>
          </td>
          <td data-label="Acciones" style="text-align:right;">
            <button *ngIf="c.usuarioId" type="button" class="btn btn-ghost btn-sm" (click)="editar(c)">Editar</button>
            <button *ngIf="c.usuarioId" type="button" class="btn btn-danger btn-sm" (click)="eliminar(c.id)">Eliminar</button>
          </td>
        </tr></tbody>
      </table>
    </div>
  `,
  styles: [`
    .icon-dropdown { position: relative; }
    .icon-trigger {
      display: flex; align-items: center; gap: 8px; width: 100%;
      padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-md);
      background: var(--surface); cursor: pointer; font-size: 20px;
      font-family: var(--font-body);
    }
    .icon-trigger svg { margin-left: auto; color: var(--text-3); }
    .icon-panel {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-md); box-shadow: var(--shadow-md);
      display: flex; flex-wrap: wrap; gap: 4px; padding: 8px;
      z-index: 10; max-height: 220px; overflow-y: auto;
    }
    .icon-opt {
      width: 36px; height: 36px; border-radius: 8px; border: none;
      background: transparent; cursor: pointer; font-size: 18px;
      display: flex; align-items: center; justify-content: center;
    }
    .icon-opt:hover { background: var(--n-100); }
    .icon-opt.selected { background: var(--primary-50); outline: 2px solid var(--primary-500); }
  `]
})
export class CategoriasComponent implements OnInit {
  private categoriaService = inject(CategoriaService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);

  categorias: Categoria[] = [];
  hogarId = '';
  editando = false;
  editId = '';

  form: { nombre: string; icon: string } = { nombre: '', icon: '📂' };
  iconos = ICONOS_DISPONIBLES;
  iconOpen = false;
  iconTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.hogarId = localStorage.getItem('hogarId') || '';
    if (this.hogarId) this.cargar();
  }

  cargar() {
    if (!this.hogarId) return;
    this.categoriaService.listar(this.hogarId).subscribe(c => this.categorias = c);
  }

  guardar() {
    const nombre = this.form.nombre.trim();
    if (!nombre) { this.toast.show('El nombre es obligatorio', 'error'); return; }
    if (!this.form.icon) { this.toast.show('Seleccioná un icono', 'error'); return; }

    if (this.editando) {
      this.categoriaService.actualizar(this.editId, this.form).subscribe({
        next: () => { this.cancelar(); this.cargar(); this.toast.show('Categoría actualizada', 'success'); },
        error: (err) => this.toast.showApiError(err, 'Error al actualizar'),
      });
    } else {
      this.categoriaService.crear({ ...this.form, hogarId: this.hogarId }).subscribe({
        next: () => { this.form = { nombre: '', icon: '📂' }; this.cargar(); this.toast.show('Categoría creada', 'success'); },
        error: (err) => this.toast.showApiError(err, 'Error al crear'),
      });
    }
  }

  editar(c: Categoria) {
    this.editando = true;
    this.editId = c.id;
    this.form = { nombre: c.nombre, icon: c.icon };
  }

  cancelar() {
    this.editando = false;
    this.editId = '';
    this.form = { nombre: '', icon: '📂' };
  }

  seleccionarIcono(icon: string) {
    this.form.icon = icon;
    this.iconOpen = false;
  }

  cerrarIcono() {
    this.iconTimeout = setTimeout(() => this.iconOpen = false, 150);
  }

  async eliminar(id: string) {
    const ok = await this.confirmService.confirm('¿Eliminar esta categoría?');
    if (ok) {
      this.categoriaService.eliminar(id).subscribe({
        next: () => { this.cargar(); this.toast.show('Categoría eliminada', 'success'); },
        error: (err) => this.toast.showApiError(err, 'Error al eliminar'),
      });
    }
  }
}
