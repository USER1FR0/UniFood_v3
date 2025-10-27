import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { CategoriaService } from '../services/categoria.service';
import { CreateCategoriaDto, UpdateCategoriaDto } from '../models/categoria.model';

@Controller('categorias')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Get()
  async findAll() {
    return await this.categoriaService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.categoriaService.findOne(id);
  }

  @Post()
  async create(@Body() createCategoriaDto: CreateCategoriaDto) {
    return await this.categoriaService.create(createCategoriaDto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() updateCategoriaDto: UpdateCategoriaDto) {
    return await this.categoriaService.update(id, updateCategoriaDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.categoriaService.remove(id);
  }
}