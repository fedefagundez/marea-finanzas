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
        <div style="margin-bottom:8px;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18"/><path d="M7 16l4-5 4 3 5-7"/>
          </svg>
        </div>
        <div style="font-weight:600; margin-bottom:4px;">Sin simulaciones</div>
        <div style="font-size:13px; color:var(--text-3);">Creá tu primera simulación para ver proyecciones a futuro.</div>
      </div>

      <div *ngIf="!cargando && simulaciones.length > 0" style="display:flex; flex-direction:column; gap:12px;">
        <div *ngFor="let s of simulaciones" class="card" style="cursor:pointer; transition:box-shadow 0.15s;"
             (click)="abrir(s.id)" (mouseenter)="s._hover = true" (mouseleave)="s._hover = false"
             [style.box-shadow]="s._hover ? '0 4px 20px rgba(6,182,212,0.15)' : ''">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:40px; height:40px; border-radius:var(--radius-md); background:var(--primary-50); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-700)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3v18h18"/><path d="M7 16l4-5 4 3 5-7"/>
                </svg>
              </div>
              <div>
                <div style="font-weight:600;">{{ s.nombre }}</div>
                <div style="font-size:12px; color:var(--text-3);">{{ s.cantidadItems }} items · {{ s.createdAt | date:'dd/MM/yyyy' }}</div>
              </div>
            </div>
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn btn-ghost btn-sm" (click)="editarNombre($event, s)" title="Renombrar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
              <button type="button" class="btn btn-danger btn-sm" (click)="eliminar($event, s)" title="Eliminar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4.8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7"/><path d="M6 7l1 12.2a2 2 0 0 0 2 1.8h6a2 2 0 0 0 2-1.8L18 7"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>
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
