import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  Gasto,
  GastoInput,
  ReporteGastos,
  ResumenFinanciero,
  TipoGasto,
} from '../../core/models';

export interface FiltrosGastos {
  desde?: string;
  hasta?: string;
  tipo?: TipoGasto;
  categoria?: string;
}

@Injectable({ providedIn: 'root' })
export class FinanzasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/gastos`;

  private params(f: FiltrosGastos): HttpParams {
    let params = new HttpParams();
    if (f.desde) params = params.set('desde', f.desde);
    if (f.hasta) params = params.set('hasta', f.hasta);
    if (f.tipo) params = params.set('tipo', f.tipo);
    if (f.categoria) params = params.set('categoria', f.categoria);
    return params;
  }

  listar(f: FiltrosGastos) {
    return this.http.get<ReporteGastos>(this.base, { params: this.params(f) });
  }

  crear(dto: GastoInput) {
    return this.http.post<Gasto>(this.base, dto);
  }

  actualizar(id: string, dto: Partial<GastoInput>) {
    return this.http.patch<Gasto>(`${this.base}/${id}`, dto);
  }

  eliminar(id: string) {
    return this.http.delete<{ mensaje: string }>(`${this.base}/${id}`);
  }

  reportePdf(f: FiltrosGastos) {
    return this.http.get(`${this.base}/reporte/pdf`, {
      params: this.params(f),
      responseType: 'blob',
    });
  }

  resumen(meses = 6) {
    return this.http.get<ResumenFinanciero>(`${this.base}/resumen`, {
      params: new HttpParams().set('meses', meses),
    });
  }
}
