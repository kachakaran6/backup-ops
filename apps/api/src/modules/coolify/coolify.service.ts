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
import { CredentialService } from '../credential/credential.service';
import { CredentialType } from '../credential/entities/credential.entity';

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
    private credentialService: CredentialService,
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
          if (type.includes('database') || type.includes('postgres') || type.includes('mysql') || type.includes('mariadb') || type.includes('redis')) {
            processedDbUuids.add(res.uuid);
            // Fetch detailed database object if possible
            const fullDb = await this.coolifyProvider.getDatabase(conn.url, token, res.uuid);
            await this.reconcileCoolifyDatabase(organizationId, conn, fullDb || res, server);
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
        await this.reconcileCoolifyDatabase(organizationId, conn, gdb);
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

  private async reconcileCoolifyDatabase(
    organizationId: string,
    conn: CoolifyConnection,
    gdb: any,
    defaultServer?: Server,
  ): Promise<Database> {
    const rawType = (gdb.database_type || gdb.type || '').toLowerCase();
    const rawImage = (gdb.image || '').toLowerCase();
    const rawName = (gdb.name || '').toLowerCase();
    const rawUrl = (gdb.external_db_url || gdb.internal_db_url || '').toLowerCase();

    let dbType = DatabaseType.POSTGRES;
    if (rawType.includes('redis') || rawImage.includes('redis') || rawName.includes('redis') || rawUrl.startsWith('redis://')) {
      dbType = DatabaseType.REDIS;
    } else if (rawType.includes('mysql') || rawImage.includes('mysql') || rawName.includes('mysql') || rawUrl.startsWith('mysql://')) {
      dbType = DatabaseType.MYSQL;
    } else if (rawType.includes('mariadb') || rawImage.includes('mariadb') || rawName.includes('mariadb') || rawUrl.startsWith('mariadb://')) {
      dbType = DatabaseType.MARIADB;
    } else if (rawType.includes('mongo') || rawImage.includes('mongo') || rawName.includes('mongo') || rawUrl.startsWith('mongodb://')) {
      dbType = DatabaseType.MONGODB;
    }

    // Determine host, port, credentials
    let username = gdb.postgres_user || (dbType === DatabaseType.REDIS ? 'default' : 'postgres');
    let password = gdb.postgres_password || gdb.redis_password || gdb.mysql_password || gdb.mariadb_password || undefined;
    let dbName = gdb.postgres_db || gdb.database_name || (dbType === DatabaseType.REDIS ? '0' : 'postgres');
    let port = gdb.public_port ? Number(gdb.public_port) : (dbType === DatabaseType.REDIS ? 6379 : 5432);
    let host = gdb.destination?.server?.ip || gdb.server?.ip || defaultServer?.host || '127.0.0.1';

    // Parse external_db_url or internal_db_url if present
    const dbUrlToParse = gdb.external_db_url || gdb.internal_db_url;
    if (dbUrlToParse) {
      try {
        const parsed = new URL(dbUrlToParse);
        if (parsed.username) username = decodeURIComponent(parsed.username);
        if (parsed.password) password = decodeURIComponent(parsed.password);
        if (parsed.pathname && parsed.pathname !== '/') {
          dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
        }
        if (gdb.external_db_url && parsed.hostname && !parsed.hostname.includes('.internal')) {
          host = parsed.hostname;
        }
        if (parsed.port) {
          port = Number(parsed.port);
        }
      } catch (err: any) {
        this.logger.debug(`Could not parse database URL for ${gdb.name}: ${err.message}`);
      }
    }

    if (gdb.public_port) {
      port = Number(gdb.public_port);
    }

    // Save or update credentials in CredentialService
    let credentialId: string | undefined = undefined;
    if (password) {
      try {
        const credName = `Coolify DB Credentials - ${gdb.name || gdb.uuid}`;
        const existingCreds = await this.credentialService.findAll(organizationId);
        const existingCred = existingCreds.find((c) => c.name === credName);
        if (existingCred) {
          await this.credentialService.update(organizationId, existingCred.id, {
            secretPayload: { username, password },
          });
          credentialId = existingCred.id;
        } else {
          const newCred = await this.credentialService.create(organizationId, {
            name: credName,
            type: CredentialType.DATABASE_PASSWORD,
            secretPayload: { username, password },
          });
          credentialId = newCred.id;
        }
      } catch (err: any) {
        this.logger.warn(`Could not save credentials for database ${gdb.name}: ${err.message}`);
      }
    }

    // Determine status from Coolify telemetry
    const rawStatus = (gdb.status || '').toLowerCase();
    let status = DatabaseStatus.UNKNOWN;
    if (rawStatus.includes('running') || rawStatus.includes('healthy')) {
      status = DatabaseStatus.CONNECTED;
    } else if (rawStatus.includes('exited') || rawStatus.includes('stopped')) {
      status = DatabaseStatus.DISCONNECTED;
    }

    // Find or create Database entity
    let db = await this.databaseRepo.findOne({
      where: {
        organizationId,
        coolifyConnectionId: conn.id,
        coolifyResourceUuid: gdb.uuid,
      },
    });

    const serverUuid = gdb.destination?.server?.uuid || gdb.server?.uuid || defaultServer?.coolifyServerUuid;
    let serverRecord = serverUuid
      ? await this.serverRepo.findOne({ where: { organizationId, coolifyServerUuid: serverUuid } })
      : defaultServer;

    if (!db) {
      db = this.databaseRepo.create({
        organizationId,
        serverId: serverRecord?.id,
        coolifyConnectionId: conn.id,
        coolifyResourceUuid: gdb.uuid,
        name: gdb.name || `Coolify ${dbType} (${gdb.uuid.slice(0, 8)})`,
        type: dbType,
        host,
        port,
        username,
        databaseName: dbName,
        credentialId,
        status,
        protectionStatus: DatabaseProtectionStatus.DISCOVERED,
        recoveryReadiness: DatabaseRecoveryReadiness.READY,
        metadata: gdb,
      });
    } else {
      db.name = gdb.name || db.name;
      db.type = dbType;
      db.host = host;
      db.port = port;
      db.username = username;
      db.databaseName = dbName;
      if (credentialId) db.credentialId = credentialId;
      db.status = status;
      if (serverRecord) db.serverId = serverRecord.id;
      db.metadata = gdb;
    }

    return this.databaseRepo.save(db);
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
