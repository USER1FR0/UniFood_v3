import { Module } from '@nestjs/common';
import { ProductoService } from '../services/producto.service';
import { ProductoController } from '../controllers/producto.controller';

@Module({
  controllers: [ProductoController],
  providers: [ProductoService],
})
export class ProductoModule {}