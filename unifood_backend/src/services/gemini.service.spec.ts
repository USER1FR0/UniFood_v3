import { Test, TestingModule } from '@nestjs/testing';
import { GeminiService } from '../services/gemini.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../services/prisma.service';
import { CacheService } from '../services/cache.service';
import { ChatMessageDto } from '../models/chat.model';

describe('GeminiService', () => {
  let service: GeminiService;
  let configService: ConfigService;
  let prismaService: PrismaService;
  let cacheService: CacheService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-api-key'),
  };

  const mockPrismaService = {
    registro_chat: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    usuario: {
      findUnique: jest.fn(),
    },
    producto: {
      findMany: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRecommendation', () => {
    it('should generate a recommendation successfully', async () => {
      const chatMessage: ChatMessageDto = {
        mensaje: 'Quiero algo saludable para comer',
        sessionId: 'test-session-123',
      };

      const userId = 1;

      // Mock user context
      mockCacheService.get.mockResolvedValueOnce(null);
      mockPrismaService.usuario.findUnique.mockResolvedValueOnce({
        id: 1,
        clientes: [{
          pedidos: []
        }]
      });

      // Mock available products
      mockCacheService.get.mockResolvedValueOnce(null);
      mockPrismaService.producto.findMany.mockResolvedValueOnce([
        {
          id: 1,
          nombre: 'Ensalada César',
          precio: 12.99,
          categoria: { nombre: 'Ensaladas' },
        },
      ]);

      // Mock chat record creation
      mockPrismaService.registro_chat.create.mockResolvedValueOnce({});

      // Mock cache conversation
      mockCacheService.set.mockResolvedValueOnce(undefined);

      const result = await service.generateRecommendation(chatMessage, userId);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe('test-session-123');
      expect(result.respuesta).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should handle errors gracefully with fallback response', async () => {
      const chatMessage: ChatMessageDto = {
        mensaje: 'Test message',
      };

      const userId = 1;

      // Mock error in user context
      mockCacheService.get.mockRejectedValueOnce(new Error('Cache error'));

      const result = await service.generateRecommendation(chatMessage, userId);

      expect(result).toBeDefined();
      expect(result.respuesta).toContain('Lo siento');
      expect(result.metadata.fallback).toBe(true);
    });
  });

  describe('getChatHistory', () => {
    it('should return chat history for a user', async () => {
      const userId = 1;
      const mockHistory = [
        {
          id: 1,
          usuario_id: 1,
          mensaje_usuario: 'Test message',
          respuesta_gemini: { respuesta: 'Test response' },
          timestamp: new Date(),
          session_id: 'test-session',
        },
      ];

      mockPrismaService.registro_chat.findMany.mockResolvedValueOnce(mockHistory);

      const result = await service.getChatHistory(userId);

      expect(result).toEqual(mockHistory);
      expect(mockPrismaService.registro_chat.findMany).toHaveBeenCalledWith({
        where: { usuario_id: userId },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
    });

    it('should return chat history for a specific session', async () => {
      const userId = 1;
      const sessionId = 'test-session-123';

      await service.getChatHistory(userId, sessionId);

      expect(mockPrismaService.registro_chat.findMany).toHaveBeenCalledWith({
        where: { usuario_id: userId, session_id: sessionId },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
    });
  });
});
