import {
  Test,
  TestingModule,
} from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/services/prisma.service';
import { CacheService } from '../src/services/cache.service';

describe('ChatController (e2e)', () => {
  let app: INestApplication;

  const mockUser = {
    id: 1,
    correo_electronico: 'test@example.com',
    rol: 'cliente',
  };

  const mockProducts = [
    {
      id: 1,
      nombre: 'Ensalada Base',
      descripcion: 'Fresca y ligera',
      precio: 60,
      categoria: { nombre: 'Ensaladas' },
      imagen_url: null,
    },
    {
      id: 2,
      nombre: 'Wrap de Pollo',
      descripcion: 'Ideal para llevar',
      precio: 80,
      categoria: { nombre: 'Wraps' },
      imagen_url: null,
    },
  ];

  const prismaServiceMock = {
    usuario: {
      findUnique: jest.fn(),
    },
    producto: {
      findMany: jest.fn(),
    },
    registro_chat: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const cacheServiceMock = {
    getConversation: jest.fn(),
    cacheConversation: jest.fn(),
    getUserContext: jest.fn(),
    cacheUserContext: jest.fn(),
    getAvailableProducts: jest.fn(),
    cacheAvailableProducts: jest.fn(),
    incrementChatCounter: jest.fn(),
    clearUserCache: jest.fn(),
  };

  beforeAll(async () => {
    prismaServiceMock.usuario.findUnique.mockResolvedValue({
      ...mockUser,
      clientes: [
        {
          pedidos: [],
        },
      ],
    });

    prismaServiceMock.producto.findMany.mockResolvedValue(mockProducts);
    prismaServiceMock.registro_chat.create.mockResolvedValue(undefined);
    prismaServiceMock.registro_chat.findMany.mockResolvedValue([]);
    prismaServiceMock.registro_chat.deleteMany.mockResolvedValue({ count: 0 });

    cacheServiceMock.getConversation.mockResolvedValue(null);
    cacheServiceMock.cacheConversation.mockResolvedValue(true);
    cacheServiceMock.getUserContext.mockResolvedValue(null);
    cacheServiceMock.cacheUserContext.mockResolvedValue(true);
    cacheServiceMock.getAvailableProducts.mockResolvedValue(null);
    cacheServiceMock.cacheAvailableProducts.mockResolvedValue(true);
    cacheServiceMock.incrementChatCounter.mockResolvedValue(1);
    cacheServiceMock.clearUserCache.mockResolvedValue(true);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaServiceMock)
      .overrideProvider(CacheService)
      .useValue(cacheServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    prismaServiceMock.usuario.findUnique.mockResolvedValue({
      ...mockUser,
      clientes: [
        {
          pedidos: [],
        },
      ],
    });

    prismaServiceMock.producto.findMany.mockResolvedValue(mockProducts);
    prismaServiceMock.registro_chat.create.mockResolvedValue(undefined);
    prismaServiceMock.registro_chat.findMany.mockResolvedValue([]);
    prismaServiceMock.registro_chat.deleteMany.mockResolvedValue({ count: 0 });

    cacheServiceMock.getConversation.mockResolvedValue(null);
    cacheServiceMock.getUserContext.mockResolvedValue(null);
    cacheServiceMock.getAvailableProducts.mockResolvedValue(null);
  });

  describe('/chat/message (POST)', () => {
    it('should send a chat message and receive a fallback response', async () => {
      const chatMessage = {
        mensaje: 'Quiero recomendaciones de comida saludable',
        sessionId: 'test-session-123',
      };

      const response = await request(app.getHttpServer())
        .post('/chat/message')
        .send(chatMessage)
        .expect(201);

      expect(response.body).toHaveProperty('respuesta');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.recomendaciones)).toBe(true);
      expect(response.body.metadata.isFallback).toBe(true);
    });

    it('should reject empty message content', async () => {
      const chatMessage = {
        mensaje: '',
      };

      await request(app.getHttpServer())
        .post('/chat/message')
        .send(chatMessage)
        .expect(400);
    });

    it('should reject missing message field', async () => {
      await request(app.getHttpServer())
        .post('/chat/message')
        .send({})
        .expect(400);
    });
  });

  describe('/chat/history (GET)', () => {
    it('should return chat history for authenticated user', async () => {
      prismaServiceMock.registro_chat.findMany.mockResolvedValueOnce([
        {
          id: 42,
          usuario_id: mockUser.id,
          mensaje_usuario: 'Hola',
          respuesta_gemini: { respuesta: 'Hola!' },
          timestamp: new Date('2024-01-02T00:00:00Z'),
          session_id: 'session-a',
          metadata: { model: 'fallback' },
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/chat/history')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].id).toBe(42);
    });
  });

  describe('/chat/history/:sessionId (GET)', () => {
    it('should return chat history for specific session', async () => {
      prismaServiceMock.registro_chat.findMany.mockResolvedValueOnce([
        {
          id: 43,
          usuario_id: mockUser.id,
          mensaje_usuario: 'Hola',
          respuesta_gemini: { respuesta: 'Hola!' },
          timestamp: new Date('2024-03-02T00:00:00Z'),
          session_id: 'session-b',
          metadata: { model: 'fallback' },
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/chat/history/session-b')
        .expect(200);

      expect(response.body[0].session_id).toBe('session-b');
    });
  });

  describe('/chat/clear-history (POST)', () => {
    it('should clear chat history for authenticated user', async () => {
      prismaServiceMock.registro_chat.deleteMany.mockResolvedValueOnce({
        count: 3,
      });

      const response = await request(app.getHttpServer())
        .post('/chat/clear-history')
        .expect(200);

      expect(response.body.message).toContain('3');
      expect(cacheServiceMock.clearUserCache).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });
  describe('Authentication', () => {
    it('should allow requests without JWT token for now', async () => {
      const response = await request(app.getHttpServer())
        .post('/chat/message')
        .send({ mensaje: 'Hola' })
        .expect(201);

      expect(response.body).toHaveProperty('respuesta');
    });
  });
});
