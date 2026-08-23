import { DatePipe } from '@angular/common';
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
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/auth.service';
import { Insumo, InsumoInput, TipoMovimiento } from '../../core/models';
import { InsumosService } from './insumos.service';

@Component({
  selector: 'app-insumos',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './insumos.html',
  styleUrl: './insumos.css',
})
export class Insumos implements OnInit {
  private api = inject(InsumosService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private auth = inject(AuthService);

  readonly insumos = signal<Insumo[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);

  // Diálogos
  readonly dialogVisible = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly movVisible = signal(false);
  readonly registrandoMov = signal(false);
  readonly movInsumo = signal<Insumo | null>(null);
  readonly histVisible = signal(false);
  readonly histInsumo = signal<Insumo | null>(null);

  readonly puedeGestionar = this.auth.tieneRol('ADMIN', 'PRODUCCION');
  readonly puedeEliminar = this.auth.tieneRol('ADMIN');

  readonly tiposMovimiento = [
    { label: 'Entrada', value: 'ENTRADA' },
    { label: 'Salida', value: 'SALIDA' },
  ];

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    tipo: ['', Validators.required],
    unidad: ['', Validators.required],
    stockMinimo: [0, [Validators.required, Validators.min(0)]],
    stockInicial: [0, [Validators.min(0)]],
  });

  readonly movForm = this.fb.nonNullable.group({
    tipo: ['ENTRADA' as TipoMovimiento, Validators.required],
    cantidad: [1, [Validators.required, Validators.min(0.01)]],
    referencia: [''],
  });

  readonly editando = computed(() => this.editandoId() !== null);
  readonly tituloDialog = computed(() =>
    this.editandoId() ? 'Editar insumo' : 'Nuevo insumo',
  );

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.api.listar().subscribe({
      next: (data) => {
        this.insumos.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.mostrarError('No se pudieron cargar los insumos');
      },
    });
  }

  // ── Crear / editar ──
  abrirNuevo() {
    this.editandoId.set(null);
    this.form.reset({
      nombre: '',
      tipo: '',
      unidad: '',
      stockMinimo: 0,
      stockInicial: 0,
    });
    this.dialogVisible.set(true);
  }

  abrirEditar(i: Insumo) {
    this.editandoId.set(i.id);
    this.form.reset({
      nombre: i.nombre,
      tipo: i.tipo,
      unidad: i.unidad,
      stockMinimo: Number(i.stockMinimo),
      stockInicial: 0,
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
    const id = this.editandoId();

    const dto: InsumoInput = {
      nombre: v.nombre,
      tipo: v.tipo,
      unidad: v.unidad,
      stockMinimo: v.stockMinimo,
    };
    // El stock inicial solo aplica al crear.
    if (!id && v.stockInicial > 0) dto.stockInicial = v.stockInicial;

    const peticion = id ? this.api.actualizar(id, dto) : this.api.crear(dto);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogVisible.set(false);
        this.msg.add({
          severity: 'success',
          summary: id ? 'Insumo actualizado' : 'Insumo creado',
        });
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarError(this.textoError(err));
      },
    });
  }

  confirmarEliminar(i: Insumo) {
    this.confirm.confirm({
      header: 'Eliminar insumo',
      message: `¿Eliminar "${i.nombre}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.api.eliminar(i.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Insumo eliminado' });
            this.cargar();
          },
          error: (err) => this.mostrarError(this.textoError(err)),
        });
      },
    });
  }

  // ── Movimientos ──
  abrirMovimiento(i: Insumo) {
    this.movInsumo.set(i);
    this.movForm.reset({ tipo: 'ENTRADA', cantidad: 1, referencia: '' });
    this.movVisible.set(true);
  }

  registrarMovimiento() {
    const insumo = this.movInsumo();
    if (!insumo || this.movForm.invalid) {
      this.movForm.markAllAsTouched();
      return;
    }
    this.registrandoMov.set(true);
    const v = this.movForm.getRawValue();
    this.api
      .registrarMovimiento(insumo.id, {
        tipo: v.tipo,
        cantidad: v.cantidad,
        referencia: v.referencia || undefined,
      })
      .subscribe({
        next: () => {
          this.registrandoMov.set(false);
          this.movVisible.set(false);
          this.msg.add({
            severity: 'success',
            summary: v.tipo === 'ENTRADA' ? 'Entrada registrada' : 'Salida registrada',
          });
          this.cargar();
        },
        error: (err) => {
          this.registrandoMov.set(false);
          this.mostrarError(this.textoError(err));
        },
      });
  }

  // ── Historial ──
  verHistorial(i: Insumo) {
    this.histInsumo.set(i);
    this.histVisible.set(true);
    this.api.obtener(i.id).subscribe({
      next: (fresco) => this.histInsumo.set(fresco),
      error: (err) => this.mostrarError(this.textoError(err)),
    });
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
