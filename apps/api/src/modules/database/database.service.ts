import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Database,
  DatabaseProtectionStatus,
  DatabaseRecoveryReadiness,
  DatabaseStatus,
  DatabaseType,
} from './entities/database.entity';
import { Backup } from '../backup/entities/backup.entity';
import { BackupChain, BackupChainStatus } from '../backup/entities/backup-chain.entity';
import { CreateDatabaseDto, TestDatabaseDto } from './dto/create-database.dto';
import { PostgreSqlProvider } from './providers/postgresql.provider';
import { RedisProvider } from './providers/redis.provider';
import { CredentialService } from '../credential/credential.service';
import { CredentialType } from '../credential/entities/credential.entity';
import { DatabaseConnectionTestResult, WalStatusResult } from './providers/database-provider.interface';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectRepository(Database)
    private databaseRepo: Repository<Database>,
    @InjectRepository(Backup)
    private backupRepo: Repository<Backup>,
    @InjectRepository(BackupChain)
    private chainRepo: Repository<BackupChain>,
    private pgProvider: PostgreSqlProvider,
    private redisProvider: RedisProvider,
    private credentialService: CredentialService,
  ) {}

  async findAll(organizationId: string): Promise<Database[]> {
    return this.databaseRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<Database> {
    const db = await this.databaseRepo.findOne({
      where: { id, organizationId },
    });
    if (!db) {
      throw new NotFoundException(`Database ${id} not found`);
    }
    return db;
  }

  async testConnection(dto: TestDatabaseDto): Promise<DatabaseConnectionTestResult> {
    if (dto.type === DatabaseType.REDIS || dto.port === 6379) {
      return this.redisProvider.testConnection({
        host: dto.host,
        port: dto.port || 6379,
        database: dto.databaseName || '0',
        user: dto.username || 'default',
        password: dto.password,
      });
    }

    return this.pgProvider.testConnection({
      host: dto.host,
      port: dto.port || 5432,
      database: dto.databaseName,
      user: dto.username || 'postgres',
      password: dto.password,
    });
  }

  async create(organizationId: string, dto: CreateDatabaseDto): Promise<Database> {
    let credentialId = dto.credentialId;
    if (!credentialId && dto.password) {
      const cred = await this.credentialService.create(organizationId, {
        name: `Credentials for ${dto.name}`,
        type: CredentialType.DATABASE_PASSWORD,
        secretPayload: {
          username: dto.username || (dto.type === DatabaseType.REDIS ? 'default' : 'postgres'),
          password: dto.password,
        },
      });
      credentialId = cred.id;
    }

    // Run connection test
    const testRes =
      dto.type === DatabaseType.REDIS || dto.port === 6379
        ? await this.redisProvider.testConnection({
            host: dto.host,
            port: dto.port || 6379,
            database: dto.databaseName || '0',
            user: dto.username || 'default',
            password: dto.password,
          })
        : await this.pgProvider.testConnection({
            host: dto.host,
            port: dto.port || 5432,
            database: dto.databaseName,
            user: dto.username || 'postgres',
            password: dto.password,
          });

    const db = this.databaseRepo.create({
      organizationId,
      serverId: dto.serverId,
      name: dto.name,
      type: dto.type || DatabaseType.POSTGRES,
      version: testRes.version,
      host: dto.host,
      port: dto.port || (dto.type === DatabaseType.REDIS ? 6379 : 5432),
      databaseName: dto.databaseName || (dto.type === DatabaseType.REDIS ? '0' : 'postgres'),
      username: dto.username || (dto.type === DatabaseType.REDIS ? 'default' : 'postgres'),
      credentialId,
      status: testRes.success ? DatabaseStatus.CONNECTED : DatabaseStatus.UNREACHABLE,
      protectionStatus: dto.protectionStatus || DatabaseProtectionStatus.PROTECTED,
      sizeBytes: testRes.sizeBytes,
      tableCount: testRes.tableCount,
      activeConnections: testRes.activeConnections,
      walEnabled: testRes.walEnabled ?? false,
      walStatus: testRes.walStatus || 'unknown',
      recoveryReadiness:
        dto.type === DatabaseType.REDIS
          ? testRes.success
            ? DatabaseRecoveryReadiness.READY
            : DatabaseRecoveryReadiness.DEGRADED
          : testRes.walEnabled
          ? DatabaseRecoveryReadiness.READY
          : DatabaseRecoveryReadiness.DEGRADED,
    });

    return this.databaseRepo.save(db);
  }

  async testExistingDatabase(organizationId: string, id: string): Promise<DatabaseConnectionTestResult> {
    const db = await this.findOne(organizationId, id);
    let password = undefined;

    if (db.credentialId) {
      try {
        const secret = await this.credentialService.decryptSecret(db.credentialId);
        password = secret.password;
      } catch (err: any) {
        this.logger.warn(`Could not decrypt credential for database ${id}: ${err.message}`);
      }
    }

    const testRes =
      db.type === DatabaseType.REDIS || db.port === 6379
        ? await this.redisProvider.testConnection({
            host: db.host,
            port: db.port || 6379,
            database: db.databaseName || '0',
            user: db.username || 'default',
            password,
          })
        : await this.pgProvider.testConnection({
            host: db.host,
            port: db.port,
            database: db.databaseName,
            user: db.username || 'postgres',
            password,
          });

    // Update database record with fresh stats
    db.status = testRes.success ? DatabaseStatus.CONNECTED : DatabaseStatus.UNREACHABLE;
    if (testRes.version) db.version = testRes.version;
    if (testRes.sizeBytes !== undefined) db.sizeBytes = testRes.sizeBytes;
    if (testRes.tableCount !== undefined) db.tableCount = testRes.tableCount;
    if (testRes.activeConnections !== undefined) db.activeConnections = testRes.activeConnections;
    if (testRes.walEnabled !== undefined) db.walEnabled = testRes.walEnabled;
    if (testRes.walStatus) db.walStatus = testRes.walStatus;
    db.recoveryReadiness =
      db.type === DatabaseType.REDIS
        ? testRes.success
          ? DatabaseRecoveryReadiness.READY
          : DatabaseRecoveryReadiness.DEGRADED
        : testRes.walEnabled
        ? DatabaseRecoveryReadiness.READY
        : DatabaseRecoveryReadiness.DEGRADED;

    await this.databaseRepo.save(db);
    return testRes;
  }

  async getRecoveryStatus(organizationId: string, id: string): Promise<{
    databaseId: string;
    databaseName: string;
    baseBackup?: { id: string; timestamp: Date; sizeBytes: number; status: string };
    walStatus: WalStatusResult;
    recoveryChain: {
      chainId?: string;
      status: string;
      totalPoints: number;
      lastValidPoint?: Date;
    };
    recoveryReadiness: string;
  }> {
    const db = await this.findOne(organizationId, id);

    let password = undefined;
    if (db.credentialId) {
      try {
        const secret = await this.credentialService.decryptSecret(db.credentialId);
        password = secret.password;
      } catch {}
    }

    const walStatus = await this.pgProvider.getWalStatus({
      host: db.host,
      port: db.port,
      database: db.databaseName,
      user: db.username || 'postgres',
      password,
    });

    // Find latest base backup and chain
    const latestBackup = await this.backupRepo.findOne({
      where: { organizationId, sourceDatabaseId: id },
      order: { createdAt: 'DESC' },
    });

    const chain = await this.chainRepo.findOne({
      where: { organizationId, sourceDatabaseId: id, status: BackupChainStatus.HEALTHY },
      order: { createdAt: 'DESC' },
    });

    return {
      databaseId: db.id,
      databaseName: db.name,
      baseBackup: latestBackup
        ? {
            id: latestBackup.id,
            timestamp: latestBackup.createdAt,
            sizeBytes: latestBackup.sizeBytes,
            status: latestBackup.verificationState,
          }
        : undefined,
      walStatus,
      recoveryChain: {
        chainId: chain?.id,
        status: chain?.status || 'none',
        totalPoints: chain?.backupCount || (latestBackup ? 1 : 0),
        lastValidPoint: chain?.lastValidPoint || latestBackup?.createdAt,
      },
      recoveryReadiness: latestBackup && walStatus.isReadyForPitr ? 'READY' : latestBackup ? 'DEGRADED' : 'UNPREPARED',
    };
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const db = await this.findOne(organizationId, id);
    await this.databaseRepo.remove(db);
  }
}
