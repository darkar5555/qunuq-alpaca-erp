import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../core/auth.service';
import { Rol } from '../../core/models';
import { PerfilService } from './perfil.service';

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, TagModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  private api = inject(PerfilService);
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private auth = inject(AuthService);

  readonly usuario = this.auth.usuario;
  readonly guardando = signal(false);

  readonly inicial = computed(
    () => (this.usuario()?.nombre ?? '?')[0]?.toUpperCase() ?? '?',
  );

  private readonly rolLabels: Record<Rol, string> = {
    ADMIN: 'Administrador',
    VENTAS: 'Ventas',
    PRODUCCION: 'Producción',
  };

  readonly rolLabel = computed(() => {
    const rol = this.usuario()?.rol;
    return rol ? this.rolLabels[rol] : '';
  });

  readonly form = this.fb.nonNullable.group({
    passwordActual: ['', Validators.required],
    passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
    confirmar: ['', Validators.required],
  });

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.passwordNueva !== v.confirmar) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La confirmación no coincide con la nueva contraseña',
      });
      return;
    }

    this.guardando.set(true);
    this.api
      .cambiarPassword({
        passwordActual: v.passwordActual,
        passwordNueva: v.passwordNueva,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.form.reset({
            passwordActual: '',
            passwordNueva: '',
            confirmar: '',
          });
          this.msg.add({
            severity: 'success',
            summary: 'Contraseña actualizada',
            detail: 'Tu contraseña se cambió correctamente.',
          });
        },
        error: (err) => {
          this.guardando.set(false);
          this.msg.add({
            severity: 'error',
            summary: 'Error',
            detail: this.textoError(err),
          });
        },
      });
  }

  private textoError(err: unknown): string {
    const m = (err as { error?: { message?: string | string[] } })?.error
      ?.message;
    if (Array.isArray(m)) return m.join(', ');
    return m ?? 'Ocurrió un error inesperado';
  }
}
