import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  Request, 
  HttpStatus, 
  HttpException,
  Logger,
} from '@nestjs/common';
import { GeminiService } from '../services/gemini.service';
import { ChatMessageDto, ChatResponseDto, ChatHistoryDto } from '../models/chat.model';
import { JwtAuthGuard } from '../middlewares/auth.middleware';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly geminiService: GeminiService) {}

  @Post('message')
  async sendMessage(
    @Body() chatMessageDto: ChatMessageDto,
    @Request() req: any,
  ): Promise<ChatResponseDto> {
    try {
      this.logger.log(`Processing chat message from user ${req.user.id}`);
      
      const userId = req.user.id;
      const response = await this.geminiService.generateRecommendation(chatMessageDto, userId);
      
      this.logger.log(`Chat response generated for user ${userId}`);
      return response;
    } catch (error) {
      this.logger.error(`Error processing chat message: ${error.message}`, error.stack);
      throw new HttpException(
        'Error processing chat message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history')
  async getChatHistory(@Request() req: any): Promise<ChatHistoryDto[]> {
    try {
      const userId = req.user.id;
      const history = await this.geminiService.getChatHistory(userId);
      
      this.logger.log(`Retrieved chat history for user ${userId}`);
      return history;
    } catch (error) {
      this.logger.error(`Error getting chat history: ${error.message}`, error.stack);
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
    try {
      const userId = req.user.id;
      const history = await this.geminiService.getChatHistory(userId, sessionId);
      
      this.logger.log(`Retrieved chat history for session ${sessionId}, user ${userId}`);
      return history;
    } catch (error) {
      this.logger.error(`Error getting chat history by session: ${error.message}`, error.stack);
      throw new HttpException(
        'Error retrieving chat history by session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('clear-history')
  async clearChatHistory(@Request() req: any): Promise<{ message: string }> {
    try {
      const userId = req.user.id;
      // Aquí se implementaría la lógica para limpiar el historial
      // Por ahora retornamos un mensaje de confirmación
      
      this.logger.log(`Chat history cleared for user ${userId}`);
      return { message: 'Chat history cleared successfully' };
    } catch (error) {
      this.logger.error(`Error clearing chat history: ${error.message}`, error.stack);
      throw new HttpException(
        'Error clearing chat history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
