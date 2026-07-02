import { Component, OnInit, Signal, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/auth.service';
import { Color, Fibra, Tecnica, TipoCatalogo } from '../../core/models';
import { CatalogosService } from './catalogos.service';

// Forma común para pintar cualquier catálogo en la tabla.
interface CatalogoItem {
  id: string;
  nombre: string;
  activo: boolean;
  hex?: string | null;
}

@Component({
  selector: 'app-catalogos',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './catalogos.html',
  styleUrl: './catalogos.css',
})
export class Catalogos implements OnInit {
  private api = inject(CatalogosService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private auth = inject(AuthService);

  readonly fibras = signal<Fibra[]>([]);
  readonly colores = signal<Color[]>([]);
  readonly tecnicas = signal<Tecnica[]>([]);

  readonly guardando = signal(false);
  readonly dialogVisible = signal(false);
  readonly tipoActual = signal<TipoCatalogo>('fibra');
  readonly editandoId = signal<string | null>(null);

  readonly puedeGestionar = this.auth.tieneRol('ADMIN');

  // Configuración de las tres secciones (título, ícono y su lista).
  readonly grupos: {
    tipo: TipoCatalogo;
    titulo: string;
    icono: string;
    data: Signal<CatalogoItem[]>;
  }[] = [
    { tipo: 'fibra', titulo: 'Fibras', icono: 'pi pi-bolt', data: this.fibras },
    { tipo: 'color', titulo: 'Colores', icono: 'pi pi-palette', data: this.colores },
    { tipo: 'tecnica', titulo: 'Técnicas', icono: 'pi pi-cog', data: this.tecnicas },
  ];

  readonly esColor = computed(() => this.tipoActual() === 'color');

  readonly tituloDialog = computed(() => {
    const nombre = { fibra: 'fibra', color: 'color', tecnica: 'técnica' }[
      this.tipoActual()
    ];
    return `${this.editandoId() ? 'Editar' : 'Nueva'} ${nombre}`;
  });

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    hex: ['#b5674d'],
    activo: [true],
  });

  ngOnInit() {
    this.cargarTodo();
  }

  cargarTodo() {
    this.api.fibras().subscribe((d) => this.fibras.set(d));
    this.api.colores().subscribe((d) => this.colores.set(d));
    this.api.tecnicas().subscribe((d) => this.tecnicas.set(d));
  }

  private recargar(tipo: TipoCatalogo) {
    if (tipo === 'fibra') this.api.fibras().subscribe((d) => this.fibras.set(d));
    if (tipo === 'color') this.api.colores().subscribe((d) => this.colores.set(d));
    if (tipo === 'tecnica')
      this.api.tecnicas().subscribe((d) => this.tecnicas.set(d));
  }

  abrirNuevo(tipo: TipoCatalogo) {
    this.tipoActual.set(tipo);
    this.editandoId.set(null);
    this.form.reset({ nombre: '', hex: '#b5674d', activo: true });
    this.dialogVisible.set(true);
  }

  abrirEditar(tipo: TipoCatalogo, item: CatalogoItem) {
    this.tipoActual.set(tipo);
    this.editandoId.set(item.id);
    this.form.reset({
      nombre: item.nombre,
      hex: item.hex ?? '#b5674d',
      activo: item.activo,
    });
    this.dialogVisible.set(true);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const tipo = this.tipoActual();
    const v = this.form.getRawValue();
    const dto = {
      nombre: v.nombre,
      activo: v.activo,
      ...(tipo === 'color' ? { hex: v.hex } : {}),
    };

    const id = this.editandoId();
    const peticion = id
      ? this.api.actualizar(tipo, id, dto)
      : this.api.crear(tipo, dto);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogVisible.set(false);
        this.msg.add({ severity: 'success', summary: 'Guardado' });
        this.recargar(tipo);
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarError(this.textoError(err));
      },
    });
  }

  confirmarDesactivar(tipo: TipoCatalogo, item: CatalogoItem) {
    this.confirm.confirm({
      header: 'Desactivar',
      message: `¿Desactivar "${item.nombre}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.api.desactivar(tipo, item.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Desactivado' });
            this.recargar(tipo);
          },
          error: (err) => this.mostrarError(this.textoError(err)),
        });
      },
    });
  }

  reactivar(tipo: TipoCatalogo, item: CatalogoItem) {
    this.api.actualizar(tipo, item.id, { activo: true }).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Reactivado' });
        this.recargar(tipo);
      },
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
