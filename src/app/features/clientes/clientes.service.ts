import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Cliente, ClienteInput } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/clientes`;

  listar() {
    return this.http.get<Cliente[]>(this.base);
  }

  crear(dto: ClienteInput) {
    return this.http.post<Cliente>(this.base, dto);
  }

  actualizar(id: string, dto: Partial<ClienteInput>) {
    return this.http.patch<Cliente>(`${this.base}/${id}`, dto);
  }

  eliminar(id: string) {
    return this.http.delete<{ mensaje: string }>(`${this.base}/${id}`);
  }
}
