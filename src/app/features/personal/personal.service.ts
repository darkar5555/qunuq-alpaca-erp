import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  PagoPersonal,
  PagoPersonalInput,
  ReportePagosPersonal,
  Trabajador,
  TrabajadorInput,
} from '../../core/models';

export interface FiltrosReporte {
  desde?: string;
  hasta?: string;
  trabajadorId?: string;
}

@Injectable({ providedIn: 'root' })
export class PersonalService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/personal`;

  listar() {
    return this.http.get<Trabajador[]>(this.base);
  }

  obtener(id: string) {
    return this.http.get<Trabajador>(`${this.base}/${id}`);
  }

  crear(dto: TrabajadorInput) {
    return this.http.post<Trabajador>(this.base, dto);
  }

  actualizar(id: string, dto: Partial<TrabajadorInput>) {
    return this.http.patch<Trabajador>(`${this.base}/${id}`, dto);
  }

  desactivar(id: string) {
    return this.http.delete<Trabajador>(`${this.base}/${id}`);
  }

  registrarPago(trabajadorId: string, dto: PagoPersonalInput) {
    return this.http.post<PagoPersonal>(
      `${this.base}/${trabajadorId}/pagos`,
      dto,
    );
  }

  anularPago(pagoId: string) {
    return this.http.delete<{ mensaje: string }>(
      `${this.base}/pagos/${pagoId}`,
    );
  }

  private paramsReporte(f: FiltrosReporte): HttpParams {
    let params = new HttpParams();
    if (f.desde) params = params.set('desde', f.desde);
    if (f.hasta) params = params.set('hasta', f.hasta);
    if (f.trabajadorId) params = params.set('trabajadorId', f.trabajadorId);
    return params;
  }

  reporte(f: FiltrosReporte) {
    return this.http.get<ReportePagosPersonal>(`${this.base}/reporte`, {
      params: this.paramsReporte(f),
    });
  }

  reportePdf(f: FiltrosReporte) {
    return this.http.get(`${this.base}/reporte/pdf`, {
      params: this.paramsReporte(f),
      responseType: 'blob',
    });
  }
}
