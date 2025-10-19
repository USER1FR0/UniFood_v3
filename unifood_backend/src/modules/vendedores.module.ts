import { Module } from '@nestjs/common';
import { VendedoresService } from '../services/vendedores.service';
import { VendedoresController } from '../controllers/vendedores.controller';
import { TypeOrmModule } from '@nestjs/typeorm/dist';

@Module({
    
    // imports: [TypeOrmModule.forFeature([])], 
  controllers: [VendedoresController],
  providers: [VendedoresService],
})
export class VendedoresModule {}