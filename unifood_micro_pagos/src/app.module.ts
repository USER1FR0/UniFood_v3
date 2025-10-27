import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PagosController } from './controllers/pago.controller'; 
import { PagosService } from './services/pago.service'; 
import { DatabaseModule } from './modules/database.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule, 
  ],
  controllers: [PagosController],
  providers: [PagosService],
})
export class AppModule {}