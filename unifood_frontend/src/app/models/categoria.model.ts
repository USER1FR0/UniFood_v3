export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  status: boolean;
  fecha_registro: Date;
}

export interface CreateCategoriaRequest {
  nombre: string;
  descripcion?: string;
  status?: boolean;
}

export interface UpdateCategoriaRequest {
  nombre?: string;
  descripcion?: string;
  status?: boolean;
}