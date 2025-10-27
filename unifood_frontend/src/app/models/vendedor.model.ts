export interface Vendedor {
  id: number;
  nombre: string;
  telefono: string;
  usuario_id: number;
  num_empleado: number;
  genero: string;
  edad: number;
  email: string;
  estatus: string;
  fecha_registro: Date;
  usuario?: {
    id: number;
    correo_electronico: string;
    rol: string;
  };
}

// Para crear - ahora incluye campos de usuario
export interface CreateVendedorRequest {
  // Campos de usuario
  correo_electronico: string;
  contrasena: string;

  // Campos de vendedor
  nombre: string;
  telefono: string;
  num_empleado: number;
  genero: string;
  edad: number;
  email: string;
  estatus?: string;
}

// Para actualizar
export interface UpdateVendedorRequest {
  nombre?: string;
  telefono?: string;
  usuario_id?: number;
  num_empleado?: number;
  genero?: string;
  edad?: number;
  email?: string;
  estatus?: string;
}