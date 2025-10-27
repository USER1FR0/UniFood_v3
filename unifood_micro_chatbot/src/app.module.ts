import { Module } from '@nestjs/common';
import { ChatbotController } from './controllers/chatbot.controller';
import { ChatbotService } from './services/chatbot.service';
import { AnalyticsService } from './services/analytics.service';
import { RecomendacionesService } from './services/recomendaciones.service';
import { DatabaseService } from './services/database.service';

/**
 * Módulo principal del microservicio de Chatbot
 * Configura todos los servicios y controladores necesarios
 */
@Module({
  imports: [],
  controllers: [ChatbotController],
  providers: [
    DatabaseService,
    AnalyticsService,
    RecomendacionesService,
    ChatbotService,
  ],
})
export class AppModule {}

