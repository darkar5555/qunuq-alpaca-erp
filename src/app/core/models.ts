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

// Usuario completo que devuelve la API en /usuarios (gestión de cuentas).
export interface UsuarioDetalle {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
}

// Lo que enviamos al crear/editar un usuario.
export interface UsuarioInput {
  nombre: string;
  email: string;
  rol: Rol;
  password?: string; // requerido al crear; en edición, opcional
  activo?: boolean;
}

// Cambio de la propia contraseña (pantalla de perfil).
export interface CambiarPasswordInput {
  passwordActual: string;
  passwordNueva: string;
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
  pagos: Pago[];
  pagado: string; // suma de pagos (calculado por la API)
  saldo: string; // total - pagado (calculado por la API)
}

// ── Pagos ──
export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN';

export interface Pago {
  id: string;
  pedidoId: string | null;
  comprobanteId: string | null;
  monto: string;
  metodo: MetodoPago;
  fecha: string;
}

export interface PagoInput {
  pedidoId: string;
  monto: number;
  metodo: MetodoPago;
  fecha?: string;
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

export interface TarjetaProducto {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string | null;
  orden: number;
  activo: boolean;
}

// ── Inventario / insumos ──
export type TipoMovimiento = 'ENTRADA' | 'SALIDA';

export interface Movimiento {
  id: string;
  insumoId: string;
  tipo: TipoMovimiento;
  cantidad: string;
  referencia: string | null;
  fecha: string;
}

export interface Insumo {
  id: string;
  nombre: string;
  tipo: string; // fibra, hilo, etc.
  unidad: string; // kg, conos, etc.
  stockActual: string;
  stockMinimo: string;
  bajoStock: boolean; // calculado por la API
  createdAt: string;
  updatedAt: string;
  movimientos?: Movimiento[]; // solo en el detalle
}

export interface InsumoInput {
  nombre: string;
  tipo: string;
  unidad: string;
  stockMinimo?: number;
  stockInicial?: number; // solo al crear
}

export interface MovimientoInput {
  tipo: TipoMovimiento;
  cantidad: number;
  referencia?: string;
}

// ── Personal del taller y sus pagos ──
export interface Trabajador {
  id: string;
  nombre: string;
  numeroDocumento: string | null;
  telefono: string | null;
  oficio: string;
  activo: boolean;
  fechaIngreso: string | null;
  notas: string | null;
  createdAt: string;
  _count?: { pagos: number };
  pagos?: PagoPersonal[]; // solo en el detalle
}

export interface TrabajadorInput {
  nombre: string;
  oficio: string;
  numeroDocumento?: string;
  telefono?: string;
  fechaIngreso?: string;
  notas?: string;
  activo?: boolean;
}

export interface PagoPersonal {
  id: string;
  trabajadorId: string;
  pedidoId: string | null;
  monto: string;
  metodo: MetodoPago;
  concepto: string;
  fecha: string;
  trabajador?: { id: string; nombre: string; oficio: string };
  pedido?: { id: string; codigo: string } | null;
}

export interface PagoPersonalInput {
  monto: number;
  metodo: MetodoPago;
  concepto: string;
  fecha?: string;
  pedidoId?: string;
}

export interface ReportePagosPersonal {
  filtros: { desde?: string; hasta?: string; trabajadorId?: string };
  cantidad: number;
  total: string;
  porMetodo: Partial<Record<MetodoPago, string>>;
  porTrabajador: {
    trabajadorId: string;
    nombre: string;
    total: string;
    cantidad: number;
  }[];
  pagos: PagoPersonal[];
}

// ── Gastos y finanzas ──
export type TipoGasto = 'FIJO' | 'VARIABLE';

export interface Gasto {
  id: string;
  fecha: string;
  monto: string;
  metodo: MetodoPago;
  tipo: TipoGasto;
  categoria: string;
  descripcion: string;
  proveedor: string | null;
}

export interface GastoInput {
  monto: number;
  metodo: MetodoPago;
  tipo: TipoGasto;
  categoria: string;
  descripcion: string;
  proveedor?: string;
  fecha?: string;
}

export interface ReporteGastos {
  filtros: { desde?: string; hasta?: string; tipo?: TipoGasto; categoria?: string };
  cantidad: number;
  total: string;
  porTipo: Partial<Record<TipoGasto, string>>;
  porCategoria: { categoria: string; monto: string }[];
  gastos: Gasto[];
}

export interface MesFinanciero {
  mes: string; // YYYY-MM
  ingresos: string;
  gastosFijos: string;
  gastosVariables: string;
  pagosPersonal: string;
  egresos: string;
  utilidad: string;
}

export interface ResumenFinanciero {
  meses: MesFinanciero[];
  totales: Omit<MesFinanciero, 'mes'>;
}

// ── Solicitudes de cotización (bandeja) ──
export type EstadoSolicitud =
  | 'NUEVA'
  | 'ATENDIDA'
  | 'CONVERTIDA'
  | 'DESCARTADA';

export interface Solicitud {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  interes: string | null;
  mensaje: string | null;
  diseno: string | null;
  origen: string;
  estado: EstadoSolicitud;
  createdAt: string;
}
