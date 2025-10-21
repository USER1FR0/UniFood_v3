import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../services/gemini.service';
import { PrismaService } from '../services/prisma.service';
import { CacheService } from '../services/cache.service';
import { ChatController } from '../controllers/chat.controller';
import { ChatGateway } from '../gateways/chat.gateway';
import { JwtAuthGuard } from '../middlewares/auth.middleware';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [
    GeminiService,
    PrismaService,
    CacheService,
    ChatGateway,
    JwtAuthGuard,
  ],
  controllers: [ChatController],
  exports: [GeminiService],
})
export class ChatModule {}
