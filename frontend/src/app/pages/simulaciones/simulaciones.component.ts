import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SimulacionService } from '../../services/simulacion.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { Simulacion } from '../../models';

@Component({
  selector: 'app-simulaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="demo-topbar">
      <div>
        <div class="eyebrow">Herramientas</div>
        <div class="sec-title">Simulaciones</div>
      </div>
    </div>

    <div *ngIf="!hogarId" class="no-hogar">
      <h3>Seleccioná un hogar</h3>
      <p>Elegí o creá un hogar para comenzar a simular.</p>
      <button type="button" class="btn btn-primary btn-md" routerLink="/hogares">Ir a hogares</button>
    </div>

    <div *ngIf="hogarId">
      <form (ngSubmit)="crear()" class="card" style="margin-bottom:20px;">
        <div class="card-title">Nueva simulación</div>
        <div class="fields-grid" style="margin-top:12px;">
          <div class="field" style="flex:1; min-width:0;">
            <label>Nombre</label>
            <input type="text" [(ngModel)]="nuevoNombre" name="nombre"
                   placeholder="Ej. Vacaciones 2026" required maxlength="100" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-md" [disabled]="!nuevoNombre.trim()">+ Crear</button>
          </div>
        </div>
      </form>

      <div *ngIf="cargando" style="text-align:center; padding:40px 0; color:var(--text-3); font-size:13px;">
        Cargando...
      </div>

      <div *ngIf="!cargando && simulaciones.length === 0" class="card" style="text-align:center; padding:40px 20px;">
        <div style="font-size:40px; margin-bottom:8px;">📊</div>
        <div style="font-weight:600; margin-bottom:4px;">Sin simulaciones</div>
        <div style="font-size:13px; color:var(--text-3);">Creá tu primera simulación para ver proyecciones a futuro.</div>
      </div>

      <div *ngIf="!cargando && simulaciones.length > 0" style="display:flex; flex-direction:column; gap:12px;">
        <div *ngFor="let s of simulaciones" class="card" style="cursor:pointer; transition:box-shadow 0.15s;"
             (click)="abrir(s.id)" (mouseenter)="s._hover = true" (mouseleave)="s._hover = false"
             [style.box-shadow]="s._hover ? '0 4px 20px rgba(6,182,212,0.15)' : ''">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:40px; height:40px; border-radius:var(--radius-md); background:var(--primary-50); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">
                📈
              </div>
              <div>
                <div style="font-weight:600;">{{ s.nombre }}</div>
                <div style="font-size:12px; color:var(--text-3);">{{ s.cantidadItems }} items · {{ s.createdAt | date:'dd/MM/yyyy' }}</div>
              </div>
            </div>
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn btn-ghost btn-sm" (click)="editarNombre($event, s)" title="Renombrar">✏️</button>
              <button type="button" class="btn btn-ghost btn-sm" (click)="eliminar($event, s)" title="Eliminar" style="color:var(--danger-500);">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SimulacionesComponent implements OnInit {
  private simulacionService = inject(SimulacionService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private router = inject(Router);

  hogarId = '';
  simulaciones: (Simulacion & { _hover?: boolean })[] = [];
  nuevoNombre = '';
  cargando = true;

  ngOnInit() {
    this.hogarId = localStorage.getItem('hogarId') || '';
    if (this.hogarId) this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.simulacionService.listar(this.hogarId).subscribe({
      next: (s) => { this.simulaciones = s; this.cargando = false; },
      error: () => { this.cargando = false; },
    });
  }

  crear() {
    const nombre = this.nuevoNombre.trim();
    if (!nombre) return;
    this.simulacionService.crear(this.hogarId, nombre).subscribe({
      next: (s) => {
        this.toast.show('Simulación creada', 'success');
        this.nuevoNombre = '';
        this.router.navigate(['/simulaciones', s.id]);
      },
      error: () => this.toast.show('Error al crear', 'error'),
    });
  }

  abrir(id: string) {
    this.router.navigate(['/simulaciones', id]);
  }

  editarNombre(e: Event, s: Simulacion) {
    e.stopPropagation();
    const nombre = prompt('Nuevo nombre:', s.nombre);
    if (nombre && nombre.trim() && nombre.trim() !== s.nombre) {
      this.simulacionService.actualizar(s.id, nombre.trim()).subscribe({
        next: () => { s.nombre = nombre.trim(); this.toast.show('Nombre actualizado', 'success'); },
        error: () => this.toast.show('Error al actualizar', 'error'),
      });
    }
  }

  async eliminar(e: Event, s: Simulacion) {
    e.stopPropagation();
    const ok = await this.confirm.confirm('¿Eliminar esta simulación? Se borrarán todos sus items.');
    if (!ok) return;
    this.simulacionService.eliminar(s.id).subscribe({
      next: () => { this.simulaciones = this.simulaciones.filter(x => x.id !== s.id); this.toast.show('Simulación eliminada', 'success'); },
      error: () => this.toast.show('Error al eliminar', 'error'),
    });
  }
}
