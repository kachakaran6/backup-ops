import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Client, ConnectConfig, SFTPWrapper } from 'ssh2';
import * as path from 'path';

export interface SshConfig {
  host: string;
  port?: number;
  username?: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  timeoutMs?: number;
}

export interface DiscoveredServerMetadata {
  success: boolean;
  latencyMs: number;
  hostname?: string;
  os?: string;
  osFamily?: string;
  arch?: string;
  kernel?: string;
  username?: string;
  cpuCores?: number;
  memoryBytes?: number;
  diskBytes?: number;
  diskAvailableBytes?: number;
  dockerInstalled: boolean;
  dockerVersion?: string;
  capabilities: string[];
  message: string;
}

export interface FilesystemEntry {
  name: string;
  path: string;
  type: 'directory' | 'file';
  sizeBytes?: number;
  modifiedAt?: string;
  permissions?: string;
}

export interface DockerContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string;
}

export interface DockerVolumeInfo {
  name: string;
  driver: string;
  mountpoint?: string;
  project?: string;
  sizeBytes?: number;
}

@Injectable()
export class SshProviderService {
  private readonly logger = new Logger(SshProviderService.name);

  /**
   * Strict path normalization and traversal protection.
   */
  normalizePath(inputPath: string): string {
    if (!inputPath || typeof inputPath !== 'string') {
      return '/';
    }

    // Reject null bytes, command separators, or injection attempts
    if (/[\0\r\n;&|`$><]/.test(inputPath)) {
      throw new BadRequestException('Invalid path: special characters or command separators are not permitted.');
    }

    // Convert backslashes to forward slashes
    let normalized = inputPath.replace(/\\/g, '/');

    // Prevent directory traversal
    const segments = normalized.split('/').filter(Boolean);
    const safeSegments: string[] = [];

    for (const seg of segments) {
      if (seg === '.' || seg === '') continue;
      if (seg === '..') {
        if (safeSegments.length > 0) {
          safeSegments.pop();
        }
      } else {
        safeSegments.push(seg);
      }
    }

    const resolved = '/' + safeSegments.join('/');
    return resolved;
  }

  /**
   * Connects to a remote server using SSH2 with real authentication.
   */
  async createClient(config: SshConfig): Promise<Client> {
    return new Promise((resolve, reject) => {
      const client = new Client();
      const timeoutMs = config.timeoutMs || 10000;

      let timer: NodeJS.Timeout | null = setTimeout(() => {
        timer = null;
        try {
          client.end();
        } catch {}
        reject(new Error(`SSH connection to ${config.host}:${config.port || 22} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      client.on('ready', () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        resolve(client);
      });

      client.on('error', (err) => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        reject(err);
      });

      const connectOpts: ConnectConfig = {
        host: config.host,
        port: config.port || 22,
        username: config.username || 'root',
        readyTimeout: timeoutMs,
        keepaliveInterval: 10000,
      };

      if (config.privateKey) {
        connectOpts.privateKey = config.privateKey;
        if (config.passphrase) {
          connectOpts.passphrase = config.passphrase;
        }
      } else if (config.password) {
        connectOpts.password = config.password;
      }

      try {
        client.connect(connectOpts);
      } catch (err) {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        reject(err);
      }
    });
  }

  /**
   * Executes a safe, read-only command on the remote server.
   */
  async execCommand(
    client: Client,
    command: string,
    timeoutMs = 15000,
  ): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | null = setTimeout(() => {
        timer = null;
        reject(new Error(`Command '${command}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      client.exec(command, (err, stream) => {
        if (err) {
          if (timer) clearTimeout(timer);
          return reject(err);
        }

        let stdout = '';
        let stderr = '';

        stream.on('data', (data: Buffer) => {
          stdout += data.toString('utf8');
        });

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString('utf8');
        });

        stream.on('close', (code: number) => {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code: code ?? 0 });
        });
      });
    });
  }

  /**
   * Establishes an SFTP session from an authenticated SSH client.
   */
  async getSftp(client: Client): Promise<SFTPWrapper> {
    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err);
        resolve(sftp);
      });
    });
  }

  /**
   * Executes real authenticated server discovery using safe read-only commands.
   */
  async discoverServer(config: SshConfig): Promise<DiscoveredServerMetadata> {
    const start = Date.now();
    let client: Client | null = null;

    try {
      client = await this.createClient(config);
      const latencyMs = Date.now() - start;

      // Safe multi-command probe script
      const probeScript = [
        'echo "---HOSTNAME---"; hostname 2>/dev/null || uname -n',
        'echo "---UNAME---"; uname -s -m -r 2>/dev/null',
        'echo "---OSRELEASE---"; cat /etc/os-release 2>/dev/null || cat /etc/issue 2>/dev/null || echo ""',
        'echo "---USER---"; id -un 2>/dev/null || whoami 2>/dev/null',
        'echo "---CPU---"; nproc 2>/dev/null || grep -c ^processor /proc/cpuinfo 2>/dev/null || echo "1"',
        'echo "---MEM---"; awk \'/MemTotal/ {print $2*1024}\' /proc/meminfo 2>/dev/null || echo "0"',
        'echo "---DISK---"; df -B1 -P / 2>/dev/null | tail -1 || echo ""',
        'echo "---DOCKER---"; if command -v docker >/dev/null 2>&1; then docker version --format \'{{.Server.Version}}\' 2>/dev/null || docker --version 2>/dev/null || echo "installed"; else echo "none"; fi',
      ].join('; ');

      const { stdout } = await this.execCommand(client, probeScript, 10000);

      // Parse probe output sections
      const sections = this.parseProbeOutput(stdout);

      const hostname = sections['HOSTNAME'] || config.host;
      const unameParts = (sections['UNAME'] || '').split(/\s+/);
      const osFamily = unameParts[0] || 'Linux';
      const arch = unameParts[1] || 'x86_64';
      const kernel = unameParts[2] || '';

      const osRelease = this.parseOsRelease(sections['OSRELEASE'] || '');
      const osName = osRelease.PRETTY_NAME || osRelease.NAME || `${osFamily} (${arch})`;

      const username = sections['USER'] || config.username || 'root';
      const cpuCores = parseInt(sections['CPU'] || '1', 10) || 1;
      const memoryBytes = parseInt(sections['MEM'] || '0', 10) || undefined;

      // Parse disk info from df -B1 -P / output (Filesystem 1024-blocks Used Available Capacity Mounted on)
      let diskBytes: number | undefined;
      let diskAvailableBytes: number | undefined;
      if (sections['DISK']) {
        const dfParts = sections['DISK'].split(/\s+/);
        if (dfParts.length >= 4) {
          diskBytes = parseInt(dfParts[1], 10) || undefined;
          diskAvailableBytes = parseInt(dfParts[3], 10) || undefined;
        }
      }

      // Docker detection
      const dockerOut = sections['DOCKER'] || 'none';
      const dockerInstalled = dockerOut !== 'none' && dockerOut.length > 0;
      const dockerVersion = dockerInstalled && dockerOut !== 'installed' ? dockerOut : undefined;

      const capabilities = [
        'filesystemBrowse',
        'filesystemRead',
        'filesystemWrite',
        'filesystemTransfer',
        'ssh',
      ];
      if (dockerInstalled) capabilities.push('docker');

      client.end();

      return {
        success: true,
        latencyMs,
        hostname,
        os: osName,
        osFamily,
        arch,
        kernel,
        username,
        cpuCores,
        memoryBytes,
        diskBytes,
        diskAvailableBytes,
        dockerInstalled,
        dockerVersion,
        capabilities,
        message: `Authenticated successfully via SSH (${latencyMs}ms)`,
      };
    } catch (err: any) {
      if (client) {
        try {
          client.end();
        } catch {}
      }
      const latencyMs = Date.now() - start;
      return {
        success: false,
        latencyMs,
        dockerInstalled: false,
        capabilities: [],
        message: `SSH authentication failed: ${err.message || err}`,
      };
    }
  }

  /**
   * Queries real Docker containers and volumes over SSH.
   */
  async getDockerInfo(config: SshConfig): Promise<{
    installed: boolean;
    running: boolean;
    version?: string;
    containers: DockerContainerInfo[];
    volumes: DockerVolumeInfo[];
  }> {
    let client: Client | null = null;
    try {
      client = await this.createClient(config);

      // Check Docker version & daemon status
      const verCheck = await this.execCommand(
        client,
        'docker version --format \'{{.Server.Version}}\' 2>/dev/null || echo "OFFLINE"',
      );
      if (verCheck.code !== 0 || verCheck.stdout.includes('OFFLINE') || !verCheck.stdout) {
        client.end();
        return { installed: false, running: false, containers: [], volumes: [] };
      }

      const version = verCheck.stdout;

      // Query containers
      const containerCmd =
        'docker ps -a --format \'{"id":"{{.ID}}","name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","ports":"{{.Ports}}"}\' 2>/dev/null';
      const containerRes = await this.execCommand(client, containerCmd);
      const containers: DockerContainerInfo[] = [];

      if (containerRes.stdout) {
        const lines = containerRes.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            containers.push(parsed);
          } catch {}
        }
      }

      // Query volumes
      const volumeCmd =
        'docker volume ls --format \'{"name":"{{.Name}}","driver":"{{.Driver}}"}\' 2>/dev/null';
      const volumeRes = await this.execCommand(client, volumeCmd);
      const volumes: DockerVolumeInfo[] = [];

      if (volumeRes.stdout) {
        const lines = volumeRes.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            volumes.push({
              name: parsed.name,
              driver: parsed.driver || 'local',
              mountpoint: `/var/lib/docker/volumes/${parsed.name}/_data`,
            });
          } catch {}
        }
      }

      client.end();
      return {
        installed: true,
        running: true,
        version,
        containers,
        volumes,
      };
    } catch (err: any) {
      if (client) {
        try {
          client.end();
        } catch {}
      }
      this.logger.warn(`Docker query over SSH failed: ${err.message}`);
      return { installed: false, running: false, containers: [], volumes: [] };
    }
  }

  /**
   * Browses real remote filesystem using SFTP.
   */
  async browseFilesystem(config: SshConfig, targetPath: string): Promise<FilesystemEntry[]> {
    const normalized = this.normalizePath(targetPath);
    let client: Client | null = null;

    try {
      client = await this.createClient(config);
      const sftp = await this.getSftp(client);

      const entries: FilesystemEntry[] = await new Promise((resolve, reject) => {
        sftp.readdir(normalized, (err, list) => {
          if (err) {
            return reject(err);
          }

          const items: FilesystemEntry[] = list.map((item) => {
            const isDir = (item.attrs.mode & 0o40000) === 0o40000;
            const fullItemPath =
              normalized === '/' ? `/${item.filename}` : `${normalized}/${item.filename}`;
            const mtimeMs = item.attrs.mtime ? item.attrs.mtime * 1000 : undefined;

            return {
              name: item.filename,
              path: fullItemPath,
              type: isDir ? 'directory' : 'file',
              sizeBytes: isDir ? undefined : item.attrs.size,
              modifiedAt: mtimeMs ? new Date(mtimeMs).toISOString() : undefined,
              permissions: this.formatPermissions(item.attrs.mode),
            };
          });

          resolve(items);
        });
      });

      client.end();
      return entries;
    } catch (err: any) {
      if (client) {
        try {
          client.end();
        } catch {}
      }
      this.logger.error(`SFTP readdir failed for '${normalized}': ${err.message}`);
      throw new NotFoundException(`Filesystem browsing unavailable for path '${normalized}': ${err.message}`);
    }
  }

  /**
   * Checks real path status, existence, readability, and capacity on remote server.
   */
  async checkPathCapacity(
    config: SshConfig,
    targetPath: string,
  ): Promise<{
    exists: boolean;
    readable: boolean;
    writable: boolean;
    isDirectory: boolean;
    availableBytes?: number;
    totalBytes?: number;
  }> {
    const normalized = this.normalizePath(targetPath);
    let client: Client | null = null;

    try {
      client = await this.createClient(config);

      // Check existence and file type via test and stat
      const checkScript = [
        `if [ -e "${normalized}" ]; then echo "EXISTS:1"; else echo "EXISTS:0"; fi`,
        `if [ -r "${normalized}" ]; then echo "READABLE:1"; else echo "READABLE:0"; fi`,
        `if [ -w "${normalized}" ]; then echo "WRITABLE:1"; else echo "WRITABLE:0"; fi`,
        `if [ -d "${normalized}" ]; then echo "ISDIR:1"; else echo "ISDIR:0"; fi`,
        `df -B1 -P "${normalized}" 2>/dev/null | tail -1 || df -B1 -P "$(dirname "${normalized}")" 2>/dev/null | tail -1 || echo ""`,
      ].join('; ');

      const { stdout } = await this.execCommand(client, checkScript, 8000);
      const lines = stdout.split('\n').map((l) => l.trim());

      const exists = lines.some((l) => l === 'EXISTS:1');
      const readable = lines.some((l) => l === 'READABLE:1');
      const writable = lines.some((l) => l === 'WRITABLE:1');
      const isDirectory = lines.some((l) => l === 'ISDIR:1');

      let totalBytes: number | undefined;
      let availableBytes: number | undefined;

      const dfLine = lines.find((l) => /^\S+\s+\d+\s+\d+\s+\d+/.test(l));
      if (dfLine) {
        const parts = dfLine.split(/\s+/);
        if (parts.length >= 4) {
          totalBytes = parseInt(parts[1], 10) || undefined;
          availableBytes = parseInt(parts[3], 10) || undefined;
        }
      }

      client.end();
      return {
        exists,
        readable,
        writable,
        isDirectory,
        availableBytes,
        totalBytes,
      };
    } catch (err: any) {
      if (client) {
        try {
          client.end();
        } catch {}
      }
      return {
        exists: false,
        readable: false,
        writable: false,
        isDirectory: false,
      };
    }
  }

  /**
   * Scans a remote directory via SSH commands to get exact real file count and total bytes.
   */
  async scanRemoteDirectory(
    config: SshConfig,
    dirPath: string,
  ): Promise<{ totalBytes: number; totalFiles: number; files: Array<{ relPath: string; size: number }> }> {
    const normalized = this.normalizePath(dirPath);
    let client: Client | null = null;

    try {
      client = await this.createClient(config);

      // Fast, safe find command that outputs: size\trelative_path
      const scanCmd = `cd "${normalized}" 2>/dev/null && find . -type f -exec stat -c '%s\t%n' {} + 2>/dev/null || cd "${normalized}" 2>/dev/null && find . -type f -exec stat -f '%z\t%N' {} + 2>/dev/null || echo ""`;
      const { stdout } = await this.execCommand(client, scanCmd, 30000);

      const files: Array<{ relPath: string; size: number }> = [];
      let totalBytes = 0;

      if (stdout) {
        const lines = stdout.split('\n').map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          const parts = line.split('\t');
          if (parts.length >= 2) {
            const size = parseInt(parts[0], 10) || 0;
            const relPath = parts[1].replace(/^\.\//, '');
            files.push({ relPath, size });
            totalBytes += size;
          }
        }
      }

      client.end();
      return { totalBytes, totalFiles: files.length, files };
    } catch (err: any) {
      if (client) {
        try {
          client.end();
        } catch {}
      }
      this.logger.error(`Scan remote directory failed for '${normalized}': ${err.message}`);
      return { totalBytes: 0, totalFiles: 0, files: [] };
    }
  }

  private parseProbeOutput(stdout: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const parts = stdout.split(/---([A-Z]+)---/);

    for (let i = 1; i < parts.length; i += 2) {
      const sectionName = parts[i].trim();
      const content = (parts[i + 1] || '').trim();
      sections[sectionName] = content;
    }

    return sections;
  }

  private parseOsRelease(content: string): Record<string, string> {
    const map: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^([A-Z_]+)=["']?(.*?)["']?$/);
      if (match) {
        map[match[1]] = match[2];
      }
    }

    return map;
  }

  private formatPermissions(mode: number): string {
    const isDir = (mode & 0o40000) === 0o40000;
    const userRead = mode & 0o400 ? 'r' : '-';
    const userWrite = mode & 0o200 ? 'w' : '-';
    const userExec = mode & 0o100 ? 'x' : '-';
    const groupRead = mode & 0o040 ? 'r' : '-';
    const groupWrite = mode & 0o020 ? 'w' : '-';
    const groupExec = mode & 0o010 ? 'x' : '-';
    const otherRead = mode & 0o004 ? 'r' : '-';
    const otherWrite = mode & 0o002 ? 'w' : '-';
    const otherExec = mode & 0o001 ? 'x' : '-';

    return `${isDir ? 'd' : '-'}${userRead}${userWrite}${userExec}${groupRead}${groupWrite}${groupExec}${otherRead}${otherWrite}${otherExec}`;
  }
}
