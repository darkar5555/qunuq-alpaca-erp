import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { EstadoSolicitud, Solicitud } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/solicitudes`;

  // Contador de solicitudes nuevas (para el badge del menú).
  readonly nuevas = signal(0);

  listar(estado?: EstadoSolicitud) {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<Solicitud[]>(this.base, { params });
  }

  cambiarEstado(id: string, estado: EstadoSolicitud) {
    return this.http.patch<Solicitud>(`${this.base}/${id}/estado`, { estado });
  }

  eliminar(id: string) {
    return this.http.delete<{ mensaje: string }>(`${this.base}/${id}`);
  }

  refrescarNuevas() {
    this.http.get<{ nuevas: number }>(`${this.base}/nuevas`).subscribe({
      next: (r) => this.nuevas.set(r.nuevas),
      error: () => undefined,
    });
  }
}
