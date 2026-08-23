import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Insumo, InsumoInput, MovimientoInput } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class InsumosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/insumos`;

  listar() {
    return this.http.get<Insumo[]>(this.base);
  }

  obtener(id: string) {
    return this.http.get<Insumo>(`${this.base}/${id}`);
  }

  crear(dto: InsumoInput) {
    return this.http.post<Insumo>(this.base, dto);
  }

  actualizar(id: string, dto: Partial<InsumoInput>) {
    return this.http.patch<Insumo>(`${this.base}/${id}`, dto);
  }

  eliminar(id: string) {
    return this.http.delete<{ mensaje: string }>(`${this.base}/${id}`);
  }

  registrarMovimiento(id: string, dto: MovimientoInput) {
    return this.http.post<Insumo>(`${this.base}/${id}/movimientos`, dto);
  }
}
