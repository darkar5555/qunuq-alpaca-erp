import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { DashboardResumen, VentaMes } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dashboard`;

  resumen() {
    return this.http.get<DashboardResumen>(`${this.base}/resumen`);
  }

  ventasPorMes(meses = 6) {
    const params = new HttpParams().set('meses', meses);
    return this.http.get<VentaMes[]>(`${this.base}/ventas-por-mes`, { params });
  }
}
