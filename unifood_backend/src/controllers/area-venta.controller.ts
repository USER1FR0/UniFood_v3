import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { AreaVentaService } from '../services/area-venta.service';
import { CreateAreaVentaDto, UpdateAreaVentaDto } from '../models/area-venta.model';

@Controller('area-venta')
export class AreaVentaController {
  constructor(private readonly areaVentaService: AreaVentaService) {}

  @Get()
  async findAll() {
    return await this.areaVentaService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.areaVentaService.findOne(id);
  }

  @Post()
  async create(@Body() createAreaVentaDto: CreateAreaVentaDto) {
    return await this.areaVentaService.create(createAreaVentaDto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() updateAreaVentaDto: UpdateAreaVentaDto) {
    return await this.areaVentaService.update(id, updateAreaVentaDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.areaVentaService.remove(id);
  }
}