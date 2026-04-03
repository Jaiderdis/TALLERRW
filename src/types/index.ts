export interface Tecnico {
  id: number;
  nombre: string;
  telefono: string;
  activo: boolean;
}

export interface Empresa {
  id: number;
  nombre: string;
  nit: string;
  telefono: string;
  email: string;
  contactoNombre: string;
  contactoTelefono: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string;
  email: string;
  tipo: string;
  empresa?: Empresa;
}

export interface PlanRevision {
  id: number;
  numero: number;
  estado: string;
  fechaProgramada: string | null;
  fechaCompletada: string | null;
  tieneFicha: boolean;
  ficha?: FichaRevision;
}

export interface FichaRevision {
  id: number;
  fecha: string;
  presionAlta: number;
  presionBaja: number;
  tempSalida: number;
  gasTipo: string;
  gasCantidad: number | null;
  notas: string;
  tecnico: string;
  componentes: ComponenteRevision[];
}

export interface ComponenteRevision {
  componente: string;
  estado: string;
  observacion: string;
}

export interface Vehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  cliente: Cliente;
  empresa?: Empresa;
  planesRevision: PlanRevision[];
  totalVisitas: number;
  ultimaVisita: string | null;
}

export interface DetalleOrden {
  id: number;
  servicio: string;
  precio: number;
  notas: string;
}

export interface Orden {
  id: number;
  estado: string;
  prioridad: string;
  kmIngreso: number;
  observaciones: string;
  fechaIngreso: string;
  fechaSalida: string | null;
  vehiculo: Vehiculo;
  tecnico: Tecnico;
  cliente: Cliente;
  empresa?: Empresa;
  detalles: DetalleOrden[];
}

export interface CatalogoServicio {
  id: number;
  nombre: string;
  descripcion: string;
  precioBase: number;
  generaPlanRevision: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}