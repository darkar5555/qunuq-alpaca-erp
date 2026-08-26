import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import {
  Gasto,
  GastoInput,
  MetodoPago,
  ReporteGastos,
  ResumenFinanciero,
  TipoGasto,
} from '../../core/models';
import { FinanzasService } from './finanzas.service';

const METODO_LABEL: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  YAPE: 'Yape',
  PLIN: 'Plin',
};

const MES_LABEL = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

@Component({
  selector: 'app-finanzas',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    ButtonModule,
    ChartModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css',
})
export class Finanzas implements OnInit {
  private api = inject(FinanzasService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  readonly vista = signal<'gastos' | 'resumen'>('gastos');

  // Gastos
  readonly reporte = signal<ReporteGastos | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly dialogVisible = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly descargandoPdf = signal(false);

  // Resumen financiero
  readonly resumen = signal<ResumenFinanciero | null>(null);
  readonly cargandoResumen = signal(false);

  readonly categorias = [
    'Materia prima',
    'Servicios',
    'Alquiler',
    'Transporte',
    'Mantenimiento',
    'Marketing',
    'Otros',
  ].map((c) => ({ label: c, value: c }));

  readonly tipos = [
    { label: 'Fijo (pasivo)', value: 'FIJO' },
    { label: 'Variable (activo)', value: 'VARIABLE' },
  ];

  readonly metodos = (Object.keys(METODO_LABEL) as MetodoPago[]).map((m) => ({
    label: METODO_LABEL[m],
    value: m,
  }));

  readonly filtros = this.fb.nonNullable.group({
    desde: [''],
    hasta: [''],
    tipo: ['' as '' | TipoGasto],
    categoria: [''],
  });

  readonly form = this.fb.nonNullable.group({
    monto: [0, [Validators.required, Validators.min(0.01)]],
    metodo: ['EFECTIVO' as MetodoPago, Validators.required],
    tipo: ['VARIABLE' as TipoGasto, Validators.required],
    categoria: ['Materia prima', Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(2)]],
    proveedor: [''],
    fecha: [''],
  });

  readonly tituloDialog = computed(() =>
    this.editandoId() ? 'Editar gasto' : 'Nuevo gasto',
  );

  // Datos del gráfico del resumen (ingresos vs egresos por mes).
  readonly chartResumen = computed(() => {
    const r = this.resumen();
    if (!r) return null;
    return {
      labels: r.meses.map((m) => this.mesLabel(m.mes)),
      datasets: [
        {
          label: 'Ingresos',
          data: r.meses.map((m) => Number(m.ingresos)),
          backgroundColor: '#7d9a6b',
          borderRadius: 6,
        },
        {
          label: 'Egresos',
          data: r.meses.map((m) => Number(m.egresos)),
          backgroundColor: '#b5674d',
          borderRadius: 6,
        },
      ],
    };
  });

