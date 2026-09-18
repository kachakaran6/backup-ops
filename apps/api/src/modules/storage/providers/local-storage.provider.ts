import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface StorageTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  totalCapacityBytes?: number;
  availableCapacityBytes?: number;
  usedCapacityBytes?: number;
}

@Injectable()
export class LocalStorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);

  async testStorage(targetPath: string): Promise<StorageTestResult> {
    const start = Date.now();
    const resolvedPath = path.resolve(targetPath);

    try {
      // 1. Ensure directory exists
      if (!fs.existsSync(resolvedPath)) {
        fs.mkdirSync(resolvedPath, { recursive: true });
      }

      // 2. Check read and write permissions
      fs.accessSync(resolvedPath, fs.constants.R_OK | fs.constants.W_OK);

      // 3. Write, read, checksum, and delete a probe test file
      const probeFilename = `.backupops_probe_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.tmp`;
      const probePath = path.join(resolvedPath, probeFilename);
      const testData = `BackupOps storage verification probe - ${new Date().toISOString()}`;

      fs.writeFileSync(probePath, testData, { encoding: 'utf8' });
      const readData = fs.readFileSync(probePath, { encoding: 'utf8' });

      if (readData !== testData) {
        throw new Error('Integrity check failed: read data did not match written probe data');
      }

      fs.unlinkSync(probePath);

      // 4. Calculate filesystem capacity if statfs is supported
      let totalBytes: number | undefined;
      let availableBytes: number | undefined;
      let usedBytes: number | undefined;

      try {
        if (typeof (fs as any).statfsSync === 'function') {
          const stats = (fs as any).statfsSync(resolvedPath);
          totalBytes = Number(stats.blocks) * Number(stats.bsize);
          availableBytes = Number(stats.bavail) * Number(stats.bsize);
          usedBytes = totalBytes - availableBytes;
        }
      } catch (err: any) {
        this.logger.debug(`Could not query statfs for ${resolvedPath}: ${err.message}`);
      }

      const latencyMs = Date.now() - start;

      return {
        success: true,
        latencyMs,
        message: `Local storage verified at '${resolvedPath}' (read/write probe confirmed)`,
        totalCapacityBytes: totalBytes,
        availableCapacityBytes: availableBytes,
        usedCapacityBytes: usedBytes,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return {
        success: false,
        latencyMs,
        message: `Local storage test failed: ${err.message}`,
      };
    }
  }
}
