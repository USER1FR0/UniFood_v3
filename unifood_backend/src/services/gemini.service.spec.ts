import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from './gemini.service';
import { PrismaService } from './prisma.service';
import { CacheService } from './cache.service';
import { ChatMessageDto } from '../models/chat.model';

const createConfigServiceMock = () => ({
  get: jest.fn((key: string, defaultValue?: unknown) => {
    const values: Record<string, unknown> = {
      GEMINI_MODEL: 'gemini-test',
      CHAT_RECOMMENDATION_LIMIT: 2,
      GEMINI_TEMPERATURE: 0.2,
    };
    return key in values ? values[key] : defaultValue;
  }),
});

const mockUserRecord = {
  id: 1,
  clientes: [
    {
      pedidos: [
        {
          fecha_registro: new Date('2024-01-01T00:00:00Z'),
          total_pedido: 120,
          pedido_productos: [
            {
              cantidad: 1,
              precio_unitario: 120,
              producto: {
                nombre: 'Wrap de Pollo',
                categoria: { nombre: 'Wraps' },
              },
            },
          ],
        },
      ],
    },
  ],
};

const mockProducts = [
  {
    id: 1,
    nombre: 'Ensalada Mediterranea',
    descripcion: 'Frescura con aceite de oliva',
    precio: 95,
    categoria: { nombre: 'Ensaladas' },
    imagen_url: null,
  },
  {
    id: 2,
    nombre: 'Tostada de Aguacate',
    descripcion: 'Pan integral con aguacate y huevo',
    precio: 75,
    categoria: { nombre: 'Desayunos' },
    imagen_url: null,
  },
];

const createPrismaServiceMock = () => ({
  usuario: {
    findUnique: jest.fn().mockResolvedValue(mockUserRecord),
  },
  producto: {
    findMany: jest.fn().mockResolvedValue(mockProducts),
  },
  registro_chat: {
    create: jest.fn().mockResolvedValue(undefined),
    findMany: jest.fn().mockResolvedValue([
      {
        id: 10,
        usuario_id: 1,
        mensaje_usuario: 'Hola',
        respuesta_gemini: { respuesta: 'Hola!' },
        timestamp: new Date('2024-01-02T00:00:00Z'),
        session_id: 'chat_session',
        metadata: { model: 'fallback' },
      },
    ]),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
});

const createCacheServiceMock = () => ({
  getConversation: jest.fn().mockResolvedValue(null),
  cacheConversation: jest.fn().mockResolvedValue(true),
  getUserContext: jest.fn().mockResolvedValue(null),
  cacheUserContext: jest.fn().mockResolvedValue(true),
  getAvailableProducts: jest.fn().mockResolvedValue(null),
  cacheAvailableProducts: jest.fn().mockResolvedValue(true),
  incrementChatCounter: jest.fn().mockResolvedValue(1),
  clearUserCache: jest.fn().mockResolvedValue(true),
});

describe('GeminiService', () => {
  let service: GeminiService;
  let prismaMock: ReturnType<typeof createPrismaServiceMock>;
  let cacheMock: ReturnType<typeof createCacheServiceMock>;
  let configMock: ReturnType<typeof createConfigServiceMock>;

  beforeEach(async () => {
    prismaMock = createPrismaServiceMock();
    cacheMock = createCacheServiceMock();
    configMock = createConfigServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        { provide: ConfigService, useValue: configMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: CacheService, useValue: cacheMock },
      ],
    }).compile();

    service = module.get(GeminiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return fallback response when Gemini API key is not configured', async () => {
    const message: ChatMessageDto = {
      mensaje: 'Necesito algo ligero',
    };

    const response = await service.generateRecommendation(message, 1);

    expect(response.sessionId).toBeDefined();
    expect(response.respuesta).toBeTruthy();
    expect(response.recomendaciones?.length).toBeGreaterThan(0);
    expect(response.metadata?.isFallback).toBe(true);
    expect(prismaMock.registro_chat.create).toHaveBeenCalled();
    expect(cacheMock.cacheConversation).toHaveBeenCalled();
  });

  it('should map chat history records correctly', async () => {
    const history = await service.getChatHistory(1);

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      id: 10,
      usuario_id: 1,
      session_id: 'chat_session',
    });
    expect(typeof history[0].timestamp).toBe('string');
  });

  it('should clear chat history and related cache', async () => {
    const deleted = await service.clearChatHistory(1);

    expect(deleted).toBe(1);
    expect(prismaMock.registro_chat.deleteMany).toHaveBeenCalledWith({
      where: { usuario_id: 1 },
    });
    expect(cacheMock.clearUserCache).toHaveBeenCalledWith(1);
  });

  it('should throw when mensaje is missing', async () => {
    await expect(
      service.generateRecommendation({} as ChatMessageDto, 1),
    ).rejects.toMatchObject({
      status: 400,
    });
  });
});
