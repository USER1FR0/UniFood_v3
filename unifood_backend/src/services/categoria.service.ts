import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateCategoriaDto, UpdateCategoriaDto, Categoria } from '../models/categoria.model';

@Injectable()
export class CategoriaService {
  constructor(
    @Inject(DataSource)
    private dataSource: DataSource,
  ) {}

  async findAll(): Promise<Categoria[]> {
    const result = await this.dataSource.query('SELECT * FROM categoria');
    return result as Categoria[];
  }

  async findOne(id: number): Promise<Categoria> {
    const result = await this.dataSource.query(
      'SELECT * FROM categoria WHERE id = $1',
      [id]
    );
    
    if (result.length === 0) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    return result[0] as Categoria;
  }

  async create(createCategoriaDto: CreateCategoriaDto): Promise<Categoria> {
    const { nombre, descripcion, status } = createCategoriaDto;
    
    const result = await this.dataSource.query(
      `INSERT INTO categoria 
       (nombre, descripcion, status) 
       VALUES ($1, $2, $3) RETURNING *`,
      [nombre, descripcion, status ?? true]
    );
    
    return result[0] as Categoria;
  }

  async update(id: number, updateCategoriaDto: UpdateCategoriaDto): Promise<Categoria> {
    await this.findOne(id);
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (updateCategoriaDto.nombre !== undefined) {
      fields.push(`nombre = $${paramCount}`);
      values.push(updateCategoriaDto.nombre);
      paramCount++;
    }
    
    if (updateCategoriaDto.descripcion !== undefined) {
      fields.push(`descripcion = $${paramCount}`);
      values.push(updateCategoriaDto.descripcion);
      paramCount++;
    }
    
    if (updateCategoriaDto.status !== undefined) {
      fields.push(`status = $${paramCount}`);
      values.push(updateCategoriaDto.status);
      paramCount++;
    }
    
    if (fields.length === 0) {
      return await this.findOne(id);
    }
    
    values.push(id);
    const query = `UPDATE categoria SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await this.dataSource.query(query, values);
    return result[0] as Categoria;
  }

  async remove(id: number): Promise<void> {
    const result = await this.dataSource.query(
      'DELETE FROM categoria WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.length === 0) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
  }
}