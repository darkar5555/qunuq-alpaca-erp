import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import {
  ContenidoSitio,
  ImagenSitio,
  TarjetaProducto,
} from '../../core/models';
import { ContenidoService } from './contenido.service';

interface GrupoTextos {
  grupo: string;
  titulo: string;
  items: ContenidoSitio[];
}

const TITULOS_GRUPO: Record<string, string> = {
  hero: 'Portada (Hero)',
  about: 'Nosotros',
  contacto: 'Contacto',
  redes: 'Redes sociales',
};

const SECCIONES = [
  { key: 'hero', label: 'Portada' },
  { key: 'galeria', label: 'Galería' },
  { key: 'about', label: 'Nosotros' },
  { key: 'producto', label: 'Productos' },
];

@Component({
  selector: 'app-sitio',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    TooltipModule,
  ],
  templateUrl: './sitio.html',
  styleUrl: './sitio.css',
})
export class Sitio implements OnInit {
  private api = inject(ContenidoService);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  readonly textos = signal<ContenidoSitio[]>([]);
  readonly imagenes = signal<ImagenSitio[]>([]);
  readonly tarjetas = signal<TarjetaProducto[]>([]);
  readonly guardandoClave = signal<string | null>(null);
  readonly subiendoSeccion = signal<string | null>(null);
  readonly subiendoTarjeta = signal<string | null>(null);
  readonly guardandoTarjeta = signal<string | null>(null);

  readonly secciones = SECCIONES;

  // Textos agrupados por sección para mostrarlos ordenados.
  readonly grupos = computed<GrupoTextos[]>(() => {
    const porGrupo = new Map<string, ContenidoSitio[]>();
    for (const t of this.textos()) {
      const arr = porGrupo.get(t.grupo) ?? [];
      arr.push(t);
      porGrupo.set(t.grupo, arr);
    }
    return [...porGrupo.entries()].map(([grupo, items]) => ({
      grupo,
      titulo: TITULOS_GRUPO[grupo] ?? grupo,
      items,
    }));
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.api.listarTextos().subscribe({
      next: (d) => this.textos.set(d),
      error: () => this.error('No se pudieron cargar los textos'),
    });
    this.api.listarImagenes().subscribe({
      next: (d) => this.imagenes.set(d),
      error: () => this.error('No se pudieron cargar las imágenes'),
    });
    this.api.listarTarjetas().subscribe({
      next: (d) => this.tarjetas.set(d),
      error: () => this.error('No se pudieron cargar las tarjetas'),
    });
  }

  imagenesDe(seccion: string): ImagenSitio[] {
    return this.imagenes().filter((i) => i.seccion === seccion);
  }

  url(u: string): string {
    return this.api.urlImagen(u);
  }

  // ── Textos ──
  guardarTexto(item: ContenidoSitio) {
    this.guardandoClave.set(item.clave);
    this.api.guardarTexto(item.clave, item.valor).subscribe({
      next: () => {
        this.guardandoClave.set(null);
        this.msg.add({ severity: 'success', summary: 'Texto guardado' });
      },
      error: (err) => {
        this.guardandoClave.set(null);
        this.error(this.textoError(err));
      },
    });
  }

  // ── Imágenes ──
  seleccionarArchivo(input: HTMLInputElement, seccion: string) {
    this.subiendoSeccion.set(seccion);
    input.value = '';
    input.click();
  }

  onArchivo(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    const seccion = this.subiendoSeccion();
    if (!archivo || !seccion) {
      return;
    }
    this.api.subirImagen(archivo, seccion).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Imagen subida' });
        this.subiendoSeccion.set(null);
        this.cargar();
      },
      error: (err) => {
        this.subiendoSeccion.set(null);
        this.error(this.textoError(err));
      },
    });
  }

  alternarActivo(img: ImagenSitio) {
    this.api.actualizarImagen(img.id, { activo: !img.activo }).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error(this.textoError(err)),
    });
  }

  confirmarEliminar(img: ImagenSitio) {
    this.confirm.confirm({
      header: 'Eliminar imagen',
      message: '¿Eliminar esta imagen? No se puede deshacer.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.api.eliminarImagen(img.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Imagen eliminada' });
            this.cargar();
          },
          error: (err) => this.error(this.textoError(err)),
        });
      },
    });
  }

  // ── Tarjetas "Qué tejemos" ──
  agregarTarjeta() {
    this.api
      .crearTarjeta({ titulo: 'Nueva tarjeta', descripcion: 'Descripción…' })
      .subscribe({
        next: () => {
          this.msg.add({ severity: 'success', summary: 'Tarjeta agregada' });
          this.cargar();
        },
        error: (err) => this.error(this.textoError(err)),
      });
  }

  guardarTarjeta(t: TarjetaProducto) {
    this.guardandoTarjeta.set(t.id);
    this.api
      .actualizarTarjeta(t.id, {
        titulo: t.titulo,
        descripcion: t.descripcion,
      })
      .subscribe({
        next: () => {
          this.guardandoTarjeta.set(null);
          this.msg.add({ severity: 'success', summary: 'Tarjeta guardada' });
        },
        error: (err) => {
          this.guardandoTarjeta.set(null);
          this.error(this.textoError(err));
        },
      });
  }

  seleccionarFotoTarjeta(input: HTMLInputElement, id: string) {
    this.subiendoTarjeta.set(id);
    input.value = '';
    input.click();
  }

  onFotoTarjeta(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    const id = this.subiendoTarjeta();
    if (!archivo || !id) {
      return;
    }
    this.api.subirImagenTarjeta(id, archivo).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Foto actualizada' });
        this.subiendoTarjeta.set(null);
        this.cargar();
      },
      error: (err) => {
        this.subiendoTarjeta.set(null);
        this.error(this.textoError(err));
      },
    });
  }

  alternarActivoTarjeta(t: TarjetaProducto) {
    this.api.actualizarTarjeta(t.id, { activo: !t.activo }).subscribe({
      next: () => this.cargar(),
      error: (err) => this.error(this.textoError(err)),
    });
  }

  confirmarEliminarTarjeta(t: TarjetaProducto) {
    this.confirm.confirm({
      header: 'Eliminar tarjeta',
      message: `¿Eliminar la tarjeta "${t.titulo}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.api.eliminarTarjeta(t.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Tarjeta eliminada' });
            this.cargar();
          },
          error: (err) => this.error(this.textoError(err)),
        });
      },
    });
  }

  private error(detail: string) {
    this.msg.add({ severity: 'error', summary: 'Error', detail });
  }

  private textoError(err: unknown): string {
    const m = (err as { error?: { message?: string | string[] } })?.error
      ?.message;
    if (Array.isArray(m)) return m.join(', ');
    return m ?? 'Ocurrió un error inesperado';
  }
}
