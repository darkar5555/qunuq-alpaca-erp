import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CambiarPasswordInput } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private http = inject(HttpClient);

  cambiarPassword(dto: CambiarPasswordInput) {
    return this.http.patch<{ mensaje: string }>(
      `${environment.apiUrl}/auth/me/password`,
      dto,
    );
  }
}
