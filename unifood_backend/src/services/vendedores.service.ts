import { Injectable, NotFoundException, Inject, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateVendedorDto, UpdateVendedorDto, Vendedor } from '../models/vendedor.model';
import * as bcrypt from 'bcrypt';

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
    const { 
      correo_electronico, 
      contrasena, 
      nombre, 
      telefono, 
      num_empleado, 
      genero, 
      edad, 
      estatus, 
      email 
    } = createVendedorDto;

    // Verificar si el correo electrónico ya existe en la tabla usuario
    const usuarioExistente = await this.dataSource.query(
      'SELECT id FROM usuario WHERE correo_electronico = $1',
      [correo_electronico]
    );

    if (usuarioExistente.length > 0) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Iniciar transacción para asegurar consistencia
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Crear usuario primero
      const usuarioResult = await queryRunner.query(
        `INSERT INTO usuario (correo_electronico, contrasena, rol) 
         VALUES ($1, $2, $3) RETURNING id`,
        [correo_electronico, hashedPassword, 'vendedor']
      );

      const usuarioId = usuarioResult[0].id;

      // 2. Crear vendedor con el usuario_id del usuario recién creado
      const result = await queryRunner.query(
        `INSERT INTO vendedor 
         (nombre, telefono, usuario_id, num_empleado, genero, edad, email, estatus, fecha_registro) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [nombre, telefono, usuarioId, num_empleado, genero, edad, email, estatus, new Date()]
      );

      await queryRunner.commitTransaction();
      
      return result[0] as Vendedor;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      // Si es error de duplicado, lanzar excepción específica
      if (error.code === '23505') { // Código de violación de unique constraint en PostgreSQL
        throw new ConflictException('El correo electrónico o número de empleado ya está registrado');
      }
      
      throw error;
    } finally {
      await queryRunner.release();
    }
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