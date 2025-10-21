import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from './prisma.service';
import { CacheService } from './cache.service';
import { ChatMessageDto, ChatResponseDto, ProductRecommendationDto } from '../models/chat.model';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateRecommendation(
    message: ChatMessageDto,
    userId: number,
  ): Promise<ChatResponseDto> {
    try {
      this.logger.log(`Generating recommendation for user ${userId}`);

      // Obtener contexto del usuario desde cache o DB
      const userContext = await this.getUserContext(userId);
      
      // Obtener productos disponibles
      const availableProducts = await this.getAvailableProducts();
      
      // Construir prompt contextualizado
      const prompt = this.buildPrompt(message.mensaje, userContext, availableProducts);
      
      // Generar respuesta con Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parsear respuesta JSON
      const parsedResponse = this.parseGeminiResponse(text);
      
      // Generar sessionId si no existe
      const sessionId = message.sessionId || this.generateSessionId();
      
      // Crear respuesta estructurada
      const chatResponse: ChatResponseDto = {
        respuesta: parsedResponse.respuesta || text,
        sessionId,
        timestamp: Date.now(),
        recomendaciones: parsedResponse.recomendaciones || [],
        metadata: {
          userId,
          model: 'gemini-pro',
          tokens_used: response.usageMetadata?.totalTokenCount || 0,
        },
      };

      // Guardar en base de datos
      await this.saveChatRecord(userId, message.mensaje, chatResponse, sessionId);
      
      // Cachear conversación
      await this.cacheConversation(sessionId, chatResponse);

      this.logger.log(`Recommendation generated successfully for user ${userId}`);
      return chatResponse;

    } catch (error) {
      this.logger.error(`Error generating recommendation: ${error.message}`, error.stack);
      
      // Fallback determinístico
      return this.getFallbackResponse(message, userId);
    }
  }

  private async getUserContext(userId: number): Promise<any> {
    try {
      // Intentar obtener desde cache primero
      const cachedContext = await this.cacheService.get(`user_context_${userId}`);
      if (cachedContext) {
        return JSON.parse(cachedContext);
      }

      // Obtener desde base de datos
      const user = await this.prismaService.usuario.findUnique({
        where: { id: userId },
        include: {
          clientes: {
            include: {
              pedidos: {
                include: {
                  pedido_productos: {
                    include: {
                      producto: {
                        include: {
                          categoria: true,
                        },
                      },
                    },
                  },
                },
                orderBy: { fecha_registro: 'desc' },
                take: 10,
              },
            },
          },
        },
      });

      const context = {
        userId,
        preferences: this.extractUserPreferences(user),
        orderHistory: this.extractOrderHistory(user),
        dietaryRestrictions: [], // Se puede expandir
      };

      // Cachear por 1 hora
      await this.cacheService.set(`user_context_${userId}`, JSON.stringify(context), 3600);
      
      return context;
    } catch (error) {
      this.logger.warn(`Error getting user context: ${error.message}`);
      return { userId, preferences: [], orderHistory: [] };
    }
  }

  private async getAvailableProducts(): Promise<any[]> {
    try {
      const cachedProducts = await this.cacheService.get('available_products');
      if (cachedProducts) {
        return JSON.parse(cachedProducts);
      }

      const products = await this.prismaService.producto.findMany({
        where: { estado: true },
        include: {
          categoria: true,
          area_venta: true,
        },
        take: 50, // Limitar para el contexto
      });

      // Cachear por 30 minutos
      await this.cacheService.set('available_products', JSON.stringify(products), 1800);
      
      return products;
    } catch (error) {
      this.logger.warn(`Error getting available products: ${error.message}`);
      return [];
    }
  }

  private buildPrompt(message: string, userContext: any, products: any[]): string {
    const productsContext = products.map(p => 
      `ID: ${p.id}, Nombre: ${p.nombre}, Precio: ${p.precio}, Categoría: ${p.categoria?.nombre || 'Sin categoría'}`
    ).join('\n');

    return `
Eres un asistente de recomendaciones de comida para UniFood. 
Analiza el mensaje del usuario y proporciona recomendaciones personalizadas basadas en:

CONTEXTO DEL USUARIO:
- Historial de pedidos: ${JSON.stringify(userContext.orderHistory)}
- Preferencias: ${JSON.stringify(userContext.preferences)}

PRODUCTOS DISPONIBLES:
${productsContext}

MENSAJE DEL USUARIO: "${message}"

INSTRUCCIONES:
1. Responde de manera amigable y útil
2. Si el usuario pide recomendaciones, sugiere productos específicos con IDs válidos
3. Considera el historial y preferencias del usuario
4. Responde en español
5. Si no hay productos relevantes, explica por qué

FORMATO DE RESPUESTA (JSON):
{
  "respuesta": "Tu respuesta amigable aquí",
  "recomendaciones": [
    {
      "producto_id": 123,
      "nombre": "Nombre del producto",
      "descripcion": "Descripción breve",
      "precio": 15.99,
      "imagen_url": "url_imagen",
      "categoria": "Categoría",
      "score_recomendacion": 0.95
    }
  ]
}

Responde SOLO con el JSON válido, sin texto adicional.
`;
  }

  private parseGeminiResponse(text: string): any {
    try {
      // Intentar extraer JSON del texto
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Si no hay JSON válido, devolver respuesta básica
      return {
        respuesta: text,
        recomendaciones: [],
      };
    } catch (error) {
      this.logger.warn(`Error parsing Gemini response: ${error.message}`);
      return {
        respuesta: text,
        recomendaciones: [],
      };
    }
  }

  private generateSessionId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveChatRecord(
    userId: number,
    userMessage: string,
    response: ChatResponseDto,
    sessionId: string,
  ): Promise<void> {
    try {
      await this.prismaService.registro_chat.create({
        data: {
          usuario_id: userId,
          mensaje_usuario: userMessage,
          respuesta_gemini: response,
          session_id: sessionId,
          metadata: response.metadata,
        },
      });
    } catch (error) {
      this.logger.error(`Error saving chat record: ${error.message}`);
    }
  }

  private async cacheConversation(sessionId: string, response: ChatResponseDto): Promise<void> {
    try {
      const cacheKey = `conversation_${sessionId}`;
      await this.cacheService.set(cacheKey, JSON.stringify(response), 3600); // 1 hora
    } catch (error) {
      this.logger.warn(`Error caching conversation: ${error.message}`);
    }
  }

  private getFallbackResponse(message: ChatMessageDto, userId: number): ChatResponseDto {
    const sessionId = message.sessionId || this.generateSessionId();
    
    return {
      respuesta: "Lo siento, no puedo procesar tu solicitud en este momento. Por favor, intenta de nuevo más tarde o contacta con nuestro equipo de soporte.",
      sessionId,
      timestamp: Date.now(),
      recomendaciones: [],
      metadata: {
        userId,
        fallback: true,
        error: 'Gemini service unavailable',
      },
    };
  }

  private extractUserPreferences(user: any): any[] {
    if (!user?.clientes?.[0]?.pedidos) return [];
    
    const preferences = {};
    user.clientes[0].pedidos.forEach(pedido => {
      pedido.pedido_productos.forEach(item => {
        const categoria = item.producto.categoria?.nombre || 'Sin categoría';
        preferences[categoria] = (preferences[categoria] || 0) + item.cantidad;
      });
    });
    
    return Object.entries(preferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([categoria, cantidad]) => ({ categoria, cantidad }));
  }

  private extractOrderHistory(user: any): any[] {
    if (!user?.clientes?.[0]?.pedidos) return [];
    
    return user.clientes[0].pedidos.map(pedido => ({
      fecha: pedido.fecha_registro,
      total: pedido.total_pedido,
      productos: pedido.pedido_productos.map(item => ({
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precio: item.precio_unitario,
      })),
    }));
  }

  async getChatHistory(userId: number, sessionId?: string): Promise<any[]> {
    try {
      const whereClause: any = { usuario_id: userId };
      if (sessionId) {
        whereClause.session_id = sessionId;
      }

      const history = await this.prismaService.registro_chat.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      return history;
    } catch (error) {
      this.logger.error(`Error getting chat history: ${error.message}`);
      return [];
    }
  }
}
