import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
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
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/auth.service';
import {
  Cliente,
  Color,
  EstadoPedido,
  Fibra,
  MetodoPago,
  Pago,
  Pedido,
  PedidoInput,
  PedidoItemInput,
  Producto,
  Tecnica,
} from '../../core/models';
import { ClientesService } from '../clientes/clientes.service';
import { CatalogosService } from '../catalogos/catalogos.service';
import { ProductosService } from '../productos/productos.service';
import { PedidosService } from './pedidos.service';
import { PagosService } from './pagos.service';

type Severidad = 'secondary' | 'info' | 'warn' | 'success';

const ORDEN_ESTADOS: EstadoPedido[] = [
  'COTIZACION',
  'MUESTRA',
  'PRODUCCION',
  'ENTREGADO',
];

const round2 = (n: number) => Math.round(n * 100) / 100;

@Component({
  selector: 'app-pedidos',
  imports: [
    CurrencyPipe,
    DatePipe,
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
    TooltipModule,
  ],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {
  private api = inject(PedidosService);
  private pagosApi = inject(PagosService);
  private clientesApi = inject(ClientesService);
  private productosApi = inject(ProductosService);
  private catalogosApi = inject(CatalogosService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private auth = inject(AuthService);

  readonly pedidos = signal<Pedido[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly filtroEstado = signal<EstadoPedido | null>(null);

  // Datos para los selectores del formulario.
  readonly clientes = signal<Cliente[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly fibras = signal<Fibra[]>([]);
  readonly colores = signal<Color[]>([]);
  readonly tecnicas = signal<Tecnica[]>([]);

  // Diálogos.
  readonly crearVisible = signal(false);
  readonly detalleVisible = signal(false);
  readonly seleccionado = signal<Pedido | null>(null);

  // Pagos del pedido seleccionado.
  readonly pagoVisible = signal(false);
  readonly registrandoPago = signal(false);

  // Id del pedido cuya cotización se está descargando (para el spinner).
  readonly descargandoPdf = signal<string | null>(null);

  readonly metodosPago = [
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Yape', value: 'YAPE' },
    { label: 'Plin', value: 'PLIN' },
  ];

  readonly pagoForm = this.fb.nonNullable.group({
    monto: [0, [Validators.required, Validators.min(0.01)]],
    metodo: ['EFECTIVO' as MetodoPago, Validators.required],
  });

  // Totales calculados en vivo (vista previa; el oficial lo da el backend).
  readonly totales = signal({ subtotal: 0, igv: 0, total: 0 });

  readonly puedeCrear = this.auth.tieneRol('ADMIN', 'VENTAS');
  readonly puedeCambiarEstado = this.auth.tieneRol(
    'ADMIN',
    'VENTAS',
    'PRODUCCION',
  );
  readonly puedeEliminar = this.auth.tieneRol('ADMIN');

  readonly opcionesFiltro = [
    { label: 'Todos', value: null },
    { label: 'Cotización', value: 'COTIZACION' },
    { label: 'Muestra', value: 'MUESTRA' },
    { label: 'Producción', value: 'PRODUCCION' },
    { label: 'Entregado', value: 'ENTREGADO' },
  ];

  readonly clienteOpciones = computed(() =>
    this.clientes().map((c) => ({
      label: `${c.nombreORazonSocial} (${c.numeroDocumento})`,
      value: c.id,
    })),
  );

  readonly productoOpciones = computed(() =>
    this.productos().map((p) => ({
      label: `${p.nombre} · S/ ${p.precioBase}`,
      value: p.id,
    })),
  );

  readonly form = this.fb.nonNullable.group({
    clienteId: ['', Validators.required],
    notas: [''],
    items: this.fb.array<FormGroup>([]),
  });

  constructor() {
    // Recalcula la vista previa de totales cuando cambian los ítems.
    this.form.controls.items.valueChanges.subscribe(() => this.recalcular());
  }

  ngOnInit() {
    this.cargar();
    this.cargarOpciones();
  }

  // ── Lista ──
  cargar() {
    this.cargando.set(true);
    this.api.listar(this.filtroEstado() ?? undefined).subscribe({
      next: (data) => {
        this.pedidos.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.mostrarError('No se pudieron cargar los pedidos');
      },
    });
  }

  cambiarFiltro(estado: EstadoPedido | null) {
    this.filtroEstado.set(estado);
    this.cargar();
  }

  private cargarOpciones() {
    this.clientesApi.listar().subscribe((d) => this.clientes.set(d));
    this.productosApi
      .listar()
      .subscribe((d) => this.productos.set(d.filter((p) => p.activo)));
    this.catalogosApi
      .fibras()
      .subscribe((d) => this.fibras.set(d.filter((f) => f.activo)));
    this.catalogosApi
      .colores()
      .subscribe((d) => this.colores.set(d.filter((c) => c.activo)));
    this.catalogosApi
      .tecnicas()
      .subscribe((d) => this.tecnicas.set(d.filter((t) => t.activo)));
  }

  // ── Crear ──
  get items(): FormArray<FormGroup> {
    return this.form.controls.items;
  }

  private nuevoItem(): FormGroup {
    return this.fb.nonNullable.group({
      productoId: ['', Validators.required],
      fibraId: [''],
      colorId: [''],
      tecnicaId: [''],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
    });
  }

  abrirCrear() {
    this.form.reset({ clienteId: '', notas: '' });
    this.items.clear();
    this.agregarItem();
    this.recalcular();
    this.crearVisible.set(true);
  }

  agregarItem() {
    this.items.push(this.nuevoItem());
  }

  quitarItem(i: number) {
    this.items.removeAt(i);
    this.recalcular();
  }

  // Al elegir producto, autocompleta su precio base.
  onProductoChange(i: number) {
    const grupo = this.items.at(i);
    const id = grupo.get('productoId')!.value as string;
    const prod = this.productos().find((p) => p.id === id);
    if (prod) {
      grupo.get('precioUnitario')!.setValue(Number(prod.precioBase));
    }
  }

  private recalcular() {
    const subtotal = round2(
      this.items.controls.reduce((acc, g) => {
        const cant = Number(g.get('cantidad')!.value) || 0;
        const precio = Number(g.get('precioUnitario')!.value) || 0;
        return acc + cant * precio;
      }, 0),
    );
    const igv = round2(subtotal * 0.18);
    this.totales.set({ subtotal, igv, total: round2(subtotal + igv) });
  }

  guardar() {
    if (this.form.invalid || this.items.length === 0) {
      this.form.markAllAsTouched();
      this.mostrarError('Completa el cliente y al menos un ítem válido');
      return;
    }
    this.guardando.set(true);
    const v = this.form.getRawValue();
    const items: PedidoItemInput[] = this.items.controls.map((g) => {
      const raw = g.getRawValue() as {
        productoId: string;
        fibraId: string;
        colorId: string;
        tecnicaId: string;
        cantidad: number;
        precioUnitario: number;
      };
      return {
        productoId: raw.productoId,
        fibraId: raw.fibraId || undefined,
        colorId: raw.colorId || undefined,
        tecnicaId: raw.tecnicaId || undefined,
        cantidad: raw.cantidad,
        precioUnitario: raw.precioUnitario,
      };
    });
    const dto: PedidoInput = {
      clienteId: v.clienteId,
      notas: v.notas || undefined,
      items,
    };

    this.api.crear(dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.crearVisible.set(false);
        this.msg.add({ severity: 'success', summary: 'Pedido creado' });
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarError(this.textoError(err));
      },
    });
  }

  // ── Detalle / estado ──
  verDetalle(p: Pedido) {
    this.seleccionado.set(p);
    this.detalleVisible.set(true);
    // Trae la versión más reciente (con pagos y saldo actualizados).
    this.refrescarSeleccionado(p.id);
  }

  private refrescarSeleccionado(id: string) {
    this.api.obtener(id).subscribe((fresco) => this.seleccionado.set(fresco));
  }

  // Descarga la cotización en PDF y dispara el "guardar archivo" del navegador.
  descargarCotizacion(p: Pedido) {
    this.descargandoPdf.set(p.id);
    this.api.descargarCotizacion(p.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cotizacion-${p.codigo}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.descargandoPdf.set(null);
      },
      error: () => {
        this.descargandoPdf.set(null);
        this.mostrarError('No se pudo generar el PDF de la cotización');
      },
    });
  }

  // ── Pagos ──
  saldoNum(p: Pedido): number {
    return Number(p.saldo ?? p.total);
  }

  estadoPago(p: Pedido): 'Pendiente' | 'Parcial' | 'Pagado' {
    const pagado = Number(p.pagado ?? 0);
    const total = Number(p.total);
    if (pagado <= 0) return 'Pendiente';
    if (pagado < total) return 'Parcial';
    return 'Pagado';
  }

  severidadPago(p: Pedido): Severidad {
    return {
      Pendiente: 'secondary',
      Parcial: 'warn',
      Pagado: 'success',
    }[this.estadoPago(p)] as Severidad;
  }

  metodoLabel(metodo: MetodoPago): string {
    return (
      this.metodosPago.find((m) => m.value === metodo)?.label ?? metodo
    );
  }

  abrirPago() {
    const p = this.seleccionado();
    if (!p) return;
    // Pre-carga el monto con el saldo pendiente.
    this.pagoForm.reset({ monto: this.saldoNum(p), metodo: 'EFECTIVO' });
    this.pagoVisible.set(true);
  }

  registrarPago() {
    const p = this.seleccionado();
    if (!p) return;
    if (this.pagoForm.invalid) {
      this.pagoForm.markAllAsTouched();
      return;
    }
    this.registrandoPago.set(true);
    const v = this.pagoForm.getRawValue();
    this.pagosApi
      .crear({ pedidoId: p.id, monto: v.monto, metodo: v.metodo })
      .subscribe({
        next: () => {
          this.registrandoPago.set(false);
          this.pagoVisible.set(false);
          this.msg.add({ severity: 'success', summary: 'Pago registrado' });
          this.refrescarSeleccionado(p.id);
          this.cargar();
        },
        error: (err) => {
          this.registrandoPago.set(false);
          this.mostrarError(this.textoError(err));
        },
      });
  }

  confirmarAnularPago(pago: Pago) {
    const p = this.seleccionado();
    if (!p) return;
    this.confirm.confirm({
      header: 'Anular pago',
      message: `¿Anular el pago de ${pago.monto} (${this.metodoLabel(pago.metodo)})?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Anular',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.pagosApi.eliminar(pago.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Pago anulado' });
            this.refrescarSeleccionado(p.id);
            this.cargar();
          },
          error: (err) => this.mostrarError(this.textoError(err)),
        });
      },
    });
  }

  estadosSiguientes(estado: EstadoPedido): EstadoPedido[] {
    return ORDEN_ESTADOS.slice(ORDEN_ESTADOS.indexOf(estado) + 1);
  }

  avanzarEstado(p: Pedido, estado: EstadoPedido) {
    this.api.cambiarEstado(p.id, estado).subscribe({
      next: (actualizado) => {
        this.msg.add({
          severity: 'success',
          summary: `Estado: ${this.etiquetaEstado(estado)}`,
        });
        this.seleccionado.set(actualizado);
        this.cargar();
      },
      error: (err) => this.mostrarError(this.textoError(err)),
    });
  }

  confirmarEliminar(p: Pedido) {
    this.confirm.confirm({
      header: 'Eliminar pedido',
      message: `¿Eliminar el pedido ${p.codigo}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.api.eliminar(p.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Pedido eliminado' });
            this.detalleVisible.set(false);
            this.cargar();
          },
          error: (err) => this.mostrarError(this.textoError(err)),
        });
      },
    });
  }

  // ── Presentación de estados ──
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
