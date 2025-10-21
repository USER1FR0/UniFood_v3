import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      this.redis = new Redis({
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get<string>('REDIS_PASSWORD', ''),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });

      this.redis.on('close', () => {
        this.logger.warn('Redis connection closed');
      });

    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.redis) {
        this.logger.warn('Redis not initialized');
        return null;
      }
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.redis) {
        this.logger.warn('Redis not initialized');
        return false;
      }
      
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.redis) {
        this.logger.warn('Redis not initialized');
        return false;
      }
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.redis) {
        this.logger.warn('Redis not initialized');
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
      if (!this.redis) {
        this.logger.warn('Redis not initialized');
        return false;
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

  async cacheConversation(sessionId: string, conversation: any, ttlSeconds: number = 3600): Promise<boolean> {
    const key = `conversation_${sessionId}`;
    return await this.set(key, JSON.stringify(conversation), ttlSeconds);
  }

  async getConversation(sessionId: string): Promise<any | null> {
    const key = `conversation_${sessionId}`;
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
      if (!this.redis) {
        this.logger.warn('Redis not initialized');
        return 0;
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
      if (!this.redis) {
        this.logger.warn('Redis not initialized');
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
      const patterns = [
        `user_context_${userId}`,
        `chat_counter_${userId}`,
        `conversation_*_${userId}`,
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
      const memory = await this.redis.memory('usage');
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
}