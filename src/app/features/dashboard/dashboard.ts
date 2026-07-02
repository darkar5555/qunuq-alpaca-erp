import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DashboardResumen, EstadoPedido, VentaMes } from '../../core/models';
import { DashboardService } from './dashboard.service';

type Severidad = 'secondary' | 'info' | 'warn' | 'success';

const MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe, ChartModule, TableModule, TagModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private api = inject(DashboardService);

  readonly resumen = signal<DashboardResumen | null>(null);
  readonly ventas = signal<VentaMes[]>([]);
  readonly cargando = signal(true);

  // Gráfico de barras: ventas por mes.
  readonly chartVentas = computed(() => ({
    labels: this.ventas().map((v) => this.etiquetaMes(v.mes)),
    datasets: [
      {
        label: 'Ventas (S/)',
        data: this.ventas().map((v) => Number(v.monto)),
        backgroundColor: '#b5674d',
        borderRadius: 6,
      },
    ],
  }));

  // Gráfico de dona: pedidos por estado.
  readonly chartEstados = computed(() => {
    const pe = this.resumen()?.pedidosPorEstado;
    return {
      labels: ['Cotización', 'Muestra', 'Producción', 'Entregado'],
      datasets: [
        {
          data: [
            pe?.COTIZACION ?? 0,
            pe?.MUESTRA ?? 0,
            pe?.PRODUCCION ?? 0,
            pe?.ENTREGADO ?? 0,
          ],
          backgroundColor: ['#9ca3af', '#3b82f6', '#d97706', '#22c55e'],
        },
      ],
    };
  });

  readonly opcionesBarra = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  readonly opcionesDona = {
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  ngOnInit() {
    this.api.resumen().subscribe({
      next: (r) => {
        this.resumen.set(r);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
    this.api.ventasPorMes(6).subscribe((v) => this.ventas.set(v));
  }

  etiquetaEstado(estado: EstadoPedido): string {
    return {
      COTIZACION: 'Cotización',
      MUESTRA: 'Muestra',
      PRODUCCION: 'Producción',
      ENTREGADO: 'Entregado',
    }[estado];
  }

  severidadEstado(estado: EstadoPedido): Severidad {
    return {
      COTIZACION: 'secondary',
      MUESTRA: 'info',
      PRODUCCION: 'warn',
      ENTREGADO: 'success',
    }[estado] as Severidad;
  }

  private etiquetaMes(clave: string): string {
    const [anio, mes] = clave.split('-');
    return `${MESES[Number(mes) - 1]} ${anio.slice(2)}`;
  }
}
