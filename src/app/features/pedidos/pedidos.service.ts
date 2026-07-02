import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { EstadoPedido, Pedido, PedidoInput } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/pedidos`;

  listar(estado?: EstadoPedido) {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<Pedido[]>(this.base, { params });
  }

  obtener(id: string) {
    return this.http.get<Pedido>(`${this.base}/${id}`);
  }

  crear(dto: PedidoInput) {
    return this.http.post<Pedido>(this.base, dto);
  }

  cambiarEstado(id: string, estado: EstadoPedido) {
    return this.http.patch<Pedido>(`${this.base}/${id}/estado`, { estado });
  }

  eliminar(id: string) {
    return this.http.delete<{ mensaje: string }>(`${this.base}/${id}`);
  }
}
