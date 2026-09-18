import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import { StorageTestResult } from './local-storage.provider';

export interface S3Config {
  endpoint?: string;
  region?: string;
  bucket: string;
  prefix?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

@Injectable()
export class S3StorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);

  async testStorage(config: S3Config): Promise<StorageTestResult> {
    const start = Date.now();
    const endpoint = config.endpoint || (config.region ? `s3.${config.region}.amazonaws.com` : 's3.amazonaws.com');
    const cleanHost = endpoint.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
    const port = endpoint.includes(':') ? Number(endpoint.split(':')[1]) : endpoint.startsWith('http://') ? 80 : 443;

    try {
      // Test TCP connectivity to S3 / MinIO endpoint
      await new Promise<void>((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(6000);
        socket.on('connect', () => {
          socket.destroy();
          resolve();
        });
        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error(`Timeout connecting to storage endpoint ${cleanHost}:${port}`));
        });
        socket.on('error', (err) => {
          socket.destroy();
          reject(err);
        });
        socket.connect(port, cleanHost);
      });

      const latencyMs = Date.now() - start;

      return {
        success: true,
        latencyMs,
        message: `S3 endpoint '${endpoint}' is reachable for bucket '${config.bucket}'`,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return {
        success: false,
        latencyMs,
        message: `S3 storage connection failed: ${err.message}`,
      };
    }
  }
}
