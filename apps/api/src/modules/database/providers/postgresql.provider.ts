import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'pg';
import {
  DatabaseConnectionConfig,
  DatabaseConnectionTestResult,
  DatabaseProvider,
  WalStatusResult,
} from './database-provider.interface';

@Injectable()
export class PostgreSqlProvider implements DatabaseProvider {
  private readonly logger = new Logger(PostgreSqlProvider.name);

  async testConnection(config: DatabaseConnectionConfig): Promise<DatabaseConnectionTestResult> {
    const start = Date.now();
    const client = new Client({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user || 'postgres',
      password: config.password,
      connectionTimeoutMillis: 5000,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    });

    try {
      await client.connect();

      // Query version
      const verRes = await client.query('SELECT version();');
      const fullVersion = verRes.rows[0]?.version || 'PostgreSQL (unknown)';
      const versionMatch = fullVersion.match(/PostgreSQL (\d+(\.\d+)?)/i);
      const version = versionMatch ? `PostgreSQL ${versionMatch[1]}` : fullVersion.split(' on ')[0];

      // Query database size
      let sizeBytes = 0;
      try {
        const sizeRes = await client.query('SELECT pg_database_size(current_database()) as size;');
        sizeBytes = Number(sizeRes.rows[0]?.size || 0);
      } catch (err: any) {
        this.logger.debug(`Could not query pg_database_size: ${err.message}`);
      }

      // Query active connections
      let activeConnections = 1;
      try {
        const connRes = await client.query(
          'SELECT count(*)::int as count FROM pg_stat_activity WHERE datname = current_database();',
        );
        activeConnections = Number(connRes.rows[0]?.count || 1);
      } catch (err: any) {
        this.logger.debug(`Could not query pg_stat_activity: ${err.message}`);
      }

      // Query table count
      let tableCount = 0;
      try {
        const tblRes = await client.query(
          "SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');",
        );
        tableCount = Number(tblRes.rows[0]?.count || 0);
      } catch (err: any) {
        this.logger.debug(`Could not query information_schema.tables: ${err.message}`);
      }

      // Query WAL archiving settings
      let walEnabled = false;
      let walStatus: 'healthy' | 'warning' | 'disabled' | 'unknown' = 'disabled';
      try {
        const walRes = await client.query(
          "SELECT name, setting FROM pg_settings WHERE name IN ('archive_mode', 'wal_level');",
        );
        const settings: Record<string, string> = {};
        for (const row of walRes.rows) {
          settings[row.name] = row.setting;
        }

        const isArchiveOn = settings['archive_mode'] === 'on';
        const isReplica = settings['wal_level'] === 'replica' || settings['wal_level'] === 'logical';

        walEnabled = isArchiveOn && isReplica;
        walStatus = walEnabled ? 'healthy' : isArchiveOn ? 'warning' : 'disabled';
      } catch (err: any) {
        this.logger.debug(`Could not query pg_settings for WAL: ${err.message}`);
        walStatus = 'unknown';
      }

      await client.end();
      const latencyMs = Date.now() - start;

      return {
        success: true,
        latencyMs,
        message: `Connected successfully to ${config.database} (${version})`,
        version,
        sizeBytes,
        tableCount,
        activeConnections,
        walEnabled,
        walStatus,
      };
    } catch (err: any) {
      try {
        await client.end();
      } catch {}
      const latencyMs = Date.now() - start;
      return {
        success: false,
        latencyMs,
        message: `PostgreSQL connection failed: ${err.message}`,
        walStatus: 'unknown',
      };
    }
  }

  async getWalStatus(config: DatabaseConnectionConfig): Promise<WalStatusResult> {
    const client = new Client({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user || 'postgres',
      password: config.password,
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      const walRes = await client.query(
        "SELECT name, setting FROM pg_settings WHERE name IN ('archive_mode', 'wal_level', 'archive_command');",
      );
      const settings: Record<string, string> = {};
      for (const row of walRes.rows) {
        settings[row.name] = row.setting;
      }

      await client.end();

      const archiveMode = settings['archive_mode'] || 'off';
      const walLevel = settings['wal_level'] || 'minimal';
      const archiveCommand = settings['archive_command'] || '';
      const isReadyForPitr = archiveMode === 'on' && (walLevel === 'replica' || walLevel === 'logical');

      return {
        walEnabled: archiveMode === 'on',
        walLevel,
        archiveMode,
        archiveCommand,
        isReadyForPitr,
        statusText: isReadyForPitr
          ? 'WAL archiving active. Base + WAL point-in-time recovery (PITR) supported.'
          : 'WAL archiving disabled. Only logical dumps (pg_dump) available.',
      };
    } catch (err: any) {
      try {
        await client.end();
      } catch {}
      return {
        walEnabled: false,
        isReadyForPitr: false,
        statusText: `Failed to inspect WAL: ${err.message}`,
      };
    }
  }
}
