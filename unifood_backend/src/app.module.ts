import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfig} from './config/database.config';
import { RecursoModule } from './modules/ejemplo.module';
import { VendedoresModule } from './modules/vendedores.module';
import { ConfigModule } from '@nestjs/config';
import { authModule } from './modules/auth.module';
import { PrismaModule } from './modules/prisma.module';
import { ChatModule } from './modules/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    authModule,
    DatabaseConfig,
    RecursoModule, // Ejemplo de módulo importado
    VendedoresModule,
    PrismaModule,
    ChatModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
