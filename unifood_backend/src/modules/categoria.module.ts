import { Module } from '@nestjs/common';
import { CategoriaService } from '../services/categoria.service';
import { CategoriaController } from '../controllers/categoria.controller';

@Module({
  controllers: [CategoriaController],
  providers: [CategoriaService],
})
export class CategoriaModule {}