import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../core/auth.service';
import { Cliente, ClienteInput, TipoDocumento } from '../../core/models';
import { ClientesService } from './clientes.service';

@Component({
  selector: 'app-clientes',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {
  private api = inject(ClientesService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private auth = inject(AuthService);

  readonly clientes = signal<Cliente[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly dialogVisible = signal(false);
  readonly editandoId = signal<string | null>(null);

  readonly puedeEditar = this.auth.tieneRol('ADMIN', 'VENTAS');
  readonly puedeEliminar = this.auth.tieneRol('ADMIN');

  readonly tiposDocumento = [
    { label: 'DNI', value: 'DNI' },
    { label: 'RUC', value: 'RUC' },
  ];

  readonly form = this.fb.nonNullable.group({
    tipoDocumento: ['DNI' as TipoDocumento, Validators.required],
    numeroDocumento: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    nombreORazonSocial: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', Validators.email],
    telefono: [''],
    direccion: [''],
  });

  // Texto de ayuda según el tipo de documento seleccionado.
  readonly ayudaDocumento = computed(() => {
    const tipo = this.form.controls.tipoDocumento.value;
    return tipo === 'RUC' ? '11 dígitos' : '8 dígitos';
  });

  readonly tituloDialog = computed(() =>
    this.editandoId() ? 'Editar cliente' : 'Nuevo cliente',
  );

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.api.listar().subscribe({
      next: (data) => {
        this.clientes.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.mostrarError('No se pudieron cargar los clientes');
      },
    });
  }

  abrirNuevo() {
    this.editandoId.set(null);
    this.form.reset({
      tipoDocumento: 'DNI',
      numeroDocumento: '',
      nombreORazonSocial: '',
      email: '',
      telefono: '',
      direccion: '',
    });
    this.dialogVisible.set(true);
  }

  abrirEditar(c: Cliente) {
    this.editandoId.set(c.id);
    this.form.reset({
      tipoDocumento: c.tipoDocumento,
      numeroDocumento: c.numeroDocumento,
      nombreORazonSocial: c.nombreORazonSocial,
      email: c.email ?? '',
      telefono: c.telefono ?? '',
      direccion: c.direccion ?? '',
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
    const dto: ClienteInput = {
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: v.numeroDocumento,
      nombreORazonSocial: v.nombreORazonSocial,
      email: v.email || undefined,
      telefono: v.telefono || undefined,
      direccion: v.direccion || undefined,
    };

    const id = this.editandoId();
    const peticion = id ? this.api.actualizar(id, dto) : this.api.crear(dto);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogVisible.set(false);
        this.msg.add({
          severity: 'success',
          summary: id ? 'Cliente actualizado' : 'Cliente creado',
        });
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarError(this.textoError(err));
      },
    });
  }

  confirmarEliminar(c: Cliente) {
    this.confirm.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar a "${c.nombreORazonSocial}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.eliminar(c),
    });
  }

  private eliminar(c: Cliente) {
    this.api.eliminar(c.id).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Cliente eliminado' });
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
