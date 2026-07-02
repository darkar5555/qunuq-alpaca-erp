import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Producto, ProductoInput } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/productos`;

  listar() {
    return this.http.get<Producto[]>(this.base);
  }

  crear(dto: ProductoInput) {
    return this.http.post<Producto>(this.base, dto);
  }

  actualizar(id: string, dto: Partial<ProductoInput>) {
    return this.http.patch<Producto>(`${this.base}/${id}`, dto);
  }

  // Baja lógica en el backend (deja activo = false).
  desactivar(id: string) {
    return this.http.delete<Producto>(`${this.base}/${id}`);
  }
}
