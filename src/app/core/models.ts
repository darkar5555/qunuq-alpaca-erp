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

// ── Productos ──
export type CategoriaProducto = 'tela' | 'punto' | 'accesorio' | 'hogar';

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string | null;
  precioBase: string; // Decimal serializado como texto por la API
  unidad: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductoInput {
  nombre: string;
  categoria: string;
  descripcion?: string;
  precioBase: number;
  unidad: string;
  activo?: boolean;
}

// ── Catálogos (configurador "Diseña tu tejido") ──
export interface Fibra {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Tecnica {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Color {
  id: string;
  nombre: string;
  hex: string | null;
  activo: boolean;
}

export type TipoCatalogo = 'fibra' | 'color' | 'tecnica';
