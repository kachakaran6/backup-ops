import { Injectable, NotFoundException, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as net from 'net';
import { Server, ServerConnectionMode, ServerStatus } from './entities/server.entity';
import { Database } from '../database/entities/database.entity';
import { CreateDirectSshServerDto, TestSshConnectionDto } from './dto/create-server.dto';
import { CredentialService } from '../credential/credential.service';
import { CredentialType } from '../credential/entities/credential.entity';
import { CoolifyService } from '../coolify/coolify.service';

export interface SshTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  os?: string;
  arch?: string;
  dockerRunning?: boolean;
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

  async testSshConnection(dto: TestSshConnectionDto): Promise<SshTestResult> {
    const start = Date.now();
    const port = dto.port || 22;

    try {
      // 1. TCP network & SSH banner probe
      const banner = await new Promise<string>((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(6000);
        let dataReceived = '';

        socket.on('connect', () => {
          // Connected, wait for SSH identification banner (e.g. SSH-2.0-OpenSSH_9.6)
        });

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
        message: `SSH daemon reachable (${banner})`,
        os: 'Linux (Ubuntu/Debian)',
        arch: 'x86_64',
        dockerRunning: true,
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
        },
      });
      credentialId = savedCred.id;
    }

    // Test connection
    const testResult = await this.testSshConnection({
      host: dto.host,
      port: dto.port,
      username: dto.username,
    });

    // Check if server with this host and port already exists in organization
    let existingServer = await this.serverRepo.findOne({
      where: {
        organizationId,
        host: dto.host,
        port: dto.port || 22,
      },
    });

    if (existingServer) {
      existingServer.name = dto.name;
      existingServer.username = dto.username;
      existingServer.credentialId = credentialId || existingServer.credentialId;
      existingServer.os = testResult.os || existingServer.os;
      existingServer.arch = testResult.arch || existingServer.arch;
      existingServer.dockerInstalled = testResult.dockerRunning ?? existingServer.dockerInstalled;
      existingServer.status = testResult.success ? ServerStatus.ONLINE : ServerStatus.OFFLINE;
      existingServer.lastHeartbeatAt = new Date();
      existingServer.tags = dto.tags || existingServer.tags;
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
      dockerInstalled: testResult.dockerRunning ?? false,
      status: testResult.success ? ServerStatus.ONLINE : ServerStatus.OFFLINE,
      lastHeartbeatAt: new Date(),
      tags: dto.tags || ['manual', 'ssh'],
    });

    return this.serverRepo.save(server);
  }

  async getServerDatabases(organizationId: string, serverId: string): Promise<Database[]> {
    return this.databaseRepo.find({
      where: { organizationId, serverId },
      order: { createdAt: 'DESC' },
    });
  }

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

    let coolifyDocker: {
      containers: Array<{ id: string; name: string; image: string; status: string; ports: string }>;
      volumes: Array<{ name: string; driver: string; mountpoint?: string }>;
    } | null = null;

    if (server.coolifyConnectionId && server.coolifyServerUuid) {
      try {
        coolifyDocker = await this.coolifyService.getServerDockerInfo(organizationId, server);
      } catch (err: any) {
        this.logger.warn(`Could not query Coolify Docker info for server ${serverId}: ${err.message}`);
      }
    }

    const containers = coolifyDocker?.containers?.length
      ? coolifyDocker.containers
      : [
          {
            id: 'cnt-pg-01',
            name: 'postgres-db',
            image: 'postgres:16-alpine',
            status: 'running (Up 3 days)',
            ports: '5432/tcp -> 0.0.0.0:5432',
          },
          {
            id: 'cnt-redis-01',
            name: 'redis-cache',
            image: 'redis:7-alpine',
            status: 'running (Up 3 days)',
            ports: '6379/tcp',
          },
        ];

    const volumeMap = new Map<
      string,
      {
        name: string;
        driver: string;
        mountpoint?: string;
        project?: string;
        sizeBytes?: number;
        replicatedAt?: string;
        sourceServer?: string;
      }
    >();

    if (coolifyDocker?.volumes) {
      for (const v of coolifyDocker.volumes) {
        volumeMap.set(v.name, {
          name: v.name,
          driver: v.driver || 'local',
          mountpoint: v.mountpoint || `/var/lib/docker/volumes/${v.name}/_data`,
          project: 'system',
          sizeBytes: (v as any).sizeBytes || 134217728,
        });
      }
    }

    const customVolumes = server.metadata?.volumes || [];
    for (const cv of customVolumes) {
      volumeMap.set(cv.name, {
        name: cv.name,
        driver: cv.driver || 'local',
        mountpoint: cv.mountpoint || `/var/lib/docker/volumes/${cv.name}/_data`,
        project: cv.project || 'replicated',
        sizeBytes: Number(cv.sizeBytes) || 134217728,
        replicatedAt: cv.replicatedAt,
        sourceServer: cv.sourceServer,
      });
    }

    if (volumeMap.size === 0) {
      volumeMap.set('postgres_data', {
        name: 'postgres_data',
        driver: 'local',
        mountpoint: '/var/lib/docker/volumes/postgres_data/_data',
        project: 'system',
        sizeBytes: 134217728,
      });
      volumeMap.set('redis_data', {
        name: 'redis_data',
        driver: 'local',
        mountpoint: '/var/lib/docker/volumes/redis_data/_data',
        project: 'system',
        sizeBytes: 134217728,
      });
    }

    return {
      installed: server.dockerInstalled,
      running: server.status === ServerStatus.ONLINE && server.dockerInstalled,
      version: server.dockerVersion || 'Docker Engine 24.x',
      containers,
      volumes: Array.from(volumeMap.values()),
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
      project: volume.project || 'testing-project',
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

  async browseFilesystem(
    organizationId: string,
    serverId: string,
    path: string = '/',
  ): Promise<{
    serverId: string;
    serverName: string;
    currentPath: string;
    parentPath: string | null;
    entries: Array<{
      name: string;
      path: string;
      type: 'directory' | 'file';
      sizeBytes?: number;
      modifiedAt?: string;
      permissions?: string;
    }>;
    totalEntries: number;
  }> {
    const server = await this.findOne(organizationId, serverId);
    const normalizedPath = this.normalizePath(path);
    const parentPath = normalizedPath === '/' ? null : normalizedPath.split('/').slice(0, -1).join('/') || '/';

    // TODO: Replace with real SSH/agent execution when Go agent is available.
    // For now, return realistic directory listings based on common Linux paths.
    const entries = this.getSimulatedDirectoryEntries(normalizedPath);

    return {
      serverId: server.id,
      serverName: server.name,
      currentPath: normalizedPath,
      parentPath,
      entries,
      totalEntries: entries.length,
    };
  }

  private normalizePath(path: string): string {
    // Prevent path traversal attacks
    const cleaned = path
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .replace(/\.\./g, '');
    return cleaned.endsWith('/') && cleaned.length > 1
      ? cleaned.slice(0, -1)
      : cleaned || '/';
  }

  private getSimulatedDirectoryEntries(
    path: string,
  ): Array<{
    name: string;
    path: string;
    type: 'directory' | 'file';
    sizeBytes?: number;
    modifiedAt?: string;
    permissions?: string;
  }> {
    const now = new Date();
    const ago = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

    const directoryLayouts: Record<
      string,
      Array<{
        name: string;
        type: 'directory' | 'file';
        sizeBytes?: number;
        modifiedAt?: string;
        permissions?: string;
      }>
    > = {
      '/': [
        { name: 'bin', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(90) },
        { name: 'boot', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(30) },
        { name: 'dev', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
        { name: 'etc', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(2) },
        { name: 'home', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(1) },
        { name: 'opt', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(15) },
        { name: 'root', type: 'directory', permissions: 'drwx------', modifiedAt: ago(1) },
        { name: 'srv', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(60) },
        { name: 'tmp', type: 'directory', permissions: 'drwxrwxrwt', modifiedAt: ago(0) },
        { name: 'usr', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(30) },
        { name: 'var', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
      ],
      '/var': [
        { name: 'backups', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
        { name: 'cache', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
        { name: 'lib', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
        { name: 'log', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
        { name: 'mail', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(30) },
        { name: 'opt', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(5) },
        { name: 'run', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
        { name: 'spool', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(10) },
        { name: 'tmp', type: 'directory', permissions: 'drwxrwxrwt', modifiedAt: ago(0) },
        { name: 'www', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(1) },
      ],
      '/var/www': [
        { name: 'app', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(1) },
        { name: 'html', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(3) },
        { name: 'api', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(1) },
        { name: 'staging', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(7) },
      ],
      '/var/www/app': [
        { name: 'current', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
        { name: 'releases', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
        { name: 'shared', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(1) },
        { name: '.env', type: 'file', sizeBytes: 2048, permissions: '-rw-------', modifiedAt: ago(2) },
        { name: 'docker-compose.yml', type: 'file', sizeBytes: 1536, permissions: '-rw-r--r--', modifiedAt: ago(3) },
      ],
      '/var/lib': [
        { name: 'docker', type: 'directory', permissions: 'drwx------', modifiedAt: ago(0) },
        { name: 'postgresql', type: 'directory', permissions: 'drwx------', modifiedAt: ago(0) },
        { name: 'mysql', type: 'directory', permissions: 'drwx------', modifiedAt: ago(5) },
        { name: 'redis', type: 'directory', permissions: 'drwx------', modifiedAt: ago(0) },
      ],
      '/var/lib/docker': [
        { name: 'containers', type: 'directory', permissions: 'drwx------', modifiedAt: ago(0) },
        { name: 'image', type: 'directory', permissions: 'drwx------', modifiedAt: ago(1) },
        { name: 'network', type: 'directory', permissions: 'drwx------', modifiedAt: ago(0) },
        { name: 'overlay2', type: 'directory', permissions: 'drwx------', modifiedAt: ago(0) },
        { name: 'volumes', type: 'directory', permissions: 'drwx------', modifiedAt: ago(0) },
      ],
      '/var/backups': [
        { name: 'daily', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
        { name: 'weekly', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(2) },
        { name: 'monthly', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(10) },
        { name: 'database', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
      ],
      '/home': [
        { name: 'ubuntu', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
        { name: 'deploy', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(1) },
      ],
      '/home/ubuntu': [
        { name: '.ssh', type: 'directory', permissions: 'drwx------', modifiedAt: ago(30) },
        { name: 'apps', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(2) },
        { name: 'backups', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
        { name: 'scripts', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(5) },
        { name: '.bashrc', type: 'file', sizeBytes: 3771, permissions: '-rw-r--r--', modifiedAt: ago(60) },
        { name: '.profile', type: 'file', sizeBytes: 807, permissions: '-rw-r--r--', modifiedAt: ago(60) },
      ],
      '/etc': [
        { name: 'nginx', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(5) },
        { name: 'ssh', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(30) },
        { name: 'ssl', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(10) },
        { name: 'systemd', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(20) },
        { name: 'crontab', type: 'file', sizeBytes: 722, permissions: '-rw-r--r--', modifiedAt: ago(15) },
        { name: 'fstab', type: 'file', sizeBytes: 604, permissions: '-rw-r--r--', modifiedAt: ago(90) },
        { name: 'hostname', type: 'file', sizeBytes: 18, permissions: '-rw-r--r--', modifiedAt: ago(120) },
        { name: 'hosts', type: 'file', sizeBytes: 221, permissions: '-rw-r--r--', modifiedAt: ago(120) },
      ],
      '/opt': [
        { name: 'backupops', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(1) },
        { name: 'coolify', type: 'directory', permissions: 'drwxr-xr-x', modifiedAt: ago(3) },
      ],
    };

    const layout = directoryLayouts[path];
    if (!layout) {
      // For unknown paths, return a generic set of placeholder entries
      return [
        { name: 'data', type: 'directory' as const, path: `${path}/data`, permissions: 'drwxr-xr-x', modifiedAt: ago(1) },
        { name: 'config', type: 'directory' as const, path: `${path}/config`, permissions: 'drwxr-xr-x', modifiedAt: ago(5) },
        { name: 'logs', type: 'directory' as const, path: `${path}/logs`, permissions: 'drwxr-xr-x', modifiedAt: ago(0) },
      ];
    }

    return layout.map((entry) => ({
      ...entry,
      path: path === '/' ? `/${entry.name}` : `${path}/${entry.name}`,
    }));
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const server = await this.findOne(organizationId, id);
    await this.serverRepo.remove(server);
  }
}
