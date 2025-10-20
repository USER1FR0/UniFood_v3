export interface Vendedor {
  id: number;
  nombre: string;
  telefono: string;
  usuario_id: number;
  numEmpleado: number;
  genero: string;
  edad: number;
  email: string;
  estatus: boolean;
  fecha_registro: Date;
}

export interface CreateVendedorRequest {
  nombre: string;
  telefono: string;
  usuario_id: number;
  numEmpleado: number;
  genero: string;
  edad: number;
  email: string;
  estatus?: boolean;
}

export interface UpdateVendedorRequest {
  nombre?: string;
  telefono?: string;
  usuario_id?: number;
  numEmpleado?: number;
  genero?: string;
  edad?: number;
  email?: string;
  estatus?: boolean;
}

export interface VendedoresResponse {
  success: boolean;
  data: Vendedor[];
  message?: string;
}

export interface VendedorResponse {
  success: boolean;
  data: Vendedor;
  message?: string;
}