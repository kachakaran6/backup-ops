import { Injectable, Logger } from '@nestjs/common';

export interface CoolifyServer {
  uuid: string;
  name: string;
  description?: string;
  ip: string;
  user?: string;
  port?: number;
  is_reachable?: boolean;
  is_usable?: boolean;
  settings?: Record<string, any>;
}

export interface CoolifyDatabase {
  uuid: string;
  name: string;
  type: string;
  status?: string;
  description?: string;
  // fields vary by database type
  [key: string]: any;
}

export interface CoolifyApplication {
  uuid: string;
  name: string;
  fqdn?: string;
  status?: string;
  description?: string;
  git_repository?: string;
  [key: string]: any;
}

export interface CoolifyService {
  uuid: string;
  name: string;
  type?: string;
  status?: string;
  description?: string;
  [key: string]: any;
}

export interface CoolifyResource {
  uuid: string;
  name: string;
  type: string;
  status?: string;
  [key: string]: any;
}

export interface CoolifyVersionInfo {
  version: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  version?: string;
  latencyMs: number;
}

/**
 * CoolifyProvider — adapter that communicates with the Coolify API.
 *
 * This provider is read-only by default. It discovers infrastructure
 * from Coolify but does NOT deploy, restart, or modify resources.
 *
 * Coolify API tokens are decrypted only when making requests and
 * are never logged or returned to the frontend.
 */
@Injectable()
export class CoolifyProvider {
  private readonly logger = new Logger(CoolifyProvider.name);

  /**
   * Test connectivity to a Coolify instance.
   */
  async testConnection(url: string, token: string): Promise<ConnectionTestResult> {
    const start = Date.now();
    const normalizedUrl = url.replace(/\/+$/, '');

    try {
      const response = await fetch(`${normalizedUrl}/api/v1/version`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            message: 'Authentication failed. Check your API token.',
            latencyMs,
          };
        }
        return {
          success: false,
          message: `Coolify API returned HTTP ${response.status}`,
          latencyMs,
        };
      }

      const data = await response.json();
      const version = typeof data === 'string' ? data : (data as any)?.version || 'unknown';

      return {
        success: true,
        message: `Connected to Coolify ${version}`,
        version,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      const message =
        err.name === 'AbortError'
          ? 'Connection timed out after 10 seconds'
          : `Connection failed: ${err.message}`;

      this.logger.warn(`Coolify connection test failed for ${normalizedUrl}: ${message}`);

      return {
        success: false,
        message,
        latencyMs,
      };
    }
  }

  /**
   * List all servers managed by the Coolify instance.
   */
  async listServers(url: string, token: string): Promise<CoolifyServer[]> {
    return this.apiGet<CoolifyServer[]>(url, token, '/api/v1/servers') || [];
  }

  /**
   * Get details for a specific server.
   */
  async getServer(url: string, token: string, uuid: string): Promise<CoolifyServer | null> {
    return this.apiGet<CoolifyServer>(url, token, `/api/v1/servers/${uuid}`);
  }

  /**
   * List resources deployed on a specific server.
   */
  async listServerResources(url: string, token: string, serverUuid: string): Promise<CoolifyResource[]> {
    return this.apiGet<CoolifyResource[]>(url, token, `/api/v1/servers/${serverUuid}/resources`) || [];
  }

  /**
   * List all applications across the Coolify instance.
   */
  async listApplications(url: string, token: string): Promise<CoolifyApplication[]> {
    return this.apiGet<CoolifyApplication[]>(url, token, '/api/v1/applications') || [];
  }

  /**
   * List all databases across the Coolify instance.
   */
  async listDatabases(url: string, token: string): Promise<CoolifyDatabase[]> {
    return this.apiGet<CoolifyDatabase[]>(url, token, '/api/v1/databases') || [];
  }

  /**
   * List all services across the Coolify instance.
   */
  async listServices(url: string, token: string): Promise<CoolifyService[]> {
    return this.apiGet<CoolifyService[]>(url, token, '/api/v1/services') || [];
  }

  /**
   * Internal helper for Coolify API GET requests.
   * Never logs the token. Handles errors gracefully.
   */
  private async apiGet<T>(baseUrl: string, token: string, path: string): Promise<T | null> {
    const normalizedUrl = baseUrl.replace(/\/+$/, '');

    try {
      const response = await fetch(`${normalizedUrl}${path}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        this.logger.warn(`Coolify API ${path} returned HTTP ${response.status}`);
        return null;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      this.logger.warn(`Coolify API request to ${path} failed: ${err.message}`);
      return null;
    }
  }
}
