import { Module } from '@nestjs/common';
import { RecomendacionController } from '../controllers/recomendacion.controller';
import { RecomendacionService } from '../services/recomendacion.service';
import { PrismaService } from '../services/prisma.service';

@Module({
  controllers: [RecomendacionController],
  providers: [RecomendacionService, PrismaService],
  exports: [RecomendacionService],
})
export class RecomendacionModule {}

