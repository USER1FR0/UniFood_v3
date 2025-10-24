import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: string; expiry?: number }> = new Map();
  private useRedis = false;

  constructor(private readonly configService: ConfigService) {
    const driver =
      this.configService.get<string>('CACHE_DRIVER', 'memory').toLowerCase();
    const redisEnabled =
      this.configService.get<string>('REDIS_ENABLED', 'false').toLowerCase() ===
      'true';

    this.useRedis = driver === 'redis' || redisEnabled;

    if (this.useRedis) {
      this.initializeRedis();
    } else {
      this.logger.log('CacheService running with in-memory driver');
    }
  }

  private initializeRedis(): void {
    try {
      this.redis = new Redis({
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get<string>('REDIS_PASSWORD', ''),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
        this.useRedis = false;
      });

      this.redis.on('close', () => {
        this.logger.warn('Redis connection closed');
      });

      this.useRedis = true;
      this.logger.log('Redis driver initialised');
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      this.redis = null;
      this.useRedis = false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.redis) {
        return await this.redis.get(key);
      } else {
        // Usar memoria cache
        const cachedValue = this.memoryCache.get(key);
        if (cachedValue) {
          if (!cachedValue.expiry || cachedValue.expiry > Date.now()) {
            return cachedValue.value;
          } else {
            // Expirado, eliminar
            this.memoryCache.delete(key);
          }
        }
        return null;
      }
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (this.redis) {
        if (ttlSeconds) {
          await this.redis.setex(key, ttlSeconds, value);
        } else {
          await this.redis.set(key, value);
        }
      } else {
        // Usar memoria cache
        const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
        this.memoryCache.set(key, { value, expiry });
      }
      return true;
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.redis || !this.useRedis) {
        const cachedValue = this.memoryCache.get(key);
        if (!cachedValue) {
          return false;
        }
        if (!cachedValue.expiry || cachedValue.expiry > Date.now()) {
          return true;
        }
        this.memoryCache.delete(key);
        return false;
      }
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      if (!this.redis || !this.useRedis) {
        const cachedValue = this.memoryCache.get(key);
        if (!cachedValue) {
          return false;
        }
        const expiry = Date.now() + ttlSeconds * 1000;
        this.memoryCache.set(key, { value: cachedValue.value, expiry });
        return true;
      }
      await this.redis.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      this.logger.error(`Error setting expiry for key ${key}:`, error);
      return false;
    }
  }

  async getHash(key: string, field: string): Promise<string | null> {
    try {
      if (!this.redis) {
        this.logger.warn('Redis not initialized');
        return null;
      }
      return await this.redis.hget(key, field);
    } catch (error) {
      this.logger.error(`Error getting hash field ${field} from key ${key}:`, error);
      return null;
    }
  }

  async setHash(key: string, field: string, value: string): Promise<boolean> {
    try {
      if (!this.redis) {
        this.logger.warn('Redis not initialized');
        return false;
      }
      await this.redis.hset(key, field, value);
      return true;
    } catch (error) {
      this.logger.error(`Error setting hash field ${field} for key ${key}:`, error);
      return false;
    }
  }

  async getAllHash(key: string): Promise<Record<string, string> | null> {
    try {
      if (!this.redis) {
        this.logger.warn('Redis not initialized');
        return null;
      }
      return await this.redis.hgetall(key);
    } catch (error) {
      this.logger.error(`Error getting all hash fields for key ${key}:`, error);
      return null;
    }
  }

  async deleteHash(key: string, field: string): Promise<boolean> {
    try {
      if (!this.redis) {
        this.logger.warn('Redis not initialized');
        return false;
      }
      await this.redis.hdel(key, field);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting hash field ${field} from key ${key}:`, error);
      return false;
    }
  }

  // Métodos específicos para el sistema de chat
  async cacheUserContext(userId: number, context: any, ttlSeconds: number = 3600): Promise<boolean> {
    const key = `user_context_${userId}`;
    return await this.set(key, JSON.stringify(context), ttlSeconds);
  }

  async getUserContext(userId: number): Promise<any | null> {
    const key = `user_context_${userId}`;
    const context = await this.get(key);
    return context ? JSON.parse(context) : null;
  }

  async cacheConversation(
    sessionId: string,
    conversation: any,
    ttlSeconds: number = 3600,
    userId?: number,
  ): Promise<boolean> {
    const key = this.buildConversationKey(sessionId, userId);
    return await this.set(key, JSON.stringify(conversation), ttlSeconds);
  }

  async getConversation(sessionId: string, userId?: number): Promise<any | null> {
    const key = this.buildConversationKey(sessionId, userId);
    const conversation = await this.get(key);
    return conversation ? JSON.parse(conversation) : null;
  }

  async cacheAvailableProducts(products: any[], ttlSeconds: number = 1800): Promise<boolean> {
    const key = 'available_products';
    return await this.set(key, JSON.stringify(products), ttlSeconds);
  }

  async getAvailableProducts(): Promise<any[] | null> {
    const key = 'available_products';
    const products = await this.get(key);
    return products ? JSON.parse(products) : null;
  }

  async incrementChatCounter(userId: number): Promise<number> {
    const key = `chat_counter_${userId}`;
    try {
      if (!this.redis || !this.useRedis) {
        const current = this.memoryCache.get(key);
        const nextValue = current ? parseInt(current.value, 10) + 1 : 1;
        this.memoryCache.set(key, { value: String(nextValue) });
        return nextValue;
      }
      return await this.redis.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing chat counter for user ${userId}:`, error);
      return 0;
    }
  }

  async getChatCounter(userId: number): Promise<number> {
    const key = `chat_counter_${userId}`;
    try {
      if (!this.redis || !this.useRedis) {
        const cachedValue = this.memoryCache.get(key);
        if (!cachedValue) {
          return 0;
        }
        if (!cachedValue.expiry || cachedValue.expiry > Date.now()) {
          return parseInt(cachedValue.value, 10) || 0;
        }
        this.memoryCache.delete(key);
        return 0;
      }
      const count = await this.redis.get(key);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      this.logger.error(`Error getting chat counter for user ${userId}:`, error);
      return 0;
    }
  }

  async clearUserCache(userId: number): Promise<boolean> {
    try {
      if (this.redis) {
        const patterns = [
          `user_context_${userId}`,
          `chat_counter_${userId}`,
          `conversation_${userId}_*`,
        ];

        for (const pattern of patterns) {
          if (pattern.includes('*')) {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
              await this.redis.del(...keys);
            }
          } else {
            await this.redis.del(pattern);
          }
        }
      } else {
        // Limpiar memoria cache
        const keysToDelete: string[] = [];
        this.memoryCache.forEach((_, key) => {
          if (key.includes(`${userId}`)) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(key => this.memoryCache.delete(key));
      }

      return true;
    } catch (error) {
      this.logger.error(`Error clearing cache for user ${userId}:`, error);
      return false;
    }
  }

  async getRedisInfo(): Promise<any> {
    try {
      if (!this.redis) {
        return { status: 'disconnected', error: 'Redis not initialized' };
      }

      const info = await this.redis.info();
      const memory = await this.redis.memory('STATS');
      const keyspace = await this.redis.info('keyspace');

      return {
        status: 'connected',
        memory: memory,
        keyspace: keyspace,
        uptime: await this.redis.info('server'),
      };
    } catch (error) {
      this.logger.error('Error getting Redis info:', error);
      return { status: 'error', error: error.message };
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
        this.logger.log('Disconnected from Redis');
      }
    } catch (error) {
      this.logger.error('Error disconnecting from Redis:', error);
    }
  }

  private buildConversationKey(sessionId: string, userId?: number): string {
    const sanitizedSession = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (userId) {
      return `conversation_${userId}_${sanitizedSession}`;
    }
    return `conversation_${sanitizedSession}`;
  }
}
