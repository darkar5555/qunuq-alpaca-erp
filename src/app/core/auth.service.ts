import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, Rol, Usuario } from './models';

const TOKEN_KEY = 'qunuq_token';
const USER_KEY = 'qunuq_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Estado reactivo (signals). Se inicializa desde localStorage para
  // mantener la sesión aunque se recargue la página.
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly usuario = signal<Usuario | null>(this.leerUsuario());
  readonly isLoggedIn = computed(() => this.token() !== null);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.access_token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.usuario));
          this.token.set(res.access_token);
          this.usuario.set(res.usuario);
        }),
      );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.usuario.set(null);
    this.router.navigate(['/login']);
  }

  // ¿El usuario tiene alguno de estos roles? (para mostrar/ocultar botones)
  tieneRol(...roles: Rol[]): boolean {
    const rol = this.usuario()?.rol;
    return rol !== undefined && roles.includes(rol);
  }

  private leerUsuario(): Usuario | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as Usuario) : null;
  }
}
