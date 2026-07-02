import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Color, Fibra, Tecnica, TipoCatalogo } from '../../core/models';

// Lo que se envía al crear/editar un ítem de catálogo.
export interface CatalogoInput {
  nombre: string;
  hex?: string;
  activo?: boolean;
}

// tipo interno → segmento de la URL de la API
const RUTA: Record<TipoCatalogo, string> = {
  fibra: 'fibras',
  color: 'colores',
  tecnica: 'tecnicas',
};

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/catalogos`;

  fibras() {
    return this.http.get<Fibra[]>(`${this.base}/fibras`);
  }
  colores() {
    return this.http.get<Color[]>(`${this.base}/colores`);
  }
  tecnicas() {
    return this.http.get<Tecnica[]>(`${this.base}/tecnicas`);
  }

  crear(tipo: TipoCatalogo, dto: CatalogoInput) {
    return this.http.post(`${this.base}/${RUTA[tipo]}`, dto);
  }

  actualizar(tipo: TipoCatalogo, id: string, dto: Partial<CatalogoInput>) {
    return this.http.patch(`${this.base}/${RUTA[tipo]}/${id}`, dto);
  }

  // Baja lógica en el backend (deja activo = false).
  desactivar(tipo: TipoCatalogo, id: string) {
    return this.http.delete(`${this.base}/${RUTA[tipo]}/${id}`);
  }
}
