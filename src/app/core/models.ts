// Tipos compartidos que reflejan las respuestas de la API.

export type Rol = 'ADMIN' | 'VENTAS' | 'PRODUCCION';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface LoginResponse {
  access_token: string;
  usuario: Usuario;
}
