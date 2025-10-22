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
import { Logger } from '@nestjs/common';
import { GeminiService } from '../services/gemini.service';
import { ChatMessageDto } from '../models/chat.model';

type ConnectedUser = {
  userId: number;
  socket: Socket;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new Map<string, ConnectedUser>();

  constructor(private readonly geminiService: GeminiService) {}

  async handleConnection(client: Socket) {
    try {
      const userId =
        Number(client.handshake.auth?.userId) ||
        Number(client.handshake.query?.userId) ||
        1;

      this.connectedUsers.set(client.id, { userId, socket: client });
      client.join(`user_${userId}`);

      this.logger.log(
        JSON.stringify({
          event: 'chat.ws.connected',
          userId,
          socketId: client.id,
        }),
      );

      client.emit('connected', {
        userId,
        timestamp: Date.now(),
        message: 'Conectado al chat de recomendaciones',
      });
    } catch (error: any) {
      this.logger.warn(
        `Socket connection rejected: ${error.message}`,
        error.stack,
      );
      client.emit('error', { message: 'Authentication required' });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userInfo = this.connectedUsers.get(client.id);
    if (userInfo) {
      this.connectedUsers.delete(client.id);
      client.leave(`user_${userInfo.userId}`);
      this.logger.log(
        JSON.stringify({
          event: 'chat.ws.disconnected',
          userId: userInfo.userId,
          socketId: client.id,
        }),
      );
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: ChatMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userInfo =
      this.connectedUsers.get(client.id) ??
      this.registerAnonymousClient(client);

    const sanitizedMessage = data?.mensaje?.trim();
    if (!sanitizedMessage) {
      client.emit('error', { message: 'mensaje must not be empty' });
      return;
    }

    try {
      const response = await this.geminiService.generateRecommendation(
        { ...data, mensaje: sanitizedMessage },
        userInfo.userId,
      );

      client.emit('message_response', response);

      if (response.recomendaciones?.length) {
        client.emit('recommendations', {
          sessionId: response.sessionId,
          recomendaciones: response.recomendaciones,
          timestamp: response.timestamp,
        });
      }

      this.logger.log(
        JSON.stringify({
          event: 'chat.ws.message.processed',
          userId: userInfo.userId,
          sessionId: response.sessionId,
          isFallback: response.metadata?.isFallback || false,
        }),
      );
    } catch (error: any) {
      this.logger.error(
        `Error handling websocket message: ${error.message}`,
        error.stack,
      );
      
      // Enviar respuesta de fallback en caso de error
      const fallbackResponse = {
        respuesta: 'Lo siento, no puedo procesar tu solicitud en este momento. Por favor, intenta de nuevo.',
        sessionId: data.sessionId || `chat_${Date.now()}`,
        timestamp: Date.now(),
        recomendaciones: [],
        metadata: {
          isFallback: true,
          error: 'Service temporarily unavailable',
        },
      };

      client.emit('message_response', fallbackResponse);
    }
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userInfo =
      this.connectedUsers.get(client.id) ??
      this.registerAnonymousClient(client);

    const sessionId = this.sanitizeSessionId(data?.sessionId);
    if (!sessionId) {
      client.emit('error', { message: 'sessionId is required' });
      return;
    }

    client.join(`session_${sessionId}`);
    client.emit('session_joined', {
      sessionId,
      message: 'Sesion unida exitosamente',
      timestamp: Date.now(),
    });

    this.logger.log(
      JSON.stringify({
        event: 'chat.ws.session.joined',
        userId: userInfo.userId,
        sessionId,
      }),
    );
  }

  @SubscribeMessage('leave_session')
  async handleLeaveSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const sessionId = this.sanitizeSessionId(data?.sessionId);
    if (!sessionId) {
      client.emit('error', { message: 'sessionId is required' });
      return;
    }

    client.leave(`session_${sessionId}`);
    client.emit('session_left', {
      sessionId,
      message: 'Sesion abandonada',
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { isTyping: boolean; sessionId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userInfo =
      this.connectedUsers.get(client.id) ??
      this.registerAnonymousClient(client);

    const payload = {
      userId: userInfo.userId,
      isTyping: Boolean(data?.isTyping),
      timestamp: Date.now(),
    };

    if (data?.sessionId) {
      const sessionId = this.sanitizeSessionId(data.sessionId);
      if (sessionId) {
        client.to(`session_${sessionId}`).emit('user_typing', payload);
      }
    } else {
      client.broadcast.emit('user_typing', payload);
    }
  }

  async sendNotificationToUser(userId: number, notification: any) {
    try {
      this.server.to(`user_${userId}`).emit('notification', {
        ...notification,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      this.logger.error(
        `Error sending notification: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendMessageToSession(sessionId: string, message: any) {
    const sanitized = this.sanitizeSessionId(sessionId);
    if (!sanitized) {
      return;
    }

    try {
      this.server.to(`session_${sanitized}`).emit('session_message', {
        ...message,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      this.logger.error(
        `Error sending session message: ${error.message}`,
        error.stack,
      );
    }
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.entries()).map(
      ([socketId, info]) => ({
        socketId,
        userId: info.userId,
      }),
    );
  }

  getGatewayStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalRooms: this.server?.sockets?.adapter?.rooms?.size ?? 0,
      timestamp: Date.now(),
    };
  }

  private registerAnonymousClient(client: Socket): ConnectedUser {
    const userId =
      Number(client.handshake.auth?.userId) ||
      Number(client.handshake.query?.userId) ||
      1;

    const info: ConnectedUser = { userId, socket: client };
    this.connectedUsers.set(client.id, info);
    client.join(`user_${userId}`);
    return info;
  }

  private sanitizeSessionId(sessionId?: string): string | undefined {
    const value = sessionId?.trim();
    if (!value) {
      return undefined;
    }

    return value.replace(/[^a-zA-Z0-9_-]/g, '');
  }
}
