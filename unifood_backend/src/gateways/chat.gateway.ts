import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { GeminiService } from '../services/gemini.service';
import { ChatMessageDto, ChatResponseDto } from '../models/chat.model';
import { JwtAuthGuard } from '../middlewares/auth.middleware';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, { userId: number; socket: Socket }>();

  constructor(private readonly geminiService: GeminiService) {}

  async handleConnection(client: Socket) {
    try {
      // Sin JWT por ahora - usar userId del handshake o valor por defecto
      const userId = client.handshake.auth?.userId || 1; // Usuario temporal para pruebas
      
      this.logger.log(`Connection attempt with userId: ${userId}`);

      // Registrar usuario conectado
      this.connectedUsers.set(client.id, { userId, socket: client });
      
      // Unir al usuario a su sala personal
      client.join(`user_${userId}`);
      
      this.logger.log(`User ${userId} connected with socket ${client.id}`);
      
      // Enviar mensaje de bienvenida
      client.emit('connected', {
        message: 'Conectado al chat de recomendaciones',
        userId,
        timestamp: Date.now(),
      });

    } catch (error) {
      this.logger.error(`Error handling connection: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userInfo = this.connectedUsers.get(client.id);
    if (userInfo) {
      this.logger.log(`User ${userInfo.userId} disconnected`);
      this.connectedUsers.delete(client.id);
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: ChatMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: 'Usuario no autenticado' });
        return;
      }

      this.logger.log(`Processing message from user ${userInfo.userId}: ${data.mensaje}`);

      // Generar respuesta con Gemini
      const response = await this.geminiService.generateRecommendation(data, userInfo.userId);

      // Enviar respuesta al cliente
      client.emit('message_response', response);

      // Si hay recomendaciones, enviar evento adicional
      if (response.recomendaciones && response.recomendaciones.length > 0) {
        client.emit('recommendations', {
          sessionId: response.sessionId,
          recomendaciones: response.recomendaciones,
          timestamp: response.timestamp,
        });
      }

      this.logger.log(`Response sent to user ${userInfo.userId}`);

    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`, error.stack);
      client.emit('error', { 
        message: 'Error procesando mensaje. Intenta de nuevo.',
        timestamp: Date.now(),
      });
    }
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: 'Usuario no autenticado' });
        return;
      }

      // Unir al cliente a la sesión específica
      client.join(`session_${data.sessionId}`);
      
      this.logger.log(`User ${userInfo.userId} joined session ${data.sessionId}`);
      
      client.emit('session_joined', {
        sessionId: data.sessionId,
        message: 'Sesión unida exitosamente',
        timestamp: Date.now(),
      });

    } catch (error) {
      this.logger.error(`Error joining session: ${error.message}`);
      client.emit('error', { message: 'Error uniendo a la sesión' });
    }
  }

  @SubscribeMessage('leave_session')
  async handleLeaveSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      client.leave(`session_${data.sessionId}`);
      
      const userInfo = this.connectedUsers.get(client.id);
      if (userInfo) {
        this.logger.log(`User ${userInfo.userId} left session ${data.sessionId}`);
      }
      
      client.emit('session_left', {
        sessionId: data.sessionId,
        message: 'Sesión abandonada',
        timestamp: Date.now(),
      });

    } catch (error) {
      this.logger.error(`Error leaving session: ${error.message}`);
      client.emit('error', { message: 'Error abandonando la sesión' });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { isTyping: boolean; sessionId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) return;

      const typingData = {
        userId: userInfo.userId,
        isTyping: data.isTyping,
        timestamp: Date.now(),
      };

      if (data.sessionId) {
        // Enviar a todos los usuarios en la sesión
        client.to(`session_${data.sessionId}`).emit('user_typing', typingData);
      } else {
        // Enviar a todos los usuarios conectados
        this.server.emit('user_typing', typingData);
      }

    } catch (error) {
      this.logger.error(`Error handling typing: ${error.message}`);
    }
  }

  // Método para enviar notificaciones a usuarios específicos
  async sendNotificationToUser(userId: number, notification: any) {
    try {
      this.server.to(`user_${userId}`).emit('notification', {
        ...notification,
        timestamp: Date.now(),
      });
      
      this.logger.log(`Notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending notification: ${error.message}`);
    }
  }

  // Método para enviar mensajes a una sesión específica
  async sendMessageToSession(sessionId: string, message: any) {
    try {
      this.server.to(`session_${sessionId}`).emit('session_message', {
        ...message,
        timestamp: Date.now(),
      });
      
      this.logger.log(`Message sent to session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error sending session message: ${error.message}`);
    }
  }

  // Método auxiliar para extraer userId del token (simplificado)
  private extractUserIdFromToken(token: string): number | null {
    try {
      // En una implementación real, aquí validarías el JWT
      // Por ahora, retornamos un ID de prueba
      // TODO: Implementar validación real de JWT
      return 1; // ID de prueba
    } catch (error) {
      this.logger.error(`Error extracting user ID from token: ${error.message}`);
      return null;
    }
  }

  // Obtener usuarios conectados
  getConnectedUsers(): Array<{ userId: number; socketId: string }> {
    return Array.from(this.connectedUsers.entries()).map(([socketId, userInfo]) => ({
      userId: userInfo.userId,
      socketId,
    }));
  }

  // Obtener estadísticas del gateway
  getGatewayStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalRooms: this.server.sockets.adapter.rooms.size,
      timestamp: Date.now(),
    };
  }
}
