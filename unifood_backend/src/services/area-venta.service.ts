import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateAreaVentaDto, UpdateAreaVentaDto, AreaVenta } from '../models/area-venta.model';

@Injectable()
export class AreaVentaService {
  constructor(
    @Inject(DataSource)
    private dataSource: DataSource,
  ) {}

  async findAll(): Promise<AreaVenta[]> {
    const result = await this.dataSource.query('SELECT * FROM area_venta');
    return result as AreaVenta[];
  }

  async findOne(id: number): Promise<AreaVenta> {
    const result = await this.dataSource.query(
      'SELECT * FROM area_venta WHERE id = $1',
      [id]
    );
    
    if (result.length === 0) {
      throw new NotFoundException(`Área de venta con ID ${id} no encontrada`);
    }
    return result[0] as AreaVenta;
  }

  async create(createAreaVentaDto: CreateAreaVentaDto): Promise<AreaVenta> {
    const { area_venta, descripcion, status, horario_apertura, horario_cierre } = createAreaVentaDto;
    
    const result = await this.dataSource.query(
      `INSERT INTO area_venta 
       (area_venta, descripcion, status, horario_apertura, horario_cierre) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [area_venta, descripcion, status ?? true, horario_apertura, horario_cierre]
    );
    
    return result[0] as AreaVenta;
  }

  async update(id: number, updateAreaVentaDto: UpdateAreaVentaDto): Promise<AreaVenta> {
    await this.findOne(id);
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (updateAreaVentaDto.area_venta !== undefined) {
      fields.push(`area_venta = $${paramCount}`);
      values.push(updateAreaVentaDto.area_venta);
      paramCount++;
    }
    
    if (updateAreaVentaDto.descripcion !== undefined) {
      fields.push(`descripcion = $${paramCount}`);
      values.push(updateAreaVentaDto.descripcion);
      paramCount++;
    }
    
    if (updateAreaVentaDto.status !== undefined) {
      fields.push(`status = $${paramCount}`);
      values.push(updateAreaVentaDto.status);
      paramCount++;
    }
    
    if (updateAreaVentaDto.horario_apertura !== undefined) {
      fields.push(`horario_apertura = $${paramCount}`);
      values.push(updateAreaVentaDto.horario_apertura);
      paramCount++;
    }
    
    if (updateAreaVentaDto.horario_cierre !== undefined) {
      fields.push(`horario_cierre = $${paramCount}`);
      values.push(updateAreaVentaDto.horario_cierre);
      paramCount++;
    }
    
    if (fields.length === 0) {
      return await this.findOne(id);
    }
    
    values.push(id);
    const query = `UPDATE area_venta SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await this.dataSource.query(query, values);
    return result[0] as AreaVenta;
  }

  async remove(id: number): Promise<void> {
    const result = await this.dataSource.query(
      'DELETE FROM area_venta WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.length === 0) {
      throw new NotFoundException(`Área de venta con ID ${id} no encontrada`);
    }
  }
}