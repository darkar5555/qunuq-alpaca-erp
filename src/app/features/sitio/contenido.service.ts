import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  ContenidoSitio,
  ImagenSitio,
  TarjetaProducto,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class ContenidoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/contenido`;
  readonly apiUrl = environment.apiUrl;

  // ── Textos ──
  listarTextos() {
    return this.http.get<ContenidoSitio[]>(this.base);
  }

  guardarTexto(clave: string, valor: string) {
    return this.http.patch<ContenidoSitio>(
      `${this.base}/${encodeURIComponent(clave)}`,
      { valor },
    );
  }

  // ── Imágenes ──
  listarImagenes(seccion?: string) {
    let params = new HttpParams();
    if (seccion) {
      params = params.set('seccion', seccion);
    }
    return this.http.get<ImagenSitio[]>(`${this.base}/imagenes/todas`, {
      params,
    });
  }

  subirImagen(archivo: File, seccion: string, titulo?: string) {
    const fd = new FormData();
    fd.append('archivo', archivo);
    fd.append('seccion', seccion);
    if (titulo) {
      fd.append('titulo', titulo);
    }
    return this.http.post<ImagenSitio>(`${this.base}/imagenes`, fd);
  }

  actualizarImagen(
    id: string,
    data: { titulo?: string; orden?: number; activo?: boolean },
  ) {
    return this.http.patch<ImagenSitio>(`${this.base}/imagenes/${id}`, data);
  }

  eliminarImagen(id: string) {
    return this.http.delete<{ mensaje: string }>(`${this.base}/imagenes/${id}`);
  }

  // ── Tarjetas "Qué tejemos" ──
  listarTarjetas() {
    return this.http.get<TarjetaProducto[]>(`${this.base}/tarjetas`);
  }

  crearTarjeta(data: { titulo: string; descripcion: string }) {
    return this.http.post<TarjetaProducto>(`${this.base}/tarjetas`, data);
  }

  actualizarTarjeta(
    id: string,
    data: {
      titulo?: string;
      descripcion?: string;
      orden?: number;
      activo?: boolean;
    },
  ) {
    return this.http.patch<TarjetaProducto>(
      `${this.base}/tarjetas/${id}`,
      data,
    );
  }

  subirImagenTarjeta(id: string, archivo: File) {
    const fd = new FormData();
    fd.append('archivo', archivo);
    return this.http.post<TarjetaProducto>(
      `${this.base}/tarjetas/${id}/imagen`,
      fd,
    );
  }

  eliminarTarjeta(id: string) {
    return this.http.delete<{ mensaje: string }>(`${this.base}/tarjetas/${id}`);
  }

  // Convierte /uploads/.. en URL absoluta para mostrar la miniatura.
  urlImagen(url: string): string {
    return url.startsWith('/') ? `${this.apiUrl}${url}` : url;
  }
}
