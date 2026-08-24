import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/auth.service';
import {
  MetodoPago,
  PagoPersonal,
  ReportePagosPersonal,
  Trabajador,
  TrabajadorInput,
} from '../../core/models';
import { PedidosService } from '../pedidos/pedidos.service';
import { PersonalService } from './personal.service';

const METODO_LABEL: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  YAPE: 'Yape',
  PLIN: 'Plin',
};

@Component({
  selector: 'app-personal',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './personal.html',
  styleUrl: './personal.css',
})
export class Personal implements OnInit {
  private api = inject(PersonalService);
  private pedidosApi = inject(PedidosService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private auth = inject(AuthService);

  // Vista activa: lista de trabajadores o reporte de pagos.
  readonly vista = signal<'trabajadores' | 'reporte'>('trabajadores');

  readonly trabajadores = signal<Trabajador[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);

  // Diálogos
  readonly dialogVisible = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly pagoVisible = signal(false);
  readonly pagoTrabajador = signal<Trabajador | null>(null);
  readonly registrandoPago = signal(false);
  readonly histVisible = signal(false);
  readonly histTrabajador = signal<Trabajador | null>(null);

  // Reporte
  readonly reporte = signal<ReportePagosPersonal | null>(null);
  readonly cargandoReporte = signal(false);
  readonly descargandoPdf = signal(false);

  readonly puedeAnular = this.auth.tieneRol('ADMIN');
  readonly puedeDesactivar = this.auth.tieneRol('ADMIN');

  readonly metodos = (Object.keys(METODO_LABEL) as MetodoPago[]).map((m) => ({
    label: METODO_LABEL[m],
    value: m,
  }));

  readonly pedidoOpciones = signal<{ label: string; value: string }[]>([]);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    oficio: ['', [Validators.required, Validators.minLength(2)]],
    numeroDocumento: [''],
    telefono: [''],
    fechaIngreso: [''],
    notas: [''],
  });

  readonly pagoForm = this.fb.nonNullable.group({
    monto: [0, [Validators.required, Validators.min(0.01)]],
    metodo: ['EFECTIVO' as MetodoPago, Validators.required],
    concepto: ['', [Validators.required, Validators.minLength(2)]],
    fecha: [''],
    pedidoId: [''],
  });

  readonly filtros = this.fb.nonNullable.group({
    desde: [''],
    hasta: [''],
    trabajadorId: [''],
  });

  readonly trabajadorOpciones = computed(() => [
    { label: 'Todos', value: '' },
    ...this.trabajadores().map((t) => ({ label: t.nombre, value: t.id })),
  ]);

  readonly tituloDialog = computed(() =>
    this.editandoId() ? 'Editar trabajador' : 'Nuevo trabajador',
  );

  // Resumen "por método" del reporte, listo para mostrar.
  readonly metodosResumen = computed(() => {
    const r = this.reporte();
    if (!r) return [];
    return Object.entries(r.porMetodo).map(([m, v]) => ({
      label: METODO_LABEL[m as MetodoPago] ?? m,
      monto: v as string,
    }));
  });

  ngOnInit() {
    this.cargar();
    this.pedidosApi.listar().subscribe((pedidos) =>
      this.pedidoOpciones.set([
        { label: 'Sin pedido', value: '' },
        ...pedidos.map((p) => ({
          label: `${p.codigo} · ${p.cliente.nombreORazonSocial}`,
          value: p.id,
        })),
      ]),
    );
  }

  metodoLabel(m: MetodoPago): string {
    return METODO_LABEL[m] ?? m;
  }

  cambiarVista(v: 'trabajadores' | 'reporte') {
    this.vista.set(v);
    if (v === 'reporte' && !this.reporte()) this.buscarReporte();
  }

  cargar() {
    this.cargando.set(true);
    this.api.listar().subscribe({
      next: (data) => {
        this.trabajadores.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.mostrarError('No se pudo cargar el personal');
      },
    });
  }

  // ── Crear / editar trabajador ──
  abrirNuevo() {
    this.editandoId.set(null);
    this.form.reset({
      nombre: '',
      oficio: '',
      numeroDocumento: '',
      telefono: '',
      fechaIngreso: '',
      notas: '',
    });
    this.dialogVisible.set(true);
  }

  abrirEditar(t: Trabajador) {
    this.editandoId.set(t.id);
    this.form.reset({
      nombre: t.nombre,
      oficio: t.oficio,
      numeroDocumento: t.numeroDocumento ?? '',
      telefono: t.telefono ?? '',
      fechaIngreso: t.fechaIngreso ? t.fechaIngreso.slice(0, 10) : '',
      notas: t.notas ?? '',
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
    const dto: TrabajadorInput = {
      nombre: v.nombre,
      oficio: v.oficio,
      numeroDocumento: v.numeroDocumento || undefined,
      telefono: v.telefono || undefined,
      fechaIngreso: v.fechaIngreso || undefined,
      notas: v.notas || undefined,
    };
    const id = this.editandoId();
    const peticion = id ? this.api.actualizar(id, dto) : this.api.crear(dto);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogVisible.set(false);
        this.msg.add({
          severity: 'success',
          summary: id ? 'Trabajador actualizado' : 'Trabajador registrado',
        });
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarError(this.textoError(err));
      },
    });
  }

  confirmarDesactivar(t: Trabajador) {
    this.confirm.confirm({
      header: 'Desactivar trabajador',
      message: `¿Desactivar a "${t.nombre}"? Su historial de pagos se conserva.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.api.desactivar(t.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Trabajador desactivado' });
            this.cargar();
          },
          error: (err) => this.mostrarError(this.textoError(err)),
        });
      },
    });
  }

  reactivar(t: Trabajador) {
    this.api.actualizar(t.id, { activo: true }).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Trabajador reactivado' });
        this.cargar();
      },
      error: (err) => this.mostrarError(this.textoError(err)),
    });
  }

  // ── Registrar pago ──
  abrirPago(t: Trabajador) {
    this.pagoTrabajador.set(t);
    this.pagoForm.reset({
      monto: 0,
      metodo: 'EFECTIVO',
      concepto: '',
      fecha: '',
      pedidoId: '',
    });
    this.pagoVisible.set(true);
  }

  registrarPago() {
    const t = this.pagoTrabajador();
    if (!t || this.pagoForm.invalid) {
      this.pagoForm.markAllAsTouched();
      return;
    }
    this.registrandoPago.set(true);
    const v = this.pagoForm.getRawValue();
    this.api
      .registrarPago(t.id, {
        monto: v.monto,
        metodo: v.metodo,
        concepto: v.concepto,
        fecha: v.fecha || undefined,
        pedidoId: v.pedidoId || undefined,
      })
      .subscribe({
        next: () => {
          this.registrandoPago.set(false);
          this.pagoVisible.set(false);
          this.msg.add({ severity: 'success', summary: 'Pago registrado' });
          this.cargar();
          this.reporte.set(null); // fuerza recarga del reporte al entrar
        },
        error: (err) => {
          this.registrandoPago.set(false);
          this.mostrarError(this.textoError(err));
        },
      });
  }

  // ── Historial ──
  verHistorial(t: Trabajador) {
    this.histTrabajador.set(t);
    this.histVisible.set(true);
    this.api.obtener(t.id).subscribe({
      next: (fresco) => this.histTrabajador.set(fresco),
      error: (err) => this.mostrarError(this.textoError(err)),
    });
  }

  confirmarAnularPago(p: PagoPersonal) {
    this.confirm.confirm({
      header: 'Anular pago',
      message: `¿Anular el pago de S/ ${p.monto} (${p.concepto})?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Anular',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.api.anularPago(p.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Pago anulado' });
            const t = this.histTrabajador();
            if (t) this.verHistorial(t);
            this.cargar();
            this.reporte.set(null);
          },
          error: (err) => this.mostrarError(this.textoError(err)),
        });
      },
    });
  }

  totalHistorial(t: Trabajador): number {
    return (t.pagos ?? []).reduce((acc, p) => acc + Number(p.monto), 0);
  }

  // ── Reporte ──
  buscarReporte() {
    this.cargandoReporte.set(true);
    const f = this.filtros.getRawValue();
    this.api
      .reporte({
        desde: f.desde || undefined,
        hasta: f.hasta || undefined,
        trabajadorId: f.trabajadorId || undefined,
      })
      .subscribe({
        next: (r) => {
          this.reporte.set(r);
          this.cargandoReporte.set(false);
        },
        error: (err) => {
          this.cargandoReporte.set(false);
          this.mostrarError(this.textoError(err));
        },
      });
  }

  descargarPdf() {
    this.descargandoPdf.set(true);
    const f = this.filtros.getRawValue();
    this.api
      .reportePdf({
        desde: f.desde || undefined,
        hasta: f.hasta || undefined,
        trabajadorId: f.trabajadorId || undefined,
      })
      .subscribe({
        next: (blob) => {
          this.descargarBlob(blob, 'reporte-pagos-personal.pdf');
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
      ['Fecha', 'Trabajador', 'Concepto', 'Pedido', 'Método', 'Monto'].join(';'),
      ...r.pagos.map((p) =>
        [
          new Date(p.fecha).toLocaleDateString('es-PE'),
          esc(p.trabajador?.nombre ?? ''),
          esc(p.concepto),
          p.pedido?.codigo ?? '',
          this.metodoLabel(p.metodo),
          p.monto,
        ].join(';'),
      ),
      '',
      `Total;;;;;${r.total}`,
    ];
    // BOM para que Excel abra bien las tildes.
    const blob = new Blob(['﻿' + filas.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    this.descargarBlob(blob, 'reporte-pagos-personal.csv');
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
