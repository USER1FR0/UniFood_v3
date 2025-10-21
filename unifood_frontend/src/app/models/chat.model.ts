export interface ChatMessage {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sessionId: string;
}

export interface ChatResponse {
  respuesta: string;
  sessionId: string;
  timestamp: number;
  recomendaciones?: ProductRecommendation[];
  metadata?: {
    userId: number;
    model: string;
    tokens_used?: number;
    fallback?: boolean;
    error?: string;
  };
}

export interface ProductRecommendation {
  producto_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen_url?: string;
  categoria?: string;
  score_recomendacion?: number;
}

export interface ChatHistory {
  id: number;
  usuario_id: number;
  mensaje_usuario: string;
  respuesta_gemini: ChatResponse;
  timestamp: string;
  session_id?: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  sessionId: string;
  usuario_id: number;
  total_mensajes?: number;
  ultimo_mensaje?: string;
  fecha_creacion?: string;
  fecha_ultima_actividad?: string;
}

export interface ChatMessageDto {
  mensaje: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface TypingStatus {
  userId: number;
  isTyping: boolean;
  timestamp: number;
}

export interface ConnectionStatus {
  connected: boolean;
  userId?: number;
  timestamp: number;
}

export interface ChatError {
  message: string;
  code?: string;
  timestamp: number;
}
