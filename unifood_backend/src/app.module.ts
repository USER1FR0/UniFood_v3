import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfig} from './config/database.config';
import { RecursoModule } from './modules/ejemplo.module';

@Module({
  imports: [
    DatabaseConfig,
    RecursoModule // Ejemplo de módulo importado
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
