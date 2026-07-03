import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import annotationPlugin from 'chartjs-plugin-annotation';
import { EvolucionItem } from '../../models';

Chart.register(...registerables, annotationPlugin);

@Component({
  selector: 'app-evolution-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div style="position:relative; width:100%; height:300px;">
      <div *ngIf="!data.length" style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-3); font-size:13px;">
        Sin datos suficientes
      </div>
      <canvas baseChart
        *ngIf="data.length"
        [type]="'line'"
        [data]="chartData"
        [options]="chartOptions"
        style="display:block; width:100%; height:100%;">
      </canvas>
    </div>
  `
})
export class EvolutionChartComponent implements OnChanges {
  @Input() data: EvolucionItem[] = [];

  chartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration<'line'>['options'] = {};

  private indiceLimite = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) this.buildChart();
  }

  private buildChart() {
    if (!this.data.length) return;

    this.indiceLimite = this.data.findIndex(d => d.tipo === 'PROYECTADO');
    if (this.indiceLimite === -1) this.indiceLimite = this.data.length;

    const labels = this.data.map(d => d.label);

    const crearDataset = (
      label: string,
      data: number[],
      color: string,
      bgColor: string,
    ): ChartConfiguration<'line'>['data']['datasets'][number] => ({
      label,
      data,
      borderColor: color,
      backgroundColor: bgColor,
      fill: false,
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: color,
      borderWidth: 2,
      segment: {
        borderDash: (ctx) => {
          const idx = ctx.p0DataIndex;
          if (idx === null || idx === undefined) return undefined;
          return idx >= this.indiceLimite ? [6, 3] : undefined;
        },
      },
    });

    this.chartData = {
      labels,
      datasets: [
        crearDataset('Ingresos', this.data.map(d => d.ingresos), '#22c55e', 'rgba(34,197,94,0.1)'),
        crearDataset('Gastos', this.data.map(d => d.gastos), '#ef4444', 'rgba(239,68,68,0.1)'),
        crearDataset('Balance', this.data.map(d => d.balance), '#3b82f6', 'rgba(59,130,246,0.1)'),
      ],
    };

    const fmt = (v: number) =>
      '$ ' + Math.round(v).toLocaleString('es-AR');

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      font: { family: 'system-ui, sans-serif' },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 14,
            padding: 16,
            font: { size: 11 },
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 10,
          titleFont: { size: 12 },
          bodyFont: { size: 13 },
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.y;
              if (val == null) return '';
              return ` ${ctx.dataset.label}: ${fmt(val)}`;
            },
          },
        },
        annotation: {
          annotations: {
            divider: {
              type: 'line',
              scaleID: 'x',
              value: labels[this.indiceLimite - 1] || '',
              borderColor: '#94a3b8',
              borderWidth: 1.5,
              borderDash: [6, 3],
              label: {
                display: true,
                content: ['Real', 'Proyectado'],
                position: 'start',
                font: { size: 9, family: 'system-ui, sans-serif' },
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                padding: 4,
                xAdjust: -10,
                yAdjust: -8,
              },
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 7,
            font: { size: 10 },
            color: '#64748b',
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: {
            font: { size: 10 },
            color: '#64748b',
            callback: (val) => fmt(val as number),
          },
        },
      },
    };
  }
}
