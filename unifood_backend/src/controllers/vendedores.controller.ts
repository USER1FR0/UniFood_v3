import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { VendedoresService } from '../services/vendedores.service';
import { CreateVendedorDto, UpdateVendedorDto } from '../models/vendedor.model';

@Controller('vendedores') // esta linea define la ruta base para este controlador
export class VendedoresController {
  constructor(private readonly vendedoresService: VendedoresService) {}

  @Get()
  async findAll() {
    return await this.vendedoresService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.vendedoresService.findOne(id);
  }

  @Post()
  async create(@Body() createVendedorDto: CreateVendedorDto) {
    return await this.vendedoresService.create(createVendedorDto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() updateVendedorDto: UpdateVendedorDto) {
    return await this.vendedoresService.update(id, updateVendedorDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.vendedoresService.remove(id);
  }
}