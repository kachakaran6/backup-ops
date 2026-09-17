import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { OperationProcessor } from './processors/operation.processor';

async function bootstrap() {
  console.log('====================================================');
  console.log(' Starting BackupOps Asynchronous Worker');
  console.log('====================================================');

  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = Number(process.env.REDIS_PORT || 6379);

  const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://backup_ops:backup_ops_password@localhost:5432/backup_ops',
  });

  const processor = new OperationProcessor(
    { host: redisHost, port: redisPort },
    dbPool,
  );

  console.log(`[Worker] Listening on queue: backupops:operations`);
  console.log(`[Worker] Concurrency: 5`);
  console.log(`[Worker] Worker ready for backup, sync, and verification tasks`);

  const shutdown = async () => {
    console.log('[Worker] Gracefully shutting down worker...');
    await processor.close();
    await dbPool.end();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('[Worker] Fatal error on startup:', err);
  process.exit(1);
});
