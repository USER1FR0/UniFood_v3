import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../services/prisma.service';

describe('ChatController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockUser = {
    id: 1,
    correo_electronico: 'test@example.com',
    rol: 'cliente',
  };

  const mockJwtToken = 'mock-jwt-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Mock JWT authentication
    jest.spyOn(require('../middlewares/auth.middleware'), 'JwtAuthGuard')
      .mockImplementation(() => ({
        canActivate: () => true,
      }));
  });

  describe('/chat/message (POST)', () => {
    it('should send a chat message and receive a response', async () => {
      const chatMessage = {
        mensaje: 'Quiero recomendaciones de comida saludable',
        sessionId: 'test-session-123',
      };

      const response = await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(chatMessage)
        .expect(201);

      expect(response.body).toHaveProperty('respuesta');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.sessionId).toBe('test-session-123');
    });

    it('should handle empty message', async () => {
      const chatMessage = {
        mensaje: '',
      };

      await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(chatMessage)
        .expect(400);
    });

    it('should handle missing message field', async () => {
      const chatMessage = {};

      await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send(chatMessage)
        .expect(400);
    });
  });

  describe('/chat/history (GET)', () => {
    it('should return chat history for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/chat/history')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('/chat/history/:sessionId (GET)', () => {
    it('should return chat history for specific session', async () => {
      const sessionId = 'test-session-123';

      const response = await request(app.getHttpServer())
        .get(`/chat/history/${sessionId}`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('/chat/clear-history (POST)', () => {
    it('should clear chat history for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .post('/chat/clear-history')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('cleared');
    });
  });

  describe('Authentication', () => {
    it('should reject requests without JWT token', async () => {
      const chatMessage = {
        mensaje: 'Test message',
      };

      await request(app.getHttpServer())
        .post('/chat/message')
        .send(chatMessage)
        .expect(401);
    });

    it('should reject requests with invalid JWT token', async () => {
      const chatMessage = {
        mensaje: 'Test message',
      };

      await request(app.getHttpServer())
        .post('/chat/message')
        .set('Authorization', 'Bearer invalid-token')
        .send(chatMessage)
        .expect(401);
    });
  });
});
