import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Server, ServerStatus } from '../server/entities/server.entity';
import { Database, DatabaseStatus, DatabaseProtectionStatus } from '../database/entities/database.entity';
import { StorageDestination, StorageStatus } from '../storage/entities/storage.entity';
import { Backup } from '../backup/entities/backup.entity';
import { BackupChain, BackupChainStatus } from '../backup/entities/backup-chain.entity';
import { Job, JobState } from '../job/entities/job.entity';
import { CoolifyConnection } from '../coolify/entities/coolify-connection.entity';
import { DashboardStats } from '@backup-ops/types';

@Injectable()
export class MonitoringService {
  constructor(
    @InjectRepository(Server)
    private serverRepo: Repository<Server>,
    @InjectRepository(Database)
    private databaseRepo: Repository<Database>,
    @InjectRepository(StorageDestination)
    private storageRepo: Repository<StorageDestination>,
    @InjectRepository(Backup)
    private backupRepo: Repository<Backup>,
    @InjectRepository(BackupChain)
    private chainRepo: Repository<BackupChain>,
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    @InjectRepository(CoolifyConnection)
    private coolifyRepo: Repository<CoolifyConnection>,
  ) {}

  async getDashboardStats(organizationId: string): Promise<DashboardStats> {
    // 1. Infrastructure metrics
    const servers = await this.serverRepo.find({ where: { organizationId } });
    const coolifyConnections = await this.coolifyRepo.find({ where: { organizationId } });
    const onlineServers = servers.filter((s) => s.status === ServerStatus.ONLINE).length;
    const offlineServers = servers.length - onlineServers;

    // 2. Database metrics
    const databases = await this.databaseRepo.find({ where: { organizationId } });
    const healthyDatabases = databases.filter((d) => d.status === DatabaseStatus.CONNECTED).length;
    const unprotectedDatabases = databases.filter(
      (d) => d.protectionStatus === DatabaseProtectionStatus.DISCOVERED,
    ).length;

    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const backupOverdueDatabases = databases.filter((d) => {
      if (d.protectionStatus !== DatabaseProtectionStatus.PROTECTED) return false;
      if (!d.lastSuccessfulBackupAt) return true;
      return new Date(d.lastSuccessfulBackupAt) < oneDayAgo;
    }).length;

    // 3. Backup metrics (last 24h)
    const backupsLast24h = await this.backupRepo.find({
      where: {
        organizationId,
        createdAt: MoreThan(oneDayAgo),
      },
    });
    const last24hSuccessful = backupsLast24h.filter((b) => b.status === 'completed').length;
    const last24hFailed = backupsLast24h.filter((b) => b.status === 'failed').length;

    const activeJobs = await this.jobRepo.count({
      where: [
        { organizationId, state: JobState.RUNNING },
        { organizationId, state: JobState.PLANNING },
        { organizationId, state: JobState.VERIFYING },
      ],
    });

    const totalArtifacts = await this.backupRepo.count({ where: { organizationId } });

    // 4. Storage metrics
    const storageDestinations = await this.storageRepo.find({ where: { organizationId } });
    let totalUsedCapacity = 0;
    let totalAvailableCapacity = 0;

    for (const dest of storageDestinations) {
      if (dest.usedCapacityBytes) totalUsedCapacity += Number(dest.usedCapacityBytes);
      if (dest.availableCapacityBytes) totalAvailableCapacity += Number(dest.availableCapacityBytes);
    }

    // 5. Recovery chains
    const chains = await this.chainRepo.find({ where: { organizationId } });
    const validChains = chains.filter((c) => c.status === BackupChainStatus.HEALTHY).length;
    const brokenChains = chains.filter((c) => c.status === BackupChainStatus.BROKEN).length;

    return {
      infrastructure: {
        totalServers: servers.length,
        onlineServers,
        offlineServers,
        coolifyInstances: coolifyConnections.length,
      },
      databases: {
        totalDatabases: databases.length,
        healthyDatabases,
        backupOverdueDatabases,
        unprotectedDatabases,
      },
      backups: {
        last24hSuccessful,
        last24hFailed,
        activeOperations: activeJobs,
        totalArtifacts,
      },
      storage: {
        totalDestinations: storageDestinations.length,
        usedCapacityBytes: totalUsedCapacity,
        availableCapacityBytes: totalAvailableCapacity,
      },
      recovery: {
        validChains,
        brokenChains,
      },
    };
  }
}
