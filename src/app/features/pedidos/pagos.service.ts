import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Pago, PagoInput } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/pagos`;

  listar(pedidoId: string) {
    return this.http.get<Pago[]>(this.base, {
      params: new HttpParams().set('pedidoId', pedidoId),
    });
  }

  crear(dto: PagoInput) {
    return this.http.post<Pago>(this.base, dto);
  }

  eliminar(id: string) {
    return this.http.delete<{ mensaje: string }>(`${this.base}/${id}`);
  }
}
