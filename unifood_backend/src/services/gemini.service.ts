import { randomUUID } from 'node:crypto';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { CacheService } from './cache.service';
import {
  ChatMessageDto,
  ChatResponseDto,
  ProductRecommendationDto,
} from '../models/chat.model';

type GeminiJsonPayload = {
  respuesta?: string;
  recomendaciones?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
};

type UserContext = {
  userId: number;
  preferences: Array<{ categoria: string; cantidad: number }>;
  orderHistory: Array<{
    fecha: string;
    total: number;
    productos: Array<{
      nombre: string;
      cantidad: number;
      precio: number;
    }>;
  }>;
};

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly availableModels: string[];
  private geminiModelName: string;
  private readonly recommendationLimit: number;
  private readonly fallbackTemplates: string[] = [
    'Hola, soy tu asistente UniFood. Para opciones ligeras puedes probar una ensalada fresca o un wrap de pollo a la plancha.',
    'Basado en tus pedidos recientes te recomiendo un bowl de quinoa con verduras asadas y agua infusionada sin azucar.',
    'Si buscas algo rapido y completo, una pechuga a la plancha con arroz integral y ensalada es una gran eleccion.',
    'Puedes combinar una sopa de verduras, una baguette de pavo y un licuado natural para mantenerte con energia.',
  ];
  private model: any = null;
  private geminiApiKey?: string;
  private currentModelIndex = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
  ) {
    const configuredModel = this.normalizeModelName(
      this.configService.get<string>('GEMINI_MODEL', 'gemini-2.5-flash-lite'),
    );
    this.availableModels = this.buildModelPreferenceList(configuredModel);
    this.geminiModelName = this.availableModels[0];
    this.recommendationLimit = this.configService.get<number>(
      'CHAT_RECOMMENDATION_LIMIT',
      3,
    );

    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!this.geminiApiKey) {
      this.logger.warn('Gemini API key missing. Running in fallback mode.');
      return;
    }

    this.initializeModel(this.geminiModelName);
  }

  async generateRecommendation(
    message: ChatMessageDto,
    userId: number,
  ): Promise<ChatResponseDto> {
    if (!message?.mensaje) {
      throw new HttpException(
        'mensaje field is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const sanitizedMessage = this.sanitizeMessage(message.mensaje);
    const sessionId = this.normalizeSessionId(message.sessionId);

    const [userContext, products, cachedConversation] = await Promise.all([
      this.getUserContext(userId),
      this.getAvailableProducts(),
      this.cacheService.getConversation(sessionId, userId),
    ]);

    const prompt = this.buildPrompt(
      sanitizedMessage,
      userContext,
      products,
      cachedConversation,
    );

    let payload: GeminiJsonPayload | null = null;
    let usageMetadata: Record<string, unknown> | undefined;

    if (this.model) {
      const inferenceResult = await this.tryGenerateWithFallback(prompt);
      if (inferenceResult) {
        payload = inferenceResult.payload;
        usageMetadata = inferenceResult.usageMetadata;
      }
    }

    const fallbackApplied = !payload;
    if (!payload) {
      payload = this.buildFallbackPayload(sanitizedMessage, products);
    }

    const responseDto = this.buildResponseDto(
      payload,
      sessionId,
      userId,
      products,
      usageMetadata,
      fallbackApplied,
    );

    await Promise.allSettled([
      this.saveChatRecord(userId, sanitizedMessage, responseDto, sessionId),
      this.cacheConversation(userId, sessionId, sanitizedMessage, responseDto),
      this.cacheService.incrementChatCounter(userId),
    ]);

    return responseDto;
  }

  async getChatHistory(userId: number, sessionId?: string) {
    try {
      const whereClause: Record<string, unknown> = { usuario_id: userId };
      if (sessionId) {
        whereClause.session_id = sessionId;
      }

      const history = await this.prismaService.registro_chat.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      return history.map((entry) => ({
        id: entry.id,
        usuario_id: entry.usuario_id,
        mensaje_usuario: entry.mensaje_usuario,
        respuesta_gemini: entry.respuesta_gemini as Record<string, unknown>,
        timestamp: entry.timestamp.toISOString(),
        session_id: entry.session_id ?? undefined,
        metadata: entry.metadata as Record<string, unknown> | undefined,
      }));
    } catch (error: any) {
      this.logger.error(
        `Error getting chat history: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async clearChatHistory(userId: number): Promise<number> {
    try {
      const result = await this.prismaService.registro_chat.deleteMany({
        where: { usuario_id: userId },
      });

      await this.cacheService.clearUserCache(userId);
      return result.count;
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

  private sanitizeMessage(input: string): string {
    return input.replace(/\s+/g, ' ').trim();
  }

  private normalizeSessionId(sessionId?: string): string {
    const safeId = sessionId?.trim();
    if (safeId && safeId.length >= 6) {
      return safeId;
    }
    return `chat_${randomUUID()}`;
  }

  private buildSystemInstruction(): string {
    return [
      'Eres un asistente de UniFood especializado en recomendar alimentos.',
      'Debes analizar historial de pedidos, preferencias y disponibilidad actual.',
      'Responde siempre en JSON valido con la estructura solicitada.',
      'Evita recomendaciones que no existan en el catalogo proporcionado.',
      'Incluye justificacion breve dentro de la respuesta cuando sea util.',
    ].join(' ');
  }

  private buildPrompt(
    message: string,
    context: UserContext,
    products: any[],
    cachedConversation: any,
  ): string {
    const productLines = products
      .map(
        (product) =>
          `ID:${product.id}|Nombre:${product.nombre}|Precio:${Number(
            product.precio,
          ).toFixed(2)}|Categoria:${
            product.categoria?.nombre ?? 'Sin categoria'
          }`,
      )
      .join('\n');

    const previousMessages = Array.isArray(cachedConversation?.messages)
      ? cachedConversation.messages
          .slice(-6)
          .map((item: any) => `[${item.role}] ${item.content}`)
          .join('\n')
      : '';

    return [
      'Contexto del usuario:',
      JSON.stringify(context),
      'Catalogo disponible:',
      productLines,
      previousMessages ? `Conversacion reciente:\n${previousMessages}` : '',
      'Instrucciones:',
      `- Mensaje del usuario: "${message}"`,
      '- Devuelve solo JSON valido sin texto adicional.',
      '- Campo respuesta debe ser texto amigable.',
      '- Campo recomendaciones es un arreglo de maximo tres opciones.',
      '- Usa los IDs de producto proporcionados; evita duplicados.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private parseGeminiResponse(text: string): GeminiJsonPayload | null {
    if (!text) {
      return null;
    }

    const trimmed = text.trim();

    try {
      return JSON.parse(trimmed);
    } catch {
      const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      try {
        return JSON.parse(jsonMatch[0]);
      } catch (error: any) {
        this.logger.warn(
          `Unable to parse Gemini JSON payload: ${error.message}`,
        );
      }
    }
    return null;
  }

  private validateResponsePayload(payload: GeminiJsonPayload): boolean {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    if (!payload.respuesta || typeof payload.respuesta !== 'string') {
      return false;
    }

    if (
      payload.recomendaciones &&
      !Array.isArray(payload.recomendaciones)
    ) {
      return false;
    }

    return true;
  }

  private buildResponseDto(
    payload: GeminiJsonPayload,
    sessionId: string,
    userId: number,
    products: any[],
    usageMetadata: Record<string, unknown> | undefined,
    fallbackApplied: boolean,
  ): ChatResponseDto {
    const timestamp = Date.now();
    const recomendaciones = this.normalizeRecommendations(
      payload.recomendaciones,
      products,
    );

    const metadata: Record<string, unknown> = {
      ...(this.isPlainObject(payload.metadata) ? payload.metadata : {}),
      model: this.model ? this.geminiModelName : 'fallback',
      isFallback: fallbackApplied,
      userId,
      generatedAt: new Date(timestamp).toISOString(),
    };

    if (usageMetadata) {
      metadata.usage = usageMetadata;
    }

    return {
      respuesta: this.sanitizeAssistantResponse(payload.respuesta ?? ''),
      sessionId,
      timestamp,
      recomendaciones,
      metadata,
    };
  }

  private sanitizeAssistantResponse(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private normalizeRecommendations(
    items: GeminiJsonPayload['recomendaciones'],
    products: any[],
  ): ProductRecommendationDto[] {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const productIndex = new Map<number, any>();
    products.forEach((product) => productIndex.set(product.id, product));

    const normalized: ProductRecommendationDto[] = [];
    for (const raw of items) {
      if (!raw || typeof raw !== 'object') {
        continue;
      }

      const productId = this.coerceNumber(
        raw.producto_id ?? raw.id ?? raw.productId,
      );
      if (!productId) {
        continue;
      }

      const product = productIndex.get(productId);
      const nombreSource =
        typeof raw.nombre === 'string' && raw.nombre.trim().length > 0
          ? raw.nombre.trim()
          : product?.nombre;
      if (!nombreSource) {
        continue;
      }

      const precio =
        this.coerceNumber(raw.precio) ??
        this.coerceNumber(product?.precio) ??
        0;

      if (precio <= 0) {
        continue;
      }

      const recommendation: ProductRecommendationDto = {
        producto_id: productId,
        nombre: nombreSource,
        descripcion:
          typeof raw.descripcion === 'string'
            ? raw.descripcion.trim()
            : product?.descripcion ?? undefined,
        precio,
        imagen_url:
          typeof raw.imagen_url === 'string'
            ? raw.imagen_url.trim()
            : product?.imagen_url ?? undefined,
        categoria:
          typeof raw.categoria === 'string'
            ? raw.categoria.trim()
            : product?.categoria?.nombre ?? undefined,
        score_recomendacion: this.coerceNumber(raw.score_recomendacion) ?? undefined,
      };

      normalized.push(recommendation);

      if (normalized.length >= this.recommendationLimit) {
        break;
      }
    }

    return normalized;
  }

  private coerceNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (value && typeof value === 'object' && 'toNumber' in value) {
      try {
        return Number((value as any).toNumber());
      } catch {
        return null;
      }
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private buildFallbackPayload(
    message: string,
    products: any[],
  ): GeminiJsonPayload {
    const respuesta = this.selectFallbackMessage(message);
    const sortedProducts = [...products].sort(
      (a, b) => Number(a.id) - Number(b.id),
    );

    const recomendaciones = sortedProducts.slice(0, this.recommendationLimit).map(
      (product) =>
        ({
          producto_id: product.id,
          nombre: product.nombre,
          descripcion: product.descripcion ?? undefined,
          precio: Number(product.precio),
          imagen_url: product.imagen_url ?? undefined,
          categoria: product.categoria?.nombre ?? undefined,
          score_recomendacion: 0.5,
        } as Record<string, unknown>),
    );

    return {
      respuesta,
      recomendaciones,
      metadata: { source: 'fallback' },
    };
  }

  private selectFallbackMessage(message: string): string {
    if (!this.fallbackTemplates.length) {
      return 'Lo siento, no puedo procesar tu solicitud en este momento.';
    }

    const index = this.deterministicIndex(
      message || 'default_fallback_message',
      this.fallbackTemplates.length,
    );
    return this.fallbackTemplates[index];
  }

  private deterministicIndex(seed: string, length: number): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return hash % length;
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
          respuesta_gemini: response as unknown as Prisma.JsonObject,
          session_id: sessionId,
          timestamp: new Date(response.timestamp),
          metadata: (response.metadata ?? null) as Prisma.InputJsonValue,
        },
      });
    } catch (error: any) {
      this.logger.error(
        `Error saving chat record: ${error.message}`,
        error.stack,
      );
    }
  }

  private async cacheConversation(
    userId: number,
    sessionId: string,
    userMessage: string,
    response: ChatResponseDto,
  ): Promise<void> {
    try {
      const existing = await this.cacheService.getConversation(sessionId, userId);
      const messages = Array.isArray(existing?.messages)
        ? existing.messages.slice()
        : [];

      messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      });

      messages.push({
        role: 'assistant',
        content: response.respuesta,
        recomendaciones: response.recomendaciones,
        timestamp: new Date(response.timestamp).toISOString(),
      });

      const payload = {
        sessionId,
        userId,
        updatedAt: new Date().toISOString(),
        messages: messages.slice(-10),
      };

      await this.cacheService.cacheConversation(sessionId, payload, 3600, userId);
    } catch (error: any) {
      this.logger.warn(
        `Error caching conversation: ${error.message}`,
      );
    }
  }

  private async getUserContext(userId: number): Promise<UserContext> {
    try {
      const cached = await this.cacheService.getUserContext(userId);
      if (cached) {
        return cached as UserContext;
      }

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
                        include: { categoria: true },
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

      const context: UserContext = {
        userId,
        preferences: this.extractUserPreferences(user),
        orderHistory: this.extractOrderHistory(user),
      };

      await this.cacheService.cacheUserContext(userId, context, 3600);
      return context;
    } catch (error: any) {
      this.logger.warn(`Error building user context: ${error.message}`);
      return {
        userId,
        preferences: [],
        orderHistory: [],
      };
    }
  }

  private extractUserPreferences(user: any) {
    if (!user?.clientes?.[0]?.pedidos) {
      return [];
    }

    const counters: Record<string, number> = {};
    user.clientes[0].pedidos.forEach((pedido: any) => {
      pedido.pedido_productos.forEach((item: any) => {
        const category = item.producto?.categoria?.nombre ?? 'Sin categoria';
        counters[category] = (counters[category] ?? 0) + item.cantidad;
      });
    });

    return Object.entries(counters)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([categoria, cantidad]) => ({ categoria, cantidad: cantidad as number }));
  }

  private extractOrderHistory(user: any) {
    if (!user?.clientes?.[0]?.pedidos) {
      return [];
    }

    return user.clientes[0].pedidos.map((pedido: any) => ({
      fecha: pedido.fecha_registro?.toISOString?.() ?? pedido.fecha_registro,
      total: this.coerceNumber(pedido.total_pedido) ?? 0,
      productos: (pedido.pedido_productos ?? []).map((item: any) => ({
        nombre: item.producto?.nombre ?? 'Producto',
        cantidad: item.cantidad,
        precio: this.coerceNumber(item.precio_unitario) ?? 0,
      })),
    }));
  }

  private async getAvailableProducts(): Promise<any[]> {
    try {
      const cached = await this.cacheService.getAvailableProducts();
      if (cached && Array.isArray(cached)) {
        return cached;
      }

      const products = await this.prismaService.producto.findMany({
        where: { estado: true },
        include: {
          categoria: true,
          area_venta: { select: { area_venta: true } },
        },
        take: 50,
      });

      const serialized = products.map((product) => ({
        ...product,
        precio: Number(product.precio),
      }));

      await this.cacheService.cacheAvailableProducts(serialized);
      return serialized;
    } catch (error: any) {
      this.logger.warn(`Error retrieving available products: ${error.message}`);
      return [];
    }
  }

  private buildUsageMetadata(response: any, durationMs: number) {
    if (!response?.response?.usageMetadata) {
      return undefined;
    }

    const usage = response.response.usageMetadata;
    return {
      promptTokens: usage.promptTokenCount ?? usage.promptTokens ?? 0,
      completionTokens:
        usage.candidatesTokenCount ?? usage.completionTokens ?? 0,
      totalTokens: usage.totalTokenCount ?? 0,
      durationMs,
    };
  }

  private buildModelPreferenceList(primary: string): string[] {
    const fallbacksEnv = this.configService
      .get<string>('GEMINI_MODEL_FALLBACKS', '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((model) => this.normalizeModelName(model));

    // Modelos que funcionan según pruebas actuales
    const defaults = [
      'gemini-2.5-flash-lite', // ✅ Más estable y rápido
      'gemini-2.5-flash',      // ✅ Funciona perfectamente
      'gemini-2.5-pro',        // ✅ Funciona perfectamente
    ];

    const allModels = [primary, ...fallbacksEnv, ...defaults];
    const unique: string[] = [];

    for (const model of allModels) {
      if (!unique.includes(model)) {
        unique.push(model);
      }
    }

    return unique;
  }

  private initializeModel(modelName: string): void {
    if (!this.geminiApiKey) {
      this.logger.warn('Gemini API key not configured. Running in fallback mode.');
      this.model = null;
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(this.geminiApiKey);
      this.model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: this.buildSystemInstruction(),
      });
      this.geminiModelName = modelName;
      this.logger.log(`Gemini model ${modelName} initialised`);
    } catch (error: any) {
      this.logger.error(
        `Failed to initialise Gemini model ${modelName}: ${error.message}`,
        error.stack,
      );
      this.model = null;
    }
  }

  private async tryGenerateWithFallback(prompt: string): Promise<{
    payload: GeminiJsonPayload | null;
    usageMetadata?: Record<string, unknown>;
  } | null> {
    if (!this.model) {
      return null;
    }

    const maxAttempts = this.availableModels.length;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (!this.model) {
        return null;
      }

      try {
        const inferenceStart = Date.now();
        const temperature = Number(
          this.configService.get('GEMINI_TEMPERATURE', 0.4),
        );

        const response = await this.model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          },
        });

        const text = response.response?.text() ?? '';
        const parsed = this.parseGeminiResponse(text);

        if (!parsed || !this.validateResponsePayload(parsed)) {
          this.logger.warn(
            JSON.stringify({
              event: 'gemini.invalidPayload',
              reason: 'validation_failed',
              text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            }),
          );
          
          // Si el payload es inválido, intentar con el siguiente modelo
          const switched = this.switchToNextModel();
          if (switched) {
            this.logger.warn(
              `Gemini model ${this.geminiModelName} returned invalid payload. Switching to next candidate.`,
            );
            continue;
          }
        }

        const usageMetadata = this.buildUsageMetadata(
          response,
          Date.now() - inferenceStart,
        );

        return {
          payload: parsed ?? null,
          usageMetadata,
        };
      } catch (error: any) {
        if (this.isModelNotFoundError(error) || this.isModelOverloadedError(error)) {
          const switched = this.switchToNextModel();
          if (switched) {
            this.logger.warn(
              `Gemini model ${this.geminiModelName} not available or overloaded. Switching to next candidate.`,
            );
            continue;
          } else {
            this.logger.warn(
              `All Gemini models exhausted. Falling back to template responses.`,
            );
            return null;
          }
        }

        this.logger.error(
          `Gemini inference failed: ${error.message}`,
          error.stack,
        );
        return null;
      }
    }

    return null;
  }

  private switchToNextModel(): boolean {
    if (this.currentModelIndex >= this.availableModels.length - 1) {
      return false;
    }

    this.currentModelIndex += 1;
    const nextModel = this.availableModels[this.currentModelIndex];
    this.initializeModel(nextModel);

    if (this.model) {
      return true;
    }

    return this.switchToNextModel();
  }

  private isModelNotFoundError(error: any): boolean {
    if (!error) {
      return false;
    }

    const message = String(error.message ?? '').toLowerCase();
    return (
      message.includes('404') ||
      message.includes('not found') ||
      message.includes('is not supported for generatecontent')
    );
  }

  private isModelOverloadedError(error: any): boolean {
    if (!error) {
      return false;
    }

    const message = String(error.message ?? '').toLowerCase();
    return (
      message.includes('503') ||
      message.includes('service unavailable') ||
      message.includes('overloaded') ||
      message.includes('try again later')
    );
  }

  private normalizeModelName(model: string): string {
    const trimmed = (model ?? '').trim();
    if (!trimmed) {
      return 'gemini-2.5-flash-lite';
    }

    const aliases: Record<string, string> = {
      // Modelos oficiales 2.5
      'gemini-2.5-flash-latest': 'gemini-2.5-flash-lite',
      'gemini-2.5-pro-latest': 'gemini-2.5-pro',
      
      // Modelos legacy
      'gemini-1.5-flash-latest': 'gemini-1.5-flash',
      'gemini-1.5-pro-latest': 'gemini-1.5-pro',
      'gemini-1.5-flash-001': 'gemini-1.5-flash',
      'gemini-pro': 'gemini-1.5-pro',
      
      // Alias comunes
      'flash': 'gemini-2.5-flash-lite',
      'pro': 'gemini-1.5-pro',
      'lite': 'gemini-2.5-flash-lite',
    };

    const normalizedKey = trimmed.toLowerCase();
    return aliases[normalizedKey] ?? trimmed;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
      !!value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );
  }
}
