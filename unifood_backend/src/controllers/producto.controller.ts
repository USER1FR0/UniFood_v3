import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ProductoService } from '../services/producto.service';
import { CreateProductoDto, UpdateProductoDto } from '../models/producto.model';

@Controller('productos')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Get()
  async findAll() {
    return await this.productoService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.productoService.findOne(id);
  }

  @Post()
  async create(@Body() createProductoDto: CreateProductoDto) {
    return await this.productoService.create(createProductoDto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() updateProductoDto: UpdateProductoDto) {
    return await this.productoService.update(id, updateProductoDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.productoService.remove(id);
  }
}