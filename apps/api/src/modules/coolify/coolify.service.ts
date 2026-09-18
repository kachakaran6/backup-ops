import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  CoolifyConnection,
  CoolifyConnectionStatus,
} from './entities/coolify-connection.entity';
import { CoolifyProvider, ConnectionTestResult } from './coolify.provider';
import { ConnectCoolifyDto } from './dto/connect-coolify.dto';
import { Server, ServerConnectionMode, ServerStatus } from '../server/entities/server.entity';
import {
  Database,
  DatabaseProtectionStatus,
  DatabaseRecoveryReadiness,
  DatabaseStatus,
  DatabaseType,
} from '../database/entities/database.entity';

@Injectable()
export class CoolifyService {
  private readonly logger = new Logger(CoolifyService.name);
  private encryptionKey: Buffer;

  constructor(
    @InjectRepository(CoolifyConnection)
    private coolifyRepo: Repository<CoolifyConnection>,
    @InjectRepository(Server)
    private serverRepo: Repository<Server>,
    @InjectRepository(Database)
    private databaseRepo: Repository<Database>,
    private coolifyProvider: CoolifyProvider,
    private configService: ConfigService,
  ) {
    const rawKey = this.configService.get<string>(
      'BACKUP_OPS_ENCRYPTION_KEY',
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    );
    this.encryptionKey = crypto.createHash('sha256').update(rawKey).digest();
  }

  async testConnection(url: string, token: string): Promise<ConnectionTestResult> {
    return this.coolifyProvider.testConnection(url, token);
  }

  async connect(organizationId: string, dto: ConnectCoolifyDto): Promise<CoolifyConnection> {
    // 1. Validate connectivity
    const testResult = await this.coolifyProvider.testConnection(dto.url, dto.apiToken);
    if (!testResult.success) {
      this.logger.warn(`Coolify connection test failed: ${testResult.message}`);
    }

    // 2. Encrypt token at rest using AES-256-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let ciphertext = cipher.update(dto.apiToken, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    const conn = this.coolifyRepo.create({
      organizationId,
      name: dto.name,
      url: dto.url.replace(/\/+$/, ''),
      encryptedToken: ciphertext,
      tokenIv: iv.toString('hex'),
      tokenAuthTag: authTag,
      coolifyVersion: testResult.version || 'unknown',
      connectionStatus: testResult.success
        ? CoolifyConnectionStatus.CONNECTED
        : CoolifyConnectionStatus.AUTH_FAILED,
      lastError: testResult.success ? undefined : testResult.message,
    });

    const saved = await this.coolifyRepo.save(conn);

    // If successfully connected, perform initial discovery
    if (testResult.success) {
      this.sync(organizationId, saved.id).catch((err) => {
        this.logger.error(`Initial Coolify sync failed: ${err.message}`);
      });
    }

    return saved;
  }

  async findAll(organizationId: string): Promise<CoolifyConnection[]> {
    return this.coolifyRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<CoolifyConnection> {
    const conn = await this.coolifyRepo.findOne({
      where: { id, organizationId },
    });
    if (!conn) {
      throw new NotFoundException(`Coolify connection ${id} not found`);
    }
    return conn;
  }

  async sync(organizationId: string, id: string): Promise<CoolifyConnection> {
    const conn = await this.coolifyRepo
      .createQueryBuilder('conn')
      .addSelect(['conn.encryptedToken', 'conn.tokenIv', 'conn.tokenAuthTag'])
      .where('conn.id = :id AND conn.organizationId = :organizationId', { id, organizationId })
      .getOne();

    if (!conn) {
      throw new NotFoundException(`Coolify connection ${id} not found`);
    }

    const token = this.decryptToken(conn.encryptedToken, conn.tokenIv, conn.tokenAuthTag);

    try {
      this.logger.log(`Starting Coolify discovery for ${conn.name} (${conn.url})`);

      // 1. Discover servers
      const coolifyServers = await this.coolifyProvider.listServers(conn.url, token);
      const processedDbUuids = new Set<string>();
      let applicationsCount = 0;
      let servicesCount = 0;

      for (const cs of coolifyServers) {
        let server = await this.serverRepo.findOne({
          where: {
            organizationId,
            coolifyConnectionId: conn.id,
            coolifyServerUuid: cs.uuid,
          },
        });

        if (!server) {
          // Check if host already exists in organization
          server = await this.serverRepo.findOne({
            where: {
              organizationId,
              host: cs.ip,
            },
          });
          if (server) {
            server.coolifyConnectionId = conn.id;
            server.coolifyServerUuid = cs.uuid;
            server.connectionMode = ServerConnectionMode.COOLIFY;
          } else {
            server = this.serverRepo.create({
              organizationId,
              name: cs.name || `Coolify Server ${cs.ip}`,
              connectionMode: ServerConnectionMode.COOLIFY,
              coolifyConnectionId: conn.id,
              coolifyServerUuid: cs.uuid,
              host: cs.ip,
              port: cs.port || 22,
              username: cs.user || 'root',
              status: cs.is_reachable ? ServerStatus.ONLINE : ServerStatus.OFFLINE,
              dockerInstalled: true, // Coolify servers are Docker hosts
              lastHeartbeatAt: new Date(),
              metadata: {
                description: cs.description,
                isUsable: cs.is_usable,
              },
            });
          }
        } else {
          server.name = cs.name || server.name;
          server.host = cs.ip || server.host;
          server.status = cs.is_reachable ? ServerStatus.ONLINE : ServerStatus.OFFLINE;
          server.lastHeartbeatAt = new Date();
        }
        await this.serverRepo.save(server);

        // 2. Discover resources for this server
        const resources = await this.coolifyProvider.listServerResources(conn.url, token, cs.uuid);
        for (const res of resources) {
          const type = (res.type || '').toLowerCase();
          if (type.includes('database') || type.includes('postgres') || type.includes('mysql') || type.includes('mariadb')) {
            processedDbUuids.add(res.uuid);
            let dbType = DatabaseType.POSTGRES;
            if (type.includes('mysql')) dbType = DatabaseType.MYSQL;
            if (type.includes('mariadb')) dbType = DatabaseType.MARIADB;
            if (type.includes('mongo')) dbType = DatabaseType.MONGODB;
            if (type.includes('redis')) dbType = DatabaseType.REDIS;

            let db = await this.databaseRepo.findOne({
              where: {
                organizationId,
                coolifyConnectionId: conn.id,
                coolifyResourceUuid: res.uuid,
              },
            });

            if (!db) {
              db = this.databaseRepo.create({
                organizationId,
                serverId: server.id,
                coolifyConnectionId: conn.id,
                coolifyResourceUuid: res.uuid,
                name: res.name || `Coolify ${dbType} ${res.uuid.slice(0, 8)}`,
                type: dbType,
                host: server.host,
                port: dbType === DatabaseType.POSTGRES ? 5432 : dbType === DatabaseType.MYSQL ? 3306 : 6379,
                databaseName: res.database_name || 'postgres',
                status: res.status === 'running' ? DatabaseStatus.CONNECTED : DatabaseStatus.UNKNOWN,
                protectionStatus: DatabaseProtectionStatus.DISCOVERED,
                recoveryReadiness: DatabaseRecoveryReadiness.UNKNOWN,
                metadata: res,
              });
            } else {
              db.serverId = server.id;
              db.host = server.host;
              db.status = res.status === 'running' ? DatabaseStatus.CONNECTED : DatabaseStatus.UNKNOWN;
            }
            await this.databaseRepo.save(db);
          } else if (type.includes('application') || type.includes('app')) {
            applicationsCount++;
          } else {
            servicesCount++;
          }
        }
      }

      // Also discover global databases (deduplicating against processed server resources)
      const globalDbs = await this.coolifyProvider.listDatabases(conn.url, token);
      for (const gdb of globalDbs) {
        if (processedDbUuids.has(gdb.uuid)) {
          continue; // Already reconciled via server resource
        }
        processedDbUuids.add(gdb.uuid);

        const type = (gdb.type || '').toLowerCase();
        let dbType = DatabaseType.POSTGRES;
        if (type.includes('mysql')) dbType = DatabaseType.MYSQL;
        if (type.includes('mariadb')) dbType = DatabaseType.MARIADB;
        if (type.includes('mongo')) dbType = DatabaseType.MONGODB;
        if (type.includes('redis')) dbType = DatabaseType.REDIS;

        let db = await this.databaseRepo.findOne({
          where: {
            organizationId,
            coolifyConnectionId: conn.id,
            coolifyResourceUuid: gdb.uuid,
          },
        });

        if (!db) {
          db = this.databaseRepo.create({
            organizationId,
            coolifyConnectionId: conn.id,
            coolifyResourceUuid: gdb.uuid,
            name: gdb.name || `Coolify ${dbType} (${gdb.uuid.slice(0, 8)})`,
            type: dbType,
            host: gdb.server?.ip || '127.0.0.1',
            port: dbType === DatabaseType.POSTGRES ? 5432 : dbType === DatabaseType.MYSQL ? 3306 : 6379,
            databaseName: gdb.database_name || 'postgres',
            status: gdb.status === 'running' ? DatabaseStatus.CONNECTED : DatabaseStatus.UNKNOWN,
            protectionStatus: DatabaseProtectionStatus.DISCOVERED,
            recoveryReadiness: DatabaseRecoveryReadiness.UNKNOWN,
            metadata: gdb,
          });
        } else {
          db.status = gdb.status === 'running' ? DatabaseStatus.CONNECTED : DatabaseStatus.UNKNOWN;
        }
        await this.databaseRepo.save(db);
      }

      // 3. Update connection stats accurately from durable database records
      const serversCount = await this.serverRepo.count({
        where: { organizationId, coolifyConnectionId: conn.id },
      });
      const databasesCount = await this.databaseRepo.count({
        where: { organizationId, coolifyConnectionId: conn.id },
      });

      conn.serversDiscovered = serversCount;
      conn.databasesDiscovered = databasesCount;
      conn.applicationsDiscovered = applicationsCount;
      conn.servicesDiscovered = servicesCount;
      conn.connectionStatus = CoolifyConnectionStatus.CONNECTED;
      conn.lastSyncAt = new Date();
      conn.lastError = undefined;

      const saved = await this.coolifyRepo.save(conn);
      this.logger.log(
        `Coolify sync complete: ${serversCount} servers, ${databasesCount} databases discovered`,
      );
      return saved;
    } catch (err: any) {
      this.logger.error(`Coolify sync failed for ${conn.name}: ${err.message}`);
      conn.connectionStatus = CoolifyConnectionStatus.UNREACHABLE;
      conn.lastError = err.message;
      return this.coolifyRepo.save(conn);
    }
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const conn = await this.findOne(organizationId, id);
    await this.coolifyRepo.remove(conn);
  }

  private decryptToken(ciphertext: string, ivHex: string, authTagHex: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
