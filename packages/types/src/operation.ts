import { z } from 'zod';

export enum OperationType {
  COPY = 'copy',
  MOVE = 'move',
  BACKUP = 'backup',
  RESTORE = 'restore',
  SYNC = 'sync',
  MIRROR = 'mirror',
  VERIFY = 'verify',
  ARCHIVE = 'archive',
  DELETE = 'delete',
  PRUNE = 'prune',
}

export enum CompressionType {
  NONE = 'none',
  GZIP = 'gzip',
  ZSTD = 'zstd',
  LZ4 = 'lz4',
}

export enum EncryptionType {
  NONE = 'none',
  AES_256_GCM = 'aes_256_gcm',
  CHACHA20_POLY1305 = 'chacha20_poly1305',
}

export interface OperationOptions {
  compression?: CompressionType;
  encryption?: EncryptionType;
  dryRun?: boolean;
  verifyChecksum?: boolean;
  bandwidthLimitKbps?: number;
  concurrency?: number;
  deleteAfterMove?: boolean;
  excludePatterns?: string[];
  includePatterns?: string[];
}

export const OperationOptionsSchema = z.object({
  compression: z.nativeEnum(CompressionType).default(CompressionType.NONE),
  encryption: z.nativeEnum(EncryptionType).default(EncryptionType.NONE),
  dryRun: z.boolean().default(false),
  verifyChecksum: z.boolean().default(true),
  bandwidthLimitKbps: z.number().optional(),
  concurrency: z.number().default(1),
  deleteAfterMove: z.boolean().default(false),
  excludePatterns: z.array(z.string()).default([]),
  includePatterns: z.array(z.string()).default([]),
});
