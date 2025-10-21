import { IsString, IsNotEmpty, IsOptional, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  mensaje: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ChatResponseDto {
  @IsString()
  @IsNotEmpty()
  respuesta: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsNumber()
  timestamp: number;

  @IsOptional()
  @IsObject()
  recomendaciones?: ProductRecommendationDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ProductRecommendationDto {
  @IsNumber()
  producto_id: number;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  precio: number;

  @IsString()
  @IsOptional()
  imagen_url?: string;

  @IsString()
  @IsOptional()
  categoria?: string;

  @IsNumber()
  @IsOptional()
  score_recomendacion?: number;
}

export class ChatHistoryDto {
  @IsNumber()
  id: number;

  @IsNumber()
  usuario_id: number;

  @IsString()
  mensaje_usuario: string;

  @IsObject()
  respuesta_gemini: any;

  @IsString()
  timestamp: string;

  @IsString()
  @IsOptional()
  session_id?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ChatSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsNumber()
  usuario_id: number;

  @IsNumber()
  @IsOptional()
  total_mensajes?: number;

  @IsString()
  @IsOptional()
  ultimo_mensaje?: string;

  @IsString()
  @IsOptional()
  fecha_creacion?: string;

  @IsString()
  @IsOptional()
  fecha_ultima_actividad?: string;
}
