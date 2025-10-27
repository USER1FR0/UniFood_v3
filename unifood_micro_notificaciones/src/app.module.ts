import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ComunicacionController } from './controllers/comunicacion.controller';
import { ComunicacionService } from './services/comunicacion.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [ComunicacionController],
  providers: [ComunicacionService],
})
export class AppModule {}