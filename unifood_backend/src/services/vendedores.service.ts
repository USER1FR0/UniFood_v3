import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateVendedorDto, UpdateVendedorDto, Vendedor } from '../models/vendedor.model';

@Injectable()
export class VendedoresService {
  constructor(
    @Inject(DataSource)
    private dataSource: DataSource,
  ) {}

  async findAll(): Promise<Vendedor[]> {
    const result = await this.dataSource.query('SELECT * FROM vendedor');
    return result as Vendedor[];
  }

  async findOne(id: number): Promise<Vendedor> {
    const result = await this.dataSource.query(
      'SELECT * FROM vendedor WHERE id = $1', 
      [id]
    );
    
    if (result.length === 0) {
      throw new NotFoundException(`Vendedor con ID ${id} no encontrado`);
    }
    return result[0] as Vendedor;
  }

  async create(createVendedorDto: CreateVendedorDto): Promise<Vendedor> {
    const { nombre, telefono, usuario_id, num_empleado, genero, edad,estatus, email } = createVendedorDto;
    //const estatus = createVendedorDto.estatus ?? true;
    
    const result = await this.dataSource.query(
      `INSERT INTO vendedor 
       (nombre, telefono, usuario_id, num_empleado, genero, edad, email, estatus, fecha_registro) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [nombre, telefono, usuario_id, num_empleado, genero, edad, email, estatus, new Date()]
    );
    
    return result[0] as Vendedor;
  }

  async update(id: number, updateVendedorDto: UpdateVendedorDto): Promise<Vendedor> {
    // Verificar que existe primero
    await this.findOne(id);
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    // Manejar las propiedades de forma segura
    if (updateVendedorDto.nombre !== undefined) {
      fields.push(`nombre = $${paramCount}`);
      values.push(updateVendedorDto.nombre);
      paramCount++;
    }
    
    if (updateVendedorDto.telefono !== undefined) {
      fields.push(`telefono = $${paramCount}`);
      values.push(updateVendedorDto.telefono);
      paramCount++;
    }
    
    if (updateVendedorDto.usuario_id !== undefined) {
      fields.push(`usuario_id = $${paramCount}`);
      values.push(updateVendedorDto.usuario_id);
      paramCount++;
    }
    
    if (updateVendedorDto.num_empleado !== undefined) {
      fields.push(`num_empleado = $${paramCount}`);
      values.push(updateVendedorDto.num_empleado);
      paramCount++;
    }
    
    if (updateVendedorDto.genero !== undefined) {
      fields.push(`genero = $${paramCount}`);
      values.push(updateVendedorDto.genero);
      paramCount++;
    }
    
    if (updateVendedorDto.edad !== undefined) {
      fields.push(`edad = $${paramCount}`);
      values.push(updateVendedorDto.edad);
      paramCount++;
    }
    
    if (updateVendedorDto.email !== undefined) {
      fields.push(`email = $${paramCount}`);
      values.push(updateVendedorDto.email);
      paramCount++;
    }
    
    if (updateVendedorDto.estatus !== undefined) {
      fields.push(`estatus = $${paramCount}`);
      values.push(updateVendedorDto.estatus);
      paramCount++;
    }
    
    if (fields.length === 0) {
      return await this.findOne(id);
    }
    
    values.push(id);
    const query = `UPDATE vendedor SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await this.dataSource.query(query, values);
    return result[0] as Vendedor;
  }

  async remove(id: number): Promise<void> {
    const result = await this.dataSource.query(
      'DELETE FROM vendedor WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.length === 0) {
      throw new NotFoundException(`Vendedor con ID ${id} no encontrado`);
    }
  }
}