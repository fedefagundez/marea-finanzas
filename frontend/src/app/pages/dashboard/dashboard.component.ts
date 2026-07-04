import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReporteService } from '../../services/reporte.service';
import { AuthService } from '../../services/auth.service';
import { SelectComponent } from '../../components/select/select.component';
import { EvolutionChartComponent } from '../../components/evolution-chart/evolution-chart.component';
import { ArsCurrencyPipe } from '../../core/pipes/ars-currency.pipe';
import { BalanceMes, Dashboard, EvolucionItem, MovimientoReciente, DistribucionGasto } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SelectComponent, EvolutionChartComponent, ArsCurrencyPipe],
  template: `
    <div class="demo-topbar">
      <div>
        <div style="font-family:var(--font-display); font-weight:700; font-size:19px;">Resumen del hogar</div>
        <div style="font-size:12.5px; color:var(--text-3);">{{ today }}</div>
      </div>
      
    </div>

    <div class="stat-row">
      <div class="balance-card card">
        <svg class="wave-bg" viewBox="0 0 400 50" preserveAspectRatio="none" width="100%" height="50"><path d="M0 25 C 50 8,100 42,150 25 S 250 8,300 25 S 380 38,400 25 V50 H0 Z" fill="rgba(255,255,255,0.18)"/></svg>
        <div class="card-title">Balance disponible</div>
        <div class="balance-amount tabular" style="font-size:30px;">{{ (dashboard?.balance || 0) | arsCurrency }}</div>
      </div>
      <div class="mini-stat" style="cursor:pointer;" (click)="navegarA('/ingresos')" title="Ver ingresos">
        <div class="lbl">Ingresos del mes</div>
        <div class="val tabular">{{ dashboard?.totalIngresos | arsCurrency }}</div>
        <div class="trend" [class.up]="getVariacionIngresos()?.positivo !== false" [class.down]="getVariacionIngresos()?.positivo === false" *ngIf="getVariacionIngresos() as v">
          {{ v.positivo ? '↑' : '↓' }} {{ v.valor }}% vs. anterior
        </div>
        <div class="trend" style="color:var(--text-3);" *ngIf="!getVariacionIngresos()">Sin datos del mes anterior</div>
      </div>
      <div class="mini-stat" style="cursor:pointer;" (click)="navegarA('/gastos')" title="Ver gastos">
        <div class="lbl">Gastos del mes</div>
        <div class="val tabular">{{ dashboard?.totalGastos | arsCurrency }}</div>
        <div class="trend" [class.up]="getVariacionGastos()?.positivo === false" [class.down]="getVariacionGastos()?.positivo !== false" *ngIf="getVariacionGastos() as v">
          {{ v.positivo ? '↑' : '↓' }} {{ v.valor }}% vs. anterior
        </div>
        <div class="trend" style="color:var(--text-3);" *ngIf="!getVariacionGastos()">Sin datos del mes anterior</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Distribución de gastos</div>
        <div *ngIf="!distribucion.length" style="margin-top:10px; font-size:13px; color:var(--text-3);">
          No hay gastos este mes
        </div>
        <div *ngIf="distribucion.length" style="display:flex; align-items:center; gap:16px; margin-top:6px;">
          <div style="width:64px; height:64px; border-radius:50%; background:{{ donutGradient }}; flex-shrink:0;"></div>
          <div class="donut-legend" style="margin-top:0;">
            <div class="legend-row" *ngFor="let d of distribucion; let i = index">
              <span class="legend-dot" [style.background]="donutColors[i % donutColors.length]"></span>
              {{ d.icon }} {{ d.nombre }}<span>{{ d.porcentaje }}%</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title" style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
          <span>Balance por mes</span>
          <div style="display:flex; gap:8px;">
            <app-select style="width:110px;" [options]="meses" [selectedId]="mesSeleccionado" placeholder="Mes" (selectedChange)="mesSeleccionado = $event; cargarBalanceMes()"></app-select>
            <app-select style="width:90px;" [options]="opcionesAnio" [selectedId]="anioSeleccionado.toString()" placeholder="Año" (selectedChange)="anioSeleccionado = +$event; cargarBalanceMes()"></app-select>
          </div>
        </div>
        <div style="margin-top:14px;">
          <div *ngIf="balanceMes" style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span style="font-size:12px; color:var(--text-2); font-weight:600;">Tipo</span>
              <span class="badge" [class.badge-success]="balanceMes.tipo === 'REAL'" [class.badge-warning]="balanceMes.tipo === 'PROYECTADO'">{{ balanceMes.tipo === 'REAL' ? 'Real' : 'Proyectado' }}</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span style="font-size:12px; color:var(--text-2); font-weight:600;">Ingresos</span>
              <span class="amt-pos" style="font-family:var(--font-mono); font-weight:600;">{{ balanceMes.totalIngresos | arsCurrency }}</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span style="font-size:12px; color:var(--text-2); font-weight:600;">Gastos</span>
              <span class="amt-neg" style="font-family:var(--font-mono); font-weight:600;">{{ balanceMes.totalGastos | arsCurrency }}</span>
            </div>
            <div style="margin-top:4px; padding-top:10px; border-top:1px solid var(--border); display:flex; align-items:center; justify-content:space-between;">
              <span style="font-size:13px; font-weight:700;">Balance</span>
              <span class="tabular" style="font-family:var(--font-display); font-size:22px; font-weight:700;" [style.color]="balanceMes.balance >= 0 ? 'var(--success-600)' : 'var(--danger-600)'">{{ balanceMes.balance | arsCurrency }}</span>
            </div>
          </div>
          <div *ngIf="!balanceMes" style="text-align:center; padding:20px 0; color:var(--text-3); font-size:13px;">
            Seleccioná un mes para ver el balance
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin:20px 0;">
      <div class="card-title">Evolución mensual</div>
      <app-evolution-chart [data]="evolucionData" style="display:block; height:300px; margin-top:6px;"></app-evolution-chart>
    </div>

    <div class="subhead">Movimientos recientes</div>
    <div *ngIf="movimientos.length === 0" class="no-hogar">
      <h3>Sin movimientos recientes</h3>
      <p>Tus últimos ingresos y gastos aparecerán aquí.</p>
    </div>
    <div *ngIf="movimientos.length > 0" class="card" style="padding:6px 4px;">
      <table class="tx">
        <thead><tr><th>Movimiento</th><th>Tipo</th><th style="text-align:right;">Monto</th></tr></thead>
        <tbody><tr *ngFor="let m of movimientos">
          <td>
            <div class="tx-name">
              <span class="tx-icon" [style.background]="m.tipo === 'INGRESO' ? 'var(--success-100)' : 'var(--primary-50)'" [style.color]="m.tipo === 'INGRESO' ? 'var(--success-700)' : 'var(--primary-700)'">{{ m.tipo === 'INGRESO' ? '+' : '-' }}</span>
              {{ m.descripcion || '-' }}
            </div>
          </td>
          <td><span class="badge" [class.badge-success]="m.tipo === 'INGRESO'" [class.badge-danger]="m.tipo === 'GASTO'">{{ m.tipo === 'INGRESO' ? 'Ingreso' : 'Gasto' }}</span></td>
          <td style="text-align:right;" [class.amt-pos]="m.tipo === 'INGRESO'" [class.amt-neg]="m.tipo === 'GASTO'">{{ m.monto | arsCurrency }}</td>
        </tr></tbody>
      </table>
    </div>

    <div *ngIf="!hogarId" class="no-hogar">
      <h3>Bienvenido a Marea</h3>
      <p>Selecciona un hogar o crea/une uno nuevo para comenzar</p>
      <button type="button" class="btn btn-primary btn-md" routerLink="/hogares">Ir a hogares</button>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private reporteService = inject(ReporteService);
  private router = inject(Router);

  hogarId = '';
  dashboard: Dashboard | null = null;
  balanceMes: BalanceMes | null = null;
  balanceMesAnterior: BalanceMes | null = null;
  movimientos: MovimientoReciente[] = [];
  distribucion: DistribucionGasto[] = [];
  evolucionData: EvolucionItem[] = [];

  readonly donutColors = [
    'var(--primary-500)', 'var(--secondary-500)', 'var(--warning-500)',
    'var(--success-500)', 'var(--danger-500)', 'var(--n-300)',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  ];

  mesSeleccionado = String(new Date().getMonth() + 1).padStart(2, '0');
  anioSeleccionado = new Date().getFullYear();
  meses = [
    { id: '01', nombre: 'Enero' },
    { id: '02', nombre: 'Febrero' },
    { id: '03', nombre: 'Marzo' },
    { id: '04', nombre: 'Abril' },
    { id: '05', nombre: 'Mayo' },
    { id: '06', nombre: 'Junio' },
    { id: '07', nombre: 'Julio' },
    { id: '08', nombre: 'Agosto' },
    { id: '09', nombre: 'Septiembre' },
    { id: '10', nombre: 'Octubre' },
    { id: '11', nombre: 'Noviembre' },
    { id: '12', nombre: 'Diciembre' },
  ];
  anios: number[] = [];
  opcionesAnio: { id: string; nombre: string }[] = [];

  today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  ngOnInit() {
    this.hogarId = localStorage.getItem('hogarId') || '';
    const actual = new Date().getFullYear();
    this.anios = Array.from({ length: 7 }, (_, i) => actual - 3 + i);
    this.opcionesAnio = this.anios.map(a => ({ id: a.toString(), nombre: a.toString() }));
    if (this.hogarId) {
      this.cargarDashboard();
      this.cargarBalanceMes();
      this.cargarComparacionMesAnterior();
      this.cargarMovimientos();
      this.cargarDistribucion();
      this.cargarEvolucion();
    }
  }

  private getMesAnterior(): { anio: number; mes: string } {
    const fecha = new Date(this.anioSeleccionado, +this.mesSeleccionado - 1, 1);
    fecha.setMonth(fecha.getMonth() - 1);
    return {
      anio: fecha.getFullYear(),
      mes: String(fecha.getMonth() + 1).padStart(2, '0')
    };
  }

  cargarComparacionMesAnterior() {
    if (!this.hogarId) return;
    const { anio, mes } = this.getMesAnterior();
    this.reporteService.balanceMes(this.hogarId, `${anio}-${mes}`).subscribe({
      next: (b) => {
        this.balanceMesAnterior = b;
      },
      error: (err) => {
        console.error('Error loading balance mes anterior:', err);
      }
    });
  }

  getVariacionIngresos(): { valor: number; positivo: boolean } | null {
    if (!this.balanceMes || !this.balanceMesAnterior) return null;
    const anterior = this.balanceMesAnterior.totalIngresos;
    if (anterior === 0) return null;
    const valor = ((this.balanceMes.totalIngresos - anterior) / anterior) * 100;
    return { valor: Math.round(valor * 10) / 10, positivo: valor >= 0 };
  }

  getVariacionGastos(): { valor: number; positivo: boolean } | null {
    if (!this.balanceMes || !this.balanceMesAnterior) return null;
    const anterior = this.balanceMesAnterior.totalGastos;
    if (anterior === 0) return null;
    const valor = ((this.balanceMes.totalGastos - anterior) / anterior) * 100;
    return { valor: Math.round(valor * 10) / 10, positivo: valor >= 0 };
  }

  navegarA(ruta: string) {
    this.router.navigate([ruta]);
  }

  cargarDashboard() {
    if (!this.hogarId) return;
    this.reporteService.dashboard(this.hogarId).subscribe({
      next: (d) => {
        console.log('Dashboard data:', d);
        this.dashboard = d;
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
      }
    });
  }

  cargarBalanceMes() {
    if (!this.hogarId) return;
    const mes = `${this.anioSeleccionado}-${this.mesSeleccionado}`;
    this.reporteService.balanceMes(this.hogarId, mes).subscribe({
      next: (b) => {
        console.log('Balance mes:', b);
        this.balanceMes = b;
        this.cargarComparacionMesAnterior();
      },
      error: (err) => {
        console.error('Error loading balance mes:', err);
      }
    });
  }

  cargarMovimientos() {
    if (!this.hogarId) return;
    this.reporteService.movimientosRecientes(this.hogarId, 5).subscribe({
      next: (movimientos) => {
        this.movimientos = movimientos;
      },
      error: (err) => {
        console.error('Error loading movimientos recientes:', err);
      }
    });
  }

  cargarDistribucion() {
    if (!this.hogarId) return;
    this.reporteService.distribucionGastos(this.hogarId).subscribe({
      next: (d) => this.distribucion = d,
      error: (err) => console.error('Error loading distribucion:', err),
    });
  }

  cargarEvolucion() {
    if (!this.hogarId) return;
    this.reporteService.evolucionCompleta(this.hogarId, 6, 6).subscribe({
      next: (res) => this.evolucionData = res.data,
      error: (err) => console.error('Error loading evolucion completa:', err),
    });
  }

  get donutGradient(): string {
    if (!this.distribucion.length) return '';
    const parts = this.distribucion.map((d, i) => {
      const color = this.donutColors[i % this.donutColors.length];
      const prev = this.distribucion.slice(0, i).reduce((s, c) => s + c.porcentaje, 0);
      return `${color} ${prev}% ${prev + d.porcentaje}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }
}
