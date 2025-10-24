import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  HttpStatus,
  HttpException,
  HttpCode,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { GeminiService } from '../services/gemini.service';
import {
  ChatMessageDto,
  ChatResponseDto,
  ChatHistoryDto,
} from '../models/chat.model';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly geminiService: GeminiService) {}

  @Post('message')
  async sendMessage(
    @Body() chatMessageDto: ChatMessageDto,
    @Request() req: any,
  ): Promise<ChatResponseDto> {
    const userId = req.user?.id ?? 1;

    const sanitizedMessage = chatMessageDto.mensaje?.trim();
    if (!sanitizedMessage) {
      throw new BadRequestException('mensaje must not be empty');
    }

    this.logger.log(
      JSON.stringify({
        event: 'chat.message.received',
        userId,
        sessionId: chatMessageDto.sessionId,
      }),
    );

    try {
      const response = await this.geminiService.generateRecommendation(
        { ...chatMessageDto, mensaje: sanitizedMessage },
        userId,
      );

      this.logger.log(
        JSON.stringify({
          event: 'chat.message.responded',
          userId,
          sessionId: response.sessionId,
          hasRecommendations: Boolean(
            response.recomendaciones && response.recomendaciones.length,
          ),
        }),
      );

      return response;
    } catch (error: any) {
      this.logger.error(
        `Error processing chat message: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Error processing chat message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history')
  async getChatHistory(@Request() req: any): Promise<ChatHistoryDto[]> {
    const userId = req.user?.id ?? 1;

    try {
      const history = await this.geminiService.getChatHistory(userId);

      this.logger.log(
        JSON.stringify({
          event: 'chat.history.retrieved',
          userId,
          items: history.length,
        }),
      );

      return history;
    } catch (error: any) {
      this.logger.error(
        `Error getting chat history: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Error retrieving chat history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history/:sessionId')
  async getChatHistoryBySession(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ): Promise<ChatHistoryDto[]> {
    const userId = req.user?.id ?? 1;

    try {
      const history = await this.geminiService.getChatHistory(userId, sessionId);

      this.logger.log(
        JSON.stringify({
          event: 'chat.history.retrievedBySession',
          userId,
          sessionId,
          items: history.length,
        }),
      );

      return history;
    } catch (error: any) {
      this.logger.error(
        `Error getting chat history by session: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Error retrieving chat history by session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('clear-history')
  @HttpCode(HttpStatus.OK)
  async clearChatHistory(@Request() req: any): Promise<{ message: string }> {
    const userId = req.user?.id ?? 1;

    try {
      const deleted = await this.geminiService.clearChatHistory(userId);

      this.logger.log(
        JSON.stringify({
          event: 'chat.history.cleared',
          userId,
          deleted,
        }),
      );

      return { message: `Chat history cleared (${deleted} items removed)` };
    } catch (error: any) {
      this.logger.error(
        `Error clearing chat history: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Error clearing chat history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
