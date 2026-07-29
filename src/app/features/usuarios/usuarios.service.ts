import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { UsuarioDetalle, UsuarioInput } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/usuarios`;

  listar() {
    return this.http.get<UsuarioDetalle[]>(this.base);
  }

  crear(dto: UsuarioInput) {
    return this.http.post<UsuarioDetalle>(this.base, dto);
  }

  actualizar(id: string, dto: Partial<UsuarioInput>) {
    return this.http.patch<UsuarioDetalle>(`${this.base}/${id}`, dto);
  }

  // Baja lógica (la API pone activo=false).
  desactivar(id: string) {
    return this.http.delete<UsuarioDetalle>(`${this.base}/${id}`);
  }
}
