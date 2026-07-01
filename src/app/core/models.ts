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

export type TipoDocumento = 'DNI' | 'RUC';

export interface Cliente {
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombreORazonSocial: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  createdAt: string;
  updatedAt: string;
}

// Lo que enviamos al crear/editar un cliente.
export interface ClienteInput {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombreORazonSocial: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}
