export interface AreaVenta {
  id: number;
  area_venta: string;
  descripcion: string;
  status: boolean;
  horario_apertura: string;
  horario_cierre: string;
  fecha_registro: Date;
}

export interface CreateAreaVentaRequest {
  area_venta: string;
  descripcion?: string;
  status?: boolean;
  horario_apertura?: string;
  horario_cierre?: string;
}

export interface UpdateAreaVentaRequest {
  area_venta?: string;
  descripcion?: string;
  status?: boolean;
  horario_apertura?: string;
  horario_cierre?: string;
}
