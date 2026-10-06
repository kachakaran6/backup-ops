import { Injectable, NotFoundException, BadRequestException, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { Server, ServerConnectionMode, ServerStatus } from './entities/server.entity';
import { Database } from '../database/entities/database.entity';
import { CreateDirectSshServerDto, TestSshConnectionDto } from './dto/create-server.dto';
import { CredentialService } from '../credential/credential.service';
import { CredentialType } from '../credential/entities/credential.entity';
import { CoolifyService } from '../coolify/coolify.service';
import { SshProviderService, FilesystemEntry } from './ssh-provider.service';

export interface SshTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  hostname?: string;
  os?: string;
  arch?: string;
  kernel?: string;
  cpuCores?: number;
  memoryBytes?: number;
  diskBytes?: number;
  diskAvailableBytes?: number;
  dockerInstalled?: boolean;
  dockerVersion?: string;
  capabilities?: string[];
  details?: Record<string, any>;
}

@Injectable()
export class ServerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ServerService.name);

  constructor(
    @InjectRepository(Server)
    private serverRepo: Repository<Server>,
    @InjectRepository(Database)
    private databaseRepo: Repository<Database>,
    private credentialService: CredentialService,
    private coolifyService: CoolifyService,
    private sshProvider: SshProviderService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.deduplicateServers('default');
    } catch (err: any) {
      this.logger.warn(`Server deduplication on bootstrap skipped: ${err.message}`);
    }
  }

  async deduplicateServers(organizationId: string): Promise<number> {
    const servers = await this.serverRepo.find({ where: { organizationId } });
    const seenByKey = new Map<string, Server>();
    let removedCount = 0;

    for (const s of servers) {
      const coolifyKey = s.coolifyServerUuid
        ? `coolify:${s.coolifyConnectionId || 'none'}:${s.coolifyServerUuid}`
        : null;
      const hostKey = s.host ? `host:${s.host}:${s.port || 22}` : null;

      const canonical =
        (coolifyKey ? seenByKey.get(coolifyKey) : null) ||
        (hostKey ? seenByKey.get(hostKey) : null);

      if (!canonical) {
        if (coolifyKey) seenByKey.set(coolifyKey, s);
        if (hostKey) seenByKey.set(hostKey, s);
      } else {
        this.logger.warn(
          `Found duplicate server: ${s.name} (${s.id}) matching canonical ${canonical.name} (${canonical.id}). Deduplicating...`,
        );

        // Safely reassign child databases
        await this.databaseRepo.update({ serverId: s.id }, { serverId: canonical.id });
        await this.serverRepo.remove(s);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.log(`Server deduplication completed: safely removed ${removedCount} duplicate server records.`);
    }
    return removedCount;
  }

  async findAll(organizationId: string): Promise<Server[]> {
    return this.serverRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<Server> {
    const server = await this.serverRepo.findOne({
      where: { id, organizationId },
    });
    if (!server) {
      throw new NotFoundException(`Server ${id} not found`);
    }
    return server;
  }

  /**
   * Tests SSH connection with real authentication and capability discovery.
   */
  async testSshConnection(dto: TestSshConnectionDto): Promise<SshTestResult> {
    const start = Date.now();
    const port = dto.port || 22;

    // If password or privateKey is provided, perform authenticated discovery
    if (dto.password || dto.privateKey) {
      const discovery = await this.sshProvider.discoverServer({
        host: dto.host,
        port,
        username: dto.username || 'root',
        password: dto.password,
        privateKey: dto.privateKey,
        passphrase: dto.passphrase,
      });

      return {
        success: discovery.success,
        latencyMs: discovery.latencyMs,
        message: discovery.message,
        hostname: discovery.hostname,
        os: discovery.os,
        arch: discovery.arch,
        kernel: discovery.kernel,
        cpuCores: discovery.cpuCores,
        memoryBytes: discovery.memoryBytes,
        diskBytes: discovery.diskBytes,
        diskAvailableBytes: discovery.diskAvailableBytes,
        dockerInstalled: discovery.dockerInstalled,
        dockerVersion: discovery.dockerVersion,
        capabilities: discovery.capabilities,
      };
    }

    // Otherwise, perform TCP / banner reachability probe without fabricating server OS/arch
    try {
      const banner = await new Promise<string>((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(6000);
        let dataReceived = '';

        socket.on('connect', () => {});

        socket.on('data', (chunk) => {
          dataReceived += chunk.toString();
          if (dataReceived.includes('SSH-')) {
            socket.destroy();
            resolve(dataReceived.trim());
          }
        });

        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error(`Timeout connecting to ${dto.host}:${port}`));
        });

        socket.on('error', (err) => {
          socket.destroy();
          reject(err);
        });

        socket.connect(port, dto.host);
      });

      const latencyMs = Date.now() - start;

      return {
        success: true,
        latencyMs,
        message: `SSH daemon reachable (${banner}). Authentication credentials required for full discovery.`,
        dockerInstalled: false,
        capabilities: ['ssh'],
        details: {
          banner,
          host: dto.host,
          port,
          user: dto.username,
        },
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return {
        success: false,
        latencyMs,
        message: `Connection failed: ${err.message}`,
        dockerInstalled: false,
        capabilities: [],
      };
    }
  }

  async createDirectSshServer(
    organizationId: string,
    dto: CreateDirectSshServerDto,
  ): Promise<Server> {
    // If credential was passed directly as privateKey/password, save it securely
    let credentialId = dto.credentialId;
    if (!credentialId && (dto.privateKey || dto.password)) {
      const savedCred = await this.credentialService.create(organizationId, {
        name: `SSH Credential for ${dto.name}`,
        type: dto.privateKey ? CredentialType.SSH_KEY : CredentialType.PASSWORD,
        secretPayload: {
          username: dto.username,
          privateKey: dto.privateKey,
          password: dto.password,
          passphrase: dto.passphrase,
        },
      });
      credentialId = savedCred.id;
    }

    // Resolve credentials for authenticated discovery
    let resolvedPassword = dto.password;
    let resolvedPrivateKey = dto.privateKey;
    let resolvedPassphrase = dto.passphrase;

    if (credentialId && !resolvedPassword && !resolvedPrivateKey) {
      try {
        const secret = await this.credentialService.decryptSecret(credentialId);
        resolvedPassword = secret.password;
        resolvedPrivateKey = secret.privateKey;
        resolvedPassphrase = secret.passphrase;
      } catch (err: any) {
        this.logger.warn(`Could not decrypt credential ${credentialId} for server discovery: ${err.message}`);
      }
    }

    // Perform real authenticated server discovery
    const testResult = await this.testSshConnection({
      host: dto.host,
      port: dto.port,
      username: dto.username,
      password: resolvedPassword,
      privateKey: resolvedPrivateKey,
      passphrase: resolvedPassphrase,
    });

    // Check if server with this host and port already exists in organization
    let existingServer = await this.serverRepo.findOne({
      where: {
        organizationId,
        host: dto.host,
        port: dto.port || 22,
      },
    });

    const metadata = {
      ...(existingServer?.metadata || {}),
      latencyMs: testResult.latencyMs,
      capabilities: testResult.capabilities || ['ssh', 'filesystemBrowse', 'filesystemTransfer'],
      diskAvailableBytes: testResult.diskAvailableBytes,
      hostname: testResult.hostname,
    };

    if (existingServer) {
      existingServer.name = dto.name;
      existingServer.username = dto.username;
      existingServer.credentialId = credentialId || existingServer.credentialId;
      existingServer.os = testResult.os || existingServer.os;
      existingServer.arch = testResult.arch || existingServer.arch;
      existingServer.kernel = testResult.kernel || existingServer.kernel;
      existingServer.cpuCores = testResult.cpuCores ?? existingServer.cpuCores;
      existingServer.memoryBytes = testResult.memoryBytes ?? existingServer.memoryBytes;
      existingServer.diskBytes = testResult.diskBytes ?? existingServer.diskBytes;
      existingServer.dockerInstalled = testResult.dockerInstalled ?? existingServer.dockerInstalled;
      existingServer.dockerVersion = testResult.dockerVersion || existingServer.dockerVersion;
      existingServer.status = testResult.success ? ServerStatus.ONLINE : ServerStatus.OFFLINE;
      existingServer.lastHeartbeatAt = new Date();
      existingServer.tags = dto.tags || existingServer.tags;
      existingServer.metadata = metadata;
      return this.serverRepo.save(existingServer);
    }

    const server = this.serverRepo.create({
      organizationId,
      name: dto.name,
      connectionMode: ServerConnectionMode.SSH,
      host: dto.host,
      port: dto.port || 22,
      username: dto.username,
      credentialId,
      os: testResult.os || 'Linux',
      arch: testResult.arch || 'x86_64',
      kernel: testResult.kernel,
      cpuCores: testResult.cpuCores || 1,
      memoryBytes: testResult.memoryBytes,
      diskBytes: testResult.diskBytes,
      dockerInstalled: testResult.dockerInstalled ?? false,
      dockerVersion: testResult.dockerVersion,
      status: testResult.success ? ServerStatus.ONLINE : ServerStatus.OFFLINE,
      lastHeartbeatAt: new Date(),
      tags: dto.tags || ['manual', 'ssh'],
      metadata,
    });

    return this.serverRepo.save(server);
  }

  async getServerDatabases(organizationId: string, serverId: string): Promise<Database[]> {
    return this.databaseRepo.find({
      where: { organizationId, serverId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Queries real Docker containers and volumes for a server.
   * NEVER fabricates fake containers or volumes.
   */
  async getServerDocker(organizationId: string, serverId: string): Promise<{
    installed: boolean;
    running: boolean;
    version?: string;
    containers: Array<{ id: string; name: string; image: string; status: string; ports: string }>;
    volumes: Array<{
      name: string;
      driver: string;
      mountpoint?: string;
      project?: string;
      sizeBytes?: number;
      replicatedAt?: string;
      sourceServer?: string;
    }>;
  }> {
    const server = await this.findOne(organizationId, serverId);

    // If Coolify server, query Coolify API
    if (server.coolifyConnectionId && server.coolifyServerUuid) {
      try {
        const coolifyDocker = await this.coolifyService.getServerDockerInfo(organizationId, server);
        if (coolifyDocker) {
          return {
            installed: true,
            running: true,
            version: server.dockerVersion || 'Docker Engine (Coolify)',
            containers: coolifyDocker.containers || [],
            volumes: (coolifyDocker.volumes || []).map((v) => ({
              name: v.name,
              driver: v.driver || 'local',
              mountpoint: v.mountpoint || `/var/lib/docker/volumes/${v.name}/_data`,
              project: 'system',
              sizeBytes: (v as any).sizeBytes,
            })),
          };
        }
      } catch (err: any) {
        this.logger.warn(`Could not query Coolify Docker info for server ${serverId}: ${err.message}`);
      }
    }

    // If SSH server with credentials, query real Docker over SSH
    if (server.credentialId && server.host) {
      try {
        const secret = await this.credentialService.decryptSecret(server.credentialId);
        const dockerInfo = await this.sshProvider.getDockerInfo({
          host: server.host,
          port: server.port || 22,
          username: server.username || secret.username || 'root',
          password: secret.password,
          privateKey: secret.privateKey,
          passphrase: secret.passphrase,
        });

        if (dockerInfo.installed) {
          return {
            installed: dockerInfo.installed,
            running: dockerInfo.running,
            version: dockerInfo.version || server.dockerVersion,
            containers: dockerInfo.containers,
            volumes: dockerInfo.volumes,
          };
        }
      } catch (err: any) {
        this.logger.warn(`SSH Docker inspection failed for server ${serverId}: ${err.message}`);
      }
    }

    // If Docker is not available or inspection failed, return empty lists honestly
    return {
      installed: server.dockerInstalled,
      running: server.status === ServerStatus.ONLINE && server.dockerInstalled,
      version: server.dockerVersion,
      containers: [],
      volumes: [],
    };
  }

  async addServerVolume(
    organizationId: string,
    serverId: string,
    volume: { name: string; driver?: string; mountpoint?: string; project?: string },
  ): Promise<{ name: string; driver: string; mountpoint: string; project?: string }> {
    const server = await this.findOne(organizationId, serverId);
    const metadata = server.metadata || {};
    const volumes = metadata.volumes || [];
    const newVol = {
      name: volume.name,
      driver: volume.driver || 'local',
      mountpoint: volume.mountpoint || `/var/lib/docker/volumes/${volume.name}/_data`,
      project: volume.project || 'custom',
      addedAt: new Date().toISOString(),
    };
    const existingIdx = volumes.findIndex((v: any) => v.name === volume.name);
    if (existingIdx >= 0) {
      volumes[existingIdx] = newVol;
    } else {
      volumes.push(newVol);
    }
    metadata.volumes = volumes;
    server.metadata = metadata;
    await this.serverRepo.save(server);
    return newVol;
  }

  /**
   * Real Filesystem Browsing:
   * 1. Validates and normalizes paths strictly to prevent directory traversal.
   * 2. For local servers: queries the local filesystem via Node.js fs.
   * 3. For SSH servers: authenticates using encrypted credential and executes real SFTP directory listing.
   * 4. NEVER returns simulated or hardcoded directories.
   */
  async browseFilesystem(
    organizationId: string,
    serverId: string,
    rawPath: string = '/',
  ): Promise<{
    serverId: string;
    serverName: string;
    currentPath: string;
    parentPath: string | null;
    entries: FilesystemEntry[];
    totalEntries: number;
  }> {
    const server = await this.findOne(organizationId, serverId);
    const normalizedPath = this.sshProvider.normalizePath(rawPath);
    const parentPath =
      normalizedPath === '/'
        ? null
        : normalizedPath.split('/').slice(0, -1).join('/') || '/';

    const isLocal =
      !server.host ||
      server.host === 'localhost' ||
      server.host === '127.0.0.1' ||
      !server.credentialId;

    let entries: FilesystemEntry[] = [];

    if (isLocal) {
      // Real Local Filesystem Browsing
      entries = await this.browseLocalFilesystem(normalizedPath);
    } else {
      // Real Remote SFTP Filesystem Browsing
      if (!server.credentialId) {
        throw new BadRequestException(
          `Filesystem browsing is unavailable: server '${server.name}' does not have credentials configured.`,
        );
      }

      const secret = await this.credentialService.decryptSecret(server.credentialId);
      entries = await this.sshProvider.browseFilesystem(
        {
          host: server.host,
          port: server.port || 22,
          username: server.username || secret.username || 'root',
          password: secret.password,
          privateKey: secret.privateKey,
          passphrase: secret.passphrase,
        },
        normalizedPath,
      );
    }

    return {
      serverId: server.id,
      serverName: server.name,
      currentPath: normalizedPath,
      parentPath,
      entries,
      totalEntries: entries.length,
    };
  }

  /**
   * Real Local Filesystem Reader
   */
  private async browseLocalFilesystem(normalizedPath: string): Promise<FilesystemEntry[]> {
    // Resolve path for local operating system
    const targetDir = path.resolve(normalizedPath);

    if (!fs.existsSync(targetDir)) {
      throw new NotFoundException(`Local directory not found: ${normalizedPath}`);
    }

    try {
      const dirEntries = await fs.promises.readdir(targetDir, { withFileTypes: true });
      const results: FilesystemEntry[] = [];

      for (const entry of dirEntries) {
        const fullItemPath = path.posix.join(normalizedPath, entry.name);
        const localItemPath = path.join(targetDir, entry.name);
        let sizeBytes: number | undefined;
        let modifiedAt: string | undefined;
        let permissions: string | undefined;

        try {
          const stats = fs.statSync(localItemPath);
          sizeBytes = entry.isFile() ? stats.size : undefined;
          modifiedAt = stats.mtime.toISOString();
          permissions = this.formatLocalPermissions(stats.mode, entry.isDirectory());
        } catch {}

        results.push({
          name: entry.name,
          path: fullItemPath,
          type: entry.isDirectory() ? 'directory' : 'file',
          sizeBytes,
          modifiedAt,
          permissions,
        });
      }

      return results;
    } catch (err: any) {
      throw new BadRequestException(`Failed to read local filesystem at '${normalizedPath}': ${err.message}`);
    }
  }

  private formatLocalPermissions(mode: number, isDirectory: boolean): string {
    const userRead = mode & 0o400 ? 'r' : '-';
    const userWrite = mode & 0o200 ? 'w' : '-';
    const userExec = mode & 0o100 ? 'x' : '-';
    const groupRead = mode & 0o040 ? 'r' : '-';
    const groupWrite = mode & 0o020 ? 'w' : '-';
    const groupExec = mode & 0o010 ? 'x' : '-';
    const otherRead = mode & 0o004 ? 'r' : '-';
    const otherWrite = mode & 0o002 ? 'w' : '-';
    const otherExec = mode & 0o001 ? 'x' : '-';

    return `${isDirectory ? 'd' : '-'}${userRead}${userWrite}${userExec}${groupRead}${groupWrite}${groupExec}${otherRead}${otherWrite}${otherExec}`;
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const server = await this.findOne(organizationId, id);
    await this.serverRepo.remove(server);
  }
}
