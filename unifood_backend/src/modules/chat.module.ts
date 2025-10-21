import { Module } from '@nestjs/common';
import { GeminiService } from '../services/gemini.service';
import { PrismaService } from '../services/prisma.service';
import { CacheService } from '../services/cache.service';
import { ChatController } from '../controllers/chat.controller';
import { ChatGateway } from '../gateways/chat.gateway';

@Module({
  providers: [
    GeminiService,
    PrismaService,
    CacheService,
    ChatGateway,
  ],
  controllers: [ChatController],
  exports: [GeminiService],
})
export class ChatModule {}
