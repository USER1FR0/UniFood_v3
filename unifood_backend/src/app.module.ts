import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfig} from './config/database.config';
import { RecursoModule } from './modules/ejemplo.module';
import { ConfigModule } from '@nestjs/config';
import { authModule } from './modules/auth.module';
import { PrismaModule } from './modules/prisma.module';
import { PedidosModule } from './modules/pedido.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    authModule,
    DatabaseConfig,
    RecursoModule,// Ejemplo de módulo importado
    PrismaModule,
    PedidosModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
