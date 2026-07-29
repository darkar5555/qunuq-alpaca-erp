import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/auth.service';
import { Rol, UsuarioDetalle, UsuarioInput } from '../../core/models';
import { UsuariosService } from './usuarios.service';

@Component({
  selector: 'app-usuarios',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private api = inject(UsuariosService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private auth = inject(AuthService);

  readonly usuarios = signal<UsuarioDetalle[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly dialogVisible = signal(false);
  readonly editandoId = signal<string | null>(null);

  // Id del usuario en sesión: no puede desactivar su propia cuenta.
  readonly miId = this.auth.usuario()?.id ?? null;

  readonly roles = [
    { label: 'Administrador', value: 'ADMIN' },
    { label: 'Ventas', value: 'VENTAS' },
    { label: 'Producción', value: 'PRODUCCION' },
  ];

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    rol: ['VENTAS' as Rol, Validators.required],
    password: [''],
  });

  readonly editando = computed(() => this.editandoId() !== null);

  readonly tituloDialog = computed(() =>
    this.editandoId() ? 'Editar usuario' : 'Nuevo usuario',
  );

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.api.listar().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.mostrarError('No se pudieron cargar los usuarios');
      },
    });
  }

  abrirNuevo() {
    this.editandoId.set(null);
    this.form.reset({ nombre: '', email: '', rol: 'VENTAS', password: '' });
    // Al crear, la contraseña es obligatoria.
    this.form.controls.password.setValidators([
      Validators.required,
      Validators.minLength(6),
    ]);
    this.form.controls.password.updateValueAndValidity();
    this.dialogVisible.set(true);
  }

  abrirEditar(u: UsuarioDetalle) {
    this.editandoId.set(u.id);
    this.form.reset({
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      password: '',
    });
    // Al editar, la contraseña es opcional (vacío = no cambiarla).
    this.form.controls.password.setValidators([Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
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

    const dto: UsuarioInput = {
      nombre: v.nombre,
      email: v.email,
      rol: v.rol,
    };
    // Solo enviamos la contraseña si se escribió una.
    if (v.password) dto.password = v.password;

    const peticion = id ? this.api.actualizar(id, dto) : this.api.crear(dto);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogVisible.set(false);
        this.msg.add({
          severity: 'success',
          summary: id ? 'Usuario actualizado' : 'Usuario creado',
        });
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.mostrarError(this.textoError(err));
      },
    });
  }

  confirmarDesactivar(u: UsuarioDetalle) {
    this.confirm.confirm({
      header: 'Desactivar usuario',
      message: `¿Desactivar a "${u.nombre}"? No podrá iniciar sesión hasta reactivarlo.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.api.desactivar(u.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Usuario desactivado' });
            this.cargar();
          },
          error: (err) => this.mostrarError(this.textoError(err)),
        });
      },
    });
  }

  reactivar(u: UsuarioDetalle) {
    this.api.actualizar(u.id, { activo: true }).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Usuario reactivado' });
        this.cargar();
      },
      error: (err) => this.mostrarError(this.textoError(err)),
    });
  }

  rolLabel(rol: Rol): string {
    return this.roles.find((r) => r.value === rol)?.label ?? rol;
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
