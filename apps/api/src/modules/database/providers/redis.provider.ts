import { Injectable, Logger } from '@nestjs/common';
import { createClient } from 'redis';
import { DatabaseConnectionConfig, DatabaseConnectionTestResult } from './database-provider.interface';

@Injectable()
export class RedisProvider {
  private readonly logger = new Logger(RedisProvider.name);

  async testConnection(config: DatabaseConnectionConfig): Promise<DatabaseConnectionTestResult> {
    const start = Date.now();
    const authPart = config.password
      ? `${config.user || 'default'}:${encodeURIComponent(config.password)}@`
      : '';
    const redisUrl = `redis://${authPart}${config.host}:${config.port || 6379}/${config.database || '0'}`;

    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
      },
    });

    try {
      await client.connect();
      const pong = await client.ping();
      const info = await client.info();

      // Parse version and used memory from Redis INFO string
      const versionMatch = info.match(/redis_version:([^\r\n]+)/);
      const version = versionMatch ? `Redis ${versionMatch[1]}` : 'Redis';
      const memoryMatch = info.match(/used_memory:([^\r\n]+)/);
      const sizeBytes = memoryMatch ? parseInt(memoryMatch[1], 10) : 0;
      const clientsMatch = info.match(/connected_clients:([^\r\n]+)/);
      const activeConnections = clientsMatch ? parseInt(clientsMatch[1], 10) : 1;

      await client.disconnect();

      return {
        success: pong === 'PONG',
        latencyMs: Date.now() - start,
        message: `Connected successfully to Redis (${version})`,
        version,
        sizeBytes,
        tableCount: 0,
        activeConnections,
        walEnabled: false,
        walStatus: 'disabled',
      };
    } catch (err: any) {
      this.logger.warn(`Redis connection test failed for ${config.host}:${config.port}: ${err.message}`);
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: `Redis connection failed: ${err.message}`,
      };
    }
  }
}
