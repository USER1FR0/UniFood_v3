export interface Vendedor {
  id: number;
  nombre: string;
  telefono: string;
  usuario_id: number;
  num_empleado: number;  // Cambiado de numEmpleado
  genero: string;
  edad: number;
  email: string;
  estatus: string;       // Cambiado de boolean a string
  fecha_registro: Date;
}

// Para crear - usar snake_case
export interface CreateVendedorRequest {
  nombre: string;
  telefono: string;
  usuario_id: number;
  num_empleado: number;  // Cambiado
  genero: string;
  edad: number;
  email: string;
  estatus: string;       // Cambiado
}

// Para actualizar
export interface UpdateVendedorRequest {
  nombre?: string;
  telefono?: string;
  usuario_id?: number;
  num_empleado?: number; // Cambiado
  genero?: string;
  edad?: number;
  email?: string;
  estatus?: string;      // Cambiado
}