  readonly opcionesChart = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } },
  };

  // Último mes del resumen (el mes actual) para las tarjetas.
  readonly mesActual = computed(() => {
    const r = this.resumen();
    return r?.meses[r.meses.length - 1] ?? null;
  });

  ngOnInit() {
    this.buscar();
  }

  metodoLabel(m: MetodoPago): string {
    return METODO_LABEL[m] ?? m;
  }

  mesLabel(mes: string): string {
    const [anio, num] = mes.split('-');
    return `${MES_LABEL[Number(num) - 1]} ${anio}`;
  }

  utilidadNum(v: string): number {
    return Number(v);
  }

  cambiarVista(v: 'gastos' | 'resumen') {
    this.vista.set(v);
    if (v === 'resumen' && !this.resumen()) this.cargarResumen();
  }

  // ── Gastos ──
  private filtrosActuales() {
    const f = this.filtros.getRawValue();
    return {
      desde: f.desde || undefined,
      hasta: f.hasta || undefined,
      tipo: f.tipo || undefined,
      categoria: f.categoria || undefined,
    };
  }

  buscar() {
    this.cargando.set(true);
    this.api.listar(this.filtrosActuales()).subscribe({
      next: (r) => {
        this.reporte.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.mostrarError('No se pudieron cargar los gastos');
      },
    });
  }

  abrirNuevo() {
    this.editandoId.set(null);
    this.form.reset({
      monto: 0,
      metodo: 'EFECTIVO',
      tipo: 'VARIABLE',
      categoria: 'Materia prima',
      descripcion: '',
      proveedor: '',
      fecha: '',
    });
    this.dialogVisible.set(true);
  }

  abrirEditar(g: Gasto) {
    this.editandoId.set(g.id);
    this.form.reset({
      monto: Number(g.monto),
      metodo: g.metodo,
      tipo: g.tipo,
      categoria: g.categoria,
      descripcion: g.descripcion,
      proveedor: g.proveedor ?? '',
      fecha: g.fecha.slice(0, 10),
    });
    this.dialogVisible.set(true);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const v = this.form.getRawValue();
    const dto: GastoInput = {
      monto: v.monto,
      metodo: v.metodo,
      tipo: v.tipo,
      categoria: v.categoria,
      descripcion: v.descripcion,
      proveedor: v.proveedor || undefined,
      fecha: v.fecha || undefined,
    };
    const id = this.editandoId();
    const peticion = id ? this.api.actualizar(id, dto) : this.api.crear(dto);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogVisible.set(false);
        this.msg.add({
          severity: 'success',
          summary: id ? 'Gasto actualizado' : 'Gasto registrado',
        });
        this.buscar();
        this.resumen.set(null); // fuerza recarga del resumen
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarError(this.textoError(err));
      },
    });
  }

  confirmarEliminar(g: Gasto) {
    this.confirm.confirm({
      header: 'Eliminar gasto',
      message: `¿Eliminar el gasto "${g.descripcion}" (S/ ${g.monto})?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.api.eliminar(g.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Gasto eliminado' });
            this.buscar();
            this.resumen.set(null);
          },
          error: (err) => this.mostrarError(this.textoError(err)),
        });
      },
    });
  }

  descargarPdf() {
    this.descargandoPdf.set(true);
    this.api.reportePdf(this.filtrosActuales()).subscribe({
      next: (blob) => {
        this.descargarBlob(blob, 'reporte-gastos.pdf');
        this.descargandoPdf.set(false);
      },
      error: () => {
        this.descargandoPdf.set(false);
        this.mostrarError('No se pudo generar el PDF');
      },
    });
  }

  descargarCsv() {
    const r = this.reporte();
    if (!r) return;
    const esc = (v: string) => `"${v.replaceAll('"', '""')}"`;
    const filas = [
      ['Fecha', 'Categoría', 'Descripción', 'Proveedor', 'Tipo', 'Método', 'Monto'].join(';'),
      ...r.gastos.map((g) =>
        [
          new Date(g.fecha).toLocaleDateString('es-PE'),
          esc(g.categoria),
          esc(g.descripcion),
          esc(g.proveedor ?? ''),
          g.tipo === 'FIJO' ? 'Fijo' : 'Variable',
          this.metodoLabel(g.metodo),
          g.monto,
        ].join(';'),
      ),
      '',
      `Total;;;;;;${r.total}`,
    ];
    const blob = new Blob(['﻿' + filas.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    this.descargarBlob(blob, 'reporte-gastos.csv');
  }

  // ── Resumen financiero ──
  cargarResumen() {
    this.cargandoResumen.set(true);
    this.api.resumen(6).subscribe({
      next: (r) => {
        this.resumen.set(r);
        this.cargandoResumen.set(false);
      },
      error: (err) => {
        this.cargandoResumen.set(false);
        this.mostrarError(this.textoError(err));
      },
    });
  }

  private descargarBlob(blob: Blob, nombre: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }

  private mostrarError(detail: string) {
    this.msg.add({ severity: 'error', summary: 'Error', detail });
  }

  private textoError(err: unknown): string {
    const m = (err as { error?: { message?: string | string[] } })?.error
      ?.message;
    if (Array.isArray(m)) return m.join(', ');
    return m ?? 'Ocurrió un error inesperado';
  }
}
