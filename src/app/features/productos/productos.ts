import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/auth.service';
import { CategoriaProducto, Producto, ProductoInput } from '../../core/models';
import { ProductosService } from './productos.service';

@Component({
  selector: 'app-productos',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule,
    ToggleSwitchModule,
    TooltipModule,
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit {
  private api = inject(ProductosService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private auth = inject(AuthService);

  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly dialogVisible = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly mostrarInactivos = signal(false);

  readonly puedeEditar = this.auth.tieneRol('ADMIN', 'VENTAS');
  readonly puedeEliminar = this.auth.tieneRol('ADMIN');

  readonly categorias: { label: string; value: CategoriaProducto }[] = [
    { label: 'Tela', value: 'tela' },
    { label: 'Punto', value: 'punto' },
    { label: 'Accesorio', value: 'accesorio' },
    { label: 'Hogar', value: 'hogar' },
  ];

  readonly unidades = [
    { label: 'Unidad', value: 'unidad' },
    { label: 'Metro', value: 'metro' },
  ];

  // Lista filtrada según el interruptor "mostrar inactivos".
  readonly visibles = computed(() =>
    this.mostrarInactivos()
      ? this.productos()
      : this.productos().filter((p) => p.activo),
  );

  readonly tituloDialog = computed(() =>
    this.editandoId() ? 'Editar producto' : 'Nuevo producto',
  );

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    categoria: ['accesorio' as CategoriaProducto, Validators.required],
    unidad: ['unidad', Validators.required],
    precioBase: [0, [Validators.required, Validators.min(0)]],
    descripcion: [''],
    activo: [true],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.api.listar().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.mostrarError('No se pudieron cargar los productos');
      },
    });
  }

  abrirNuevo() {
    this.editandoId.set(null);
    this.form.reset({
      nombre: '',
      categoria: 'accesorio',
      unidad: 'unidad',
      precioBase: 0,
      descripcion: '',
      activo: true,
    });
    this.dialogVisible.set(true);
  }

  abrirEditar(p: Producto) {
    this.editandoId.set(p.id);
    this.form.reset({
      nombre: p.nombre,
      categoria: p.categoria as CategoriaProducto,
      unidad: p.unidad,
      precioBase: Number(p.precioBase),
      descripcion: p.descripcion ?? '',
      activo: p.activo,
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
    const dto: ProductoInput = {
      nombre: v.nombre,
      categoria: v.categoria,
      unidad: v.unidad,
      precioBase: v.precioBase,
      descripcion: v.descripcion || undefined,
      activo: v.activo,
    };

    const id = this.editandoId();
    const peticion = id ? this.api.actualizar(id, dto) : this.api.crear(dto);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogVisible.set(false);
        this.msg.add({
          severity: 'success',
          summary: id ? 'Producto actualizado' : 'Producto creado',
        });
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarError(this.textoError(err));
      },
    });
  }

  confirmarDesactivar(p: Producto) {
    this.confirm.confirm({
      header: 'Desactivar producto',
      message: `¿Desactivar "${p.nombre}"? Dejará de aparecer en pedidos nuevos, pero se conserva su historial.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.api.desactivar(p.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Producto desactivado' });
            this.cargar();
          },
          error: (err) => this.mostrarError(this.textoError(err)),
        });
      },
    });
  }

  reactivar(p: Producto) {
    this.api.actualizar(p.id, { activo: true }).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Producto reactivado' });
        this.cargar();
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
