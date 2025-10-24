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
  id_rol: number | null;
  correo: string;
  rol: string;
  nombre_completo?: string;
  telefono?: string;
  area_venta_id?: number;
  area_venta: {
    id: number;
    area_venta: string;
  };
}

export interface JwtPayload {
  id: number;
  id_rol: number | null;
  correo: string;
  rol: 'cliente' | 'vendedor';
}
