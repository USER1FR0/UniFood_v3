import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { ChatMessage, ChatResponse, ProductRecommendation } from '../../models/chat.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  sessionId: string = '';
  isConnected: boolean = false;
  recommendations: ProductRecommendation[] = [];
  showRecommendations: boolean = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.sessionId = this.generateSessionId();
    this.initializeChat();
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
  }

  private generateSessionId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeChat(): void {
    // Mensaje de bienvenida
    this.messages.push({
      id: 1,
      content: '¡Hola! Soy tu asistente de recomendaciones de UniFood. ¿En qué puedo ayudarte hoy?',
      isUser: false,
      timestamp: new Date(),
      sessionId: this.sessionId
    });
  }

  private connectWebSocket(): void {
    this.chatService.connect(this.sessionId);
    
    this.chatService.onMessage().subscribe((response: ChatResponse) => {
      this.handleBotResponse(response);
    });

    this.chatService.onRecommendations().subscribe((recommendations: ProductRecommendation[]) => {
      this.recommendations = recommendations;
      // Mostrar recomendaciones si están disponibles
      if (recommendations && recommendations.length > 0) {
        this.showRecommendations = true;
        this.addRecommendationsToChat(recommendations);
      }
    });

    this.chatService.onConnectionStatus().subscribe((status: boolean) => {
      this.isConnected = status;
    });

    this.chatService.onError().subscribe((error: any) => {
      console.error('Chat error:', error);
      this.addBotMessage('Lo siento, hubo un error. Por favor, intenta de nuevo.');
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || this.isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      content: this.newMessage.trim(),
      isUser: true,
      timestamp: new Date(),
      sessionId: this.sessionId
    };

    this.messages.push(userMessage);
    this.isLoading = true;
    this.scrollToBottom();

    // Enviar mensaje a través de WebSocket
    this.chatService.sendMessage({
      mensaje: this.newMessage.trim(),
      sessionId: this.sessionId
    });

    this.newMessage = '';
  }

  private handleBotResponse(response: ChatResponse): void {
    this.isLoading = false;
    
    const botMessage: ChatMessage = {
      id: Date.now(),
      content: response.respuesta,
      isUser: false,
      timestamp: new Date(response.timestamp),
      sessionId: response.sessionId,
      recommendations: response.recomendaciones || [],
      showRecommendations: false // No mostrar automáticamente
    };

    this.messages.push(botMessage);
    this.scrollToBottom();
  }

  private addBotMessage(content: string): void {
    const botMessage: ChatMessage = {
      id: Date.now(),
      content,
      isUser: false,
      timestamp: new Date(),
      sessionId: this.sessionId
    };

    this.messages.push(botMessage);
    this.scrollToBottom();
  }

  shouldShowRecommendations(): boolean {
    if (this.messages.length === 0) return false;
    
    const lastUserMessage = this.messages
      .filter(msg => msg.isUser)
      .pop();
    
    if (!lastUserMessage) return false;
    
    const message = lastUserMessage.content.toLowerCase();
    const recommendationKeywords = [
      'recomiéndame', 'recomendar', 'recomendación', 'recomendaciones',
      'qué me recomiendas', 'que me recomiendas', 'recomendación',
      'sugiéreme', 'sugerir', 'sugerencia', 'sugerencias',
      'qué puedo comer', 'que puedo comer', 'qué puedo pedir', 'que puedo pedir',
      'opciones', 'alternativas', 'menú', 'menu',
      'qué hay disponible', 'que hay disponible', 'disponible',
      'quiero', 'necesito', 'busco', 'me gustaría',
      'algo dulce', 'algo salado', 'algo económico', 'algo barato',
      'algo rico', 'algo rico', 'algo saludable', 'algo rápido'
    ];
    
    return recommendationKeywords.some(keyword => message.includes(keyword));
  }

  private addRecommendationsToChat(recommendations: ProductRecommendation[]): void {
    if (recommendations && recommendations.length > 0) {
      const recommendationsMessage: ChatMessage = {
        id: Date.now() + 1,
        content: 'Aquí tienes algunas recomendaciones para ti:',
        isUser: false,
        timestamp: new Date(),
        sessionId: this.sessionId,
        recommendations: recommendations,
        isRecommendation: true
      };

      this.messages.push(recommendationsMessage);
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  selectRecommendation(recommendation: ProductRecommendation): void {
    const message = `Me interesa el ${recommendation.nombre}. ¿Puedes darme más detalles?`;
    this.newMessage = message;
    this.sendMessage();
  }

  clearChat(): void {
    this.messages = [];
    this.recommendations = [];
    this.showRecommendations = false;
    this.sessionId = this.generateSessionId();
    this.initializeChat();
    this.chatService.disconnect();
    this.connectWebSocket();
  }

  closeRecommendations(): void {
    this.showRecommendations = false;
  }

  toggleRecommendations(): void {
    this.showRecommendations = !this.showRecommendations;
  }

  loadChatHistory(): void {
    this.chatService.getChatHistory().subscribe({
      next: (history) => {
        // Convertir historial a mensajes del chat
        const chatMessages: ChatMessage[] = [];
        history.forEach(msg => {
          // Mensaje del usuario
          chatMessages.push({
            id: msg.id,
            content: msg.mensaje_usuario,
            isUser: true,
            timestamp: new Date(msg.timestamp),
            sessionId: msg.session_id || this.sessionId
          });
          // Respuesta del bot
          chatMessages.push({
            id: msg.id + 0.5,
            content: msg.respuesta_gemini.respuesta,
            isUser: false,
            timestamp: new Date(msg.timestamp),
            sessionId: msg.session_id || this.sessionId
          });
        });
        this.messages = chatMessages;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error loading chat history:', error);
      }
    });
  }
}
