import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { EstadoSolicitud, Solicitud } from '../../core/models';
import { SolicitudesService } from './solicitudes.service';

type Severidad = 'secondary' | 'info' | 'warn' | 'success';

@Component({
  selector: 'app-solicitudes',
  imports: [
    FormsModule,
    DatePipe,
    ButtonModule,
    DialogModule,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './solicitudes.html',
  styleUrl: './solicitudes.css',
})
export class Solicitudes implements OnInit {
  private api = inject(SolicitudesService);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  readonly solicitudes = signal<Solicitud[]>([]);
  readonly cargando = signal(false);
  readonly filtroEstado = signal<EstadoSolicitud | null>(null);
  readonly detalleVisible = signal(false);
  readonly seleccionada = signal<Solicitud | null>(null);

  readonly opcionesFiltro = [
    { label: 'Todas', value: null },
    { label: 'Nuevas', value: 'NUEVA' },
    { label: 'Atendidas', value: 'ATENDIDA' },
    { label: 'Convertidas', value: 'CONVERTIDA' },
    { label: 'Descartadas', value: 'DESCARTADA' },
  ];

  // Estados a los que se puede cambiar desde el detalle.
  readonly acciones: { estado: EstadoSolicitud; label: string; icon: string }[] =
    [
      { estado: 'ATENDIDA', label: 'Marcar atendida', icon: 'pi pi-check' },
      { estado: 'CONVERTIDA', label: 'Convertida en pedido', icon: 'pi pi-shopping-cart' },
      { estado: 'DESCARTADA', label: 'Descartar', icon: 'pi pi-times' },
    ];

  ngOnInit() {
    this.cargar();
    this.api.refrescarNuevas();
  }

  cargar() {
    this.cargando.set(true);
    this.api.listar(this.filtroEstado() ?? undefined).subscribe({
      next: (d) => {
        this.solicitudes.set(d);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.mostrarError('No se pudieron cargar las solicitudes');
      },
    });
  }

  cambiarFiltro(estado: EstadoSolicitud | null) {
    this.filtroEstado.set(estado);
    this.cargar();
  }

  verDetalle(s: Solicitud) {
    this.seleccionada.set(s);
    this.detalleVisible.set(true);
  }

  cambiarEstado(s: Solicitud, estado: EstadoSolicitud) {
    this.api.cambiarEstado(s.id, estado).subscribe({
      next: (actualizada) => {
        this.msg.add({ severity: 'success', summary: 'Solicitud actualizada' });
        this.seleccionada.set(actualizada);
        this.cargar();
        this.api.refrescarNuevas();
      },
      error: (err) => this.mostrarError(this.textoError(err)),
    });
  }

  confirmarEliminar(s: Solicitud) {
    this.confirm.confirm({
      header: 'Eliminar solicitud',
      message: `¿Eliminar la solicitud de "${s.nombre}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.api.eliminar(s.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Solicitud eliminada' });
            this.detalleVisible.set(false);
            this.cargar();
            this.api.refrescarNuevas();
          },
          error: (err) => this.mostrarError(this.textoError(err)),
        });
      },
    });
  }

  etiquetaEstado(estado: EstadoSolicitud): string {
    return {
      NUEVA: 'Nueva',
      ATENDIDA: 'Atendida',
      CONVERTIDA: 'Convertida',
      DESCARTADA: 'Descartada',
    }[estado];
  }

  severidadEstado(estado: EstadoSolicitud): Severidad {
    return {
      NUEVA: 'warn',
      ATENDIDA: 'info',
      CONVERTIDA: 'success',
      DESCARTADA: 'secondary',
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
