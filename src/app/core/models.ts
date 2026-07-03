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

// ── Pedidos ──
export type EstadoPedido =
  | 'COTIZACION'
  | 'MUESTRA'
  | 'PRODUCCION'
  | 'ENTREGADO';

export interface PedidoItem {
  id: string;
  cantidad: string;
  precioUnitario: string;
  subtotal: string;
  producto: Producto;
  fibra: Fibra | null;
  color: Color | null;
  tecnica: Tecnica | null;
}

export interface Pedido {
  id: string;
  codigo: string;
  clienteId: string;
  fecha: string;
  estado: EstadoPedido;
  subtotal: string;
  igv: string;
  total: string;
  notas: string | null;
  cliente: Cliente;
  items: PedidoItem[];
}

export interface PedidoItemInput {
  productoId: string;
  fibraId?: string;
  colorId?: string;
  tecnicaId?: string;
  cantidad: number;
  precioUnitario?: number;
}

export interface PedidoInput {
  clienteId: string;
  notas?: string;
  items: PedidoItemInput[];
}

// ── Dashboard ──
export interface PedidoReciente {
  id: string;
  codigo: string;
  cliente: string;
  estado: EstadoPedido;
  total: string;
  fecha: string;
}

export interface DashboardResumen {
  totalClientes: number;
  productosActivos: number;
  pedidosPorEstado: Record<EstadoPedido, number>;
  ventasDelMes: { cantidad: number; monto: string };
  pedidosRecientes: PedidoReciente[];
}

export interface VentaMes {
  mes: string;
  monto: string;
}

// ── Contenido del sitio (CMS de la landing) ──
export interface ContenidoSitio {
  id: string;
  clave: string;
  valor: string;
  grupo: string;
  etiqueta: string;
  tipo: string; // texto | multilinea | url
  orden: number;
}

export interface ImagenSitio {
  id: string;
  seccion: string;
  url: string;
  titulo: string | null;
  orden: number;
  activo: boolean;
}
