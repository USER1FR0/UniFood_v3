export interface LoginRequest {
  correo_electronico: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface Usuario {
  id: number;
  id_rol: number | null;  // ← Agregar esta línea
  correo: string;
  rol: 'supervisor' | 'vendedor' | 'cliente';
}