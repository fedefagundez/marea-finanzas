export interface Usuario {
  id: string;
  username: string;
  email: string;
  rol: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  usuario: Usuario;
}

export interface Hogar {
  id: string;
  nombre: string;
  createdAt: string;
  tokenInvitacion?: string;
  miembros?: Miembro[];
  tarjetas?: TarjetaResumen[];
}

export interface Miembro {
  id: string;
  rol: 'ADMIN' | 'MIEMBRO';
  joinedAt?: string;
  usuario: Pick<Usuario, 'id' | 'username'> & Partial<Pick<Usuario, 'email'>>;
}

export interface TarjetaCredito {
  id: string;
  nombre: string;
  ultimo4: string;
  diaCierre?: number;
  hogarId: string;
}

export interface TarjetaResumen {
  id: string;
  nombre: string;
  ultimo4: string;
  diaCierre?: number;
}

export interface Ingreso {
  id: string;
  descripcion: string;
  monto: number;
  tipo: 'RECURRENTE' | 'PUNTUAL' | 'INDEFINIDO';
  fechaInicio?: string;
  fechaFin?: string;
  hogarId: string;
  usuarioId: string;
  createdAt: string;
}

export interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  tipo: 'RECURRENTE' | 'PUNTUAL' | 'INDEFINIDO';
  fechaInicio?: string;
  cuotasTotales?: number;
  cuotasPagadas: number;
  tarjetaId?: string;
  tarjeta?: TarjetaResumen;
  categoriaId?: string;
  categoria?: Pick<Categoria, 'id' | 'nombre' | 'icon'>;
  hogarId: string;
  usuarioId: string;
  createdAt: string;
}

export interface Dashboard {
  mes: string;
  totalIngresos: number;
  totalGastos: number;
  balance: number;
}

export interface Evolucion {
  mes: string;
  label: string;
  ingresos: number;
  gastos: number;
  balance: number;
}

export interface Proyeccion extends Evolucion {}

export interface BalanceMes {
  mes: string;
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  tipo: 'REAL' | 'PROYECTADO';
}

export interface Categoria {
  id: string;
  nombre: string;
  icon: string;
  createdAt: string;
  hogarId?: string | null;
  usuarioId?: string | null;
}

export interface DistribucionGasto {
  categoriaId: string | null;
  nombre: string;
  icon: string;
  total: number;
  porcentaje: number;
}

export interface EvolucionItem {
  mes: string;
  label: string;
  ingresos: number;
  gastos: number;
  balance: number;
  tipo: 'REAL' | 'PROYECTADO';
}

export interface MovimientoReciente {
  id: string;
  tipo: 'INGRESO' | 'GASTO';
  descripcion: string;
  monto: number;
  fecha: string;
  fechaCreacion: string;
}

export interface Meta {
  id: string;
  hogarId: string;
  nombre: string;
  montoObjetivo: number;
  montoActual: number;
  fechaLimite: string;
  cuotaMensual: number | null;
  gastoId: string | null;
  createdAt: string;
}
