import { Module } from '@nestjs/common';
import { AreaVentaService } from '../services/area-venta.service';
import { AreaVentaController } from '../controllers/area-venta.controller';

@Module({
  controllers: [AreaVentaController],
  providers: [AreaVentaService],
})
export class AreaVentaModule {}