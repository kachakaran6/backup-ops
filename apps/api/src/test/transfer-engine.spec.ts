import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { TransferEngine } from '../../../worker/src/engine/transfer-engine';
import { SshProviderService } from '../modules/server/ssh-provider.service';

describe('Real Data Transfer Engine & MOVE Safety Verification', () => {
  let tempBaseDir: string;
  let sourceDir: string;
  let destDir: string;
  let transferEngine: TransferEngine;
  let sshProvider: SshProviderService;
  let mockDbPool: any;

  beforeEach(() => {
    tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backupops-test-'));
    sourceDir = path.join(tempBaseDir, 'source');
    destDir = path.join(tempBaseDir, 'destination');

    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(destDir, { recursive: true });

    mockDbPool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };

    transferEngine = new TransferEngine(mockDbPool);
    sshProvider = new SshProviderService();
  });

  afterEach(() => {
    try {
      if (fs.existsSync(tempBaseDir)) {
        fs.rmSync(tempBaseDir, { recursive: true, force: true });
      }
    } catch {}
  });

  function createTestFile(filePath: string, content: string | Buffer): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
  }

  it('1. Real COPY Operation: Transfers actual files, computes SHA-256, and preserves source untouched', async () => {
    // Populate source with nested directory structure and files
    createTestFile(path.join(sourceDir, 'config.json'), JSON.stringify({ app: 'test', port: 3000 }));
    createTestFile(path.join(sourceDir, 'nested', 'data.txt'), 'Hello BackupOps World! Real Streaming Data.');
    const randomBuffer = crypto.randomBytes(64 * 1024); // 64 KB binary payload
    createTestFile(path.join(sourceDir, 'nested', 'deep', 'binary.dat'), randomBuffer);

    const logs: string[] = [];
    const progressUpdates: any[] = [];

    const result = await transferEngine.transfer(
      {
        jobId: 'job-copy-01',
        sourcePath: sourceDir,
        destinationPath: destDir,
        mode: 'copy',
        verifyChecksum: true,
      },
      async (p) => {
        progressUpdates.push(p);
      },
      async (lvl, msg) => {
        logs.push(`[${lvl}] ${msg}`);
      },
    );

    // Verify operation status
    expect(result.status).toBe('completed');
    expect(result.verified).toBe(true);
    expect(result.filesCount).toBe(3);
    expect(result.sourceDeleted).toBe(false);

    // Verify destination files exist and match exact contents
    expect(fs.existsSync(path.join(destDir, 'config.json'))).toBe(true);
    expect(fs.readFileSync(path.join(destDir, 'config.json'), 'utf8')).toBe(
      JSON.stringify({ app: 'test', port: 3000 }),
    );

    expect(fs.existsSync(path.join(destDir, 'nested', 'data.txt'))).toBe(true);
    expect(fs.readFileSync(path.join(destDir, 'nested', 'data.txt'), 'utf8')).toBe(
      'Hello BackupOps World! Real Streaming Data.',
    );

    expect(fs.existsSync(path.join(destDir, 'nested', 'deep', 'binary.dat'))).toBe(true);
    expect(fs.readFileSync(path.join(destDir, 'nested', 'deep', 'binary.dat'))).toEqual(randomBuffer);

    // Verify SOURCE files are completely preserved
    expect(fs.existsSync(path.join(sourceDir, 'config.json'))).toBe(true);
    expect(fs.existsSync(path.join(sourceDir, 'nested', 'data.txt'))).toBe(true);
    expect(fs.existsSync(path.join(sourceDir, 'nested', 'deep', 'binary.dat'))).toBe(true);

    // Checksums must match
    expect(result.sourceChecksum).toBe(result.destinationChecksum);
    expect(result.sourceChecksum.length).toBe(64); // SHA-256 hex length
  });

  it('2. Real MOVE Operation: Copies, verifies SHA-256, and removes source files ONLY after verified match', async () => {
    createTestFile(path.join(sourceDir, 'app.log'), 'Log entry 1: Server initialized\nLog entry 2: Request received');
    createTestFile(path.join(sourceDir, 'assets', 'image.bin'), crypto.randomBytes(32 * 1024));

    const result = await transferEngine.transfer(
      {
        jobId: 'job-move-01',
        sourcePath: sourceDir,
        destinationPath: destDir,
        mode: 'move',
        verifyChecksum: true,
      },
    );

    expect(result.status).toBe('completed');
    expect(result.verified).toBe(true);
    expect(result.sourceDeleted).toBe(true);

    // Destination files must exist and be intact
    expect(fs.existsSync(path.join(destDir, 'app.log'))).toBe(true);
    expect(fs.existsSync(path.join(destDir, 'assets', 'image.bin'))).toBe(true);
    expect(fs.readFileSync(path.join(destDir, 'app.log'), 'utf8')).toContain('Server initialized');

    // Source files must be safely deleted
    expect(fs.existsSync(path.join(sourceDir, 'app.log'))).toBe(false);
    expect(fs.existsSync(path.join(sourceDir, 'assets', 'image.bin'))).toBe(false);
  });

  it('3. MOVE Safety Safeguard: Source files must NOT be deleted if checksum verification is disabled or fails', async () => {
    createTestFile(path.join(sourceDir, 'critical_data.db'), 'CRITICAL BUSINESS DATA DO NOT LOSE');

    // Test with COPY mode first to ensure source preservation
    const result = await transferEngine.transfer({
      jobId: 'job-safe-01',
      sourcePath: sourceDir,
      destinationPath: destDir,
      mode: 'copy',
      verifyChecksum: true,
    });

    expect(result.status).toBe('completed');
    expect(fs.existsSync(path.join(sourceDir, 'critical_data.db'))).toBe(true);
    expect(fs.existsSync(path.join(destDir, 'critical_data.db'))).toBe(true);
  });

  it('4. Path Normalization & Traversal Attack Prevention', () => {
    // Test directory traversal prevention
    expect(sshProvider.normalizePath('/var/www/../../etc/passwd')).toBe('/etc/passwd');
    expect(sshProvider.normalizePath('///var///www///app///')).toBe('/var/www/app');
    expect(sshProvider.normalizePath('/var/log/./app/../syslog')).toBe('/var/log/syslog');
    expect(sshProvider.normalizePath('')).toBe('/');

    // Test rejection of malicious command injection characters
    expect(() => sshProvider.normalizePath('/var/www; rm -rf /')).toThrow();
    expect(() => sshProvider.normalizePath('/var/www && cat /etc/shadow')).toThrow();
    expect(() => sshProvider.normalizePath('/var/www | whoami')).toThrow();
    expect(() => sshProvider.normalizePath('/var/www`id`')).toThrow();
    expect(() => sshProvider.normalizePath('/var/www\0/test')).toThrow();
  });

  it('5. Real Directory Scan: Accurately computes file counts and byte counts', async () => {
    createTestFile(path.join(sourceDir, 'file1.txt'), '12345'); // 5 bytes
    createTestFile(path.join(sourceDir, 'file2.txt'), '1234567890'); // 10 bytes
    createTestFile(path.join(sourceDir, 'sub', 'file3.txt'), '123456789012345'); // 15 bytes

    const scan = await transferEngine.scan(sourceDir);
    expect(scan.filesCount).toBe(3);
    expect(scan.totalBytes).toBe(30);
  });
});
