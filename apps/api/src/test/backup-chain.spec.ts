import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BackupService } from '../modules/backup/backup.service';
import { Backup, BackupType, BackupVerificationState } from '../modules/backup/entities/backup.entity';
import { BackupChain, BackupChainStatus } from '../modules/backup/entities/backup-chain.entity';
import { Database, DatabaseStatus } from '../modules/database/entities/database.entity';
import { StorageDestination } from '../modules/storage/entities/storage.entity';
import { Job } from '../modules/job/entities/job.entity';
import { NotificationService } from '../modules/notification/notification.service';

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('BackupService — Backup Chains & Incremental Lineage', () => {
  let service: BackupService;
  let backupRepo: any;
  let chainRepo: any;
  let databaseRepo: any;
  let storageRepo: any;
  let jobRepo: any;

  const mockDatabase = {
    id: 'db-postgres-1',
    organizationId: 'default',
    serverId: 'srv-1',
    name: 'production_main',
    type: 'postgres',
    sizeBytes: 10737418240, // 10 GB
  };

  const mockStorage = {
    id: 'storage-s3-1',
    organizationId: 'default',
    name: 'Offsite S3 Primary',
    type: 's3',
    bucket: 'company-backups',
    prefix: 'daily/',
  };

  beforeEach(async () => {
    backupRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: entity.id || 'backup-uuid-1', ...entity })),
    };

    chainRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: entity.id || 'chain-uuid-1', ...entity })),
    };

    databaseRepo = {
      findOne: jest.fn().mockResolvedValue(mockDatabase),
    };

    storageRepo = {
      findOne: jest.fn().mockResolvedValue(mockStorage),
    };

    jobRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 'job-1', ...entity })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        { provide: getRepositoryToken(Backup), useValue: backupRepo },
        { provide: getRepositoryToken(BackupChain), useValue: chainRepo },
        { provide: getRepositoryToken(Database), useValue: databaseRepo },
        { provide: getRepositoryToken(StorageDestination), useValue: storageRepo },
        { provide: getRepositoryToken(Job), useValue: jobRepo },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(null) },
        },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);
  });

  describe('triggerBackup — Chain Parentage', () => {
    it('should anchor new chain on FULL backup with sequence 1', async () => {
      chainRepo.findOne.mockResolvedValueOnce(null);

      const result = await service.triggerBackup('default', {
        sourceDatabaseId: mockDatabase.id,
        destinationStorageId: mockStorage.id,
        type: BackupType.FULL,
      });

      expect(result.backup.type).toBe(BackupType.FULL);
      expect(result.backup.sequence).toBe(1);
      expect(result.backup.parentBackupId).toBeUndefined();
      expect(chainRepo.save).toHaveBeenCalled();
    });

    it('should link INCREMENTAL backup to active chain latest backup with sequence 2', async () => {
      const activeChain = {
        id: 'chain-100',
        organizationId: 'default',
        sourceDatabaseId: mockDatabase.id,
        status: BackupChainStatus.HEALTHY,
        baseBackupId: 'base-backup-1',
        latestBackupId: 'base-backup-1',
        backupCount: 1,
      };
      chainRepo.findOne.mockResolvedValueOnce(activeChain);

      const result = await service.triggerBackup('default', {
        sourceDatabaseId: mockDatabase.id,
        destinationStorageId: mockStorage.id,
        type: BackupType.INCREMENTAL,
      });

      expect(result.backup.type).toBe(BackupType.INCREMENTAL);
      expect(result.backup.sequence).toBe(2);
      expect(result.backup.parentBackupId).toBe('base-backup-1');
    });
  });

  describe('getRestorePlan — Chain Awareness', () => {
    it('should return complete sequential recovery plan for healthy incremental point', async () => {
      const targetBackup = {
        id: 'inc-2',
        chainId: 'chain-1',
        type: BackupType.INCREMENTAL,
        sequence: 2,
        parentBackupId: 'base-1',
        sizeBytes: 104857600, // 100 MB
        storagePath: 's3://company-backups/inc2.bak',
        verificationState: BackupVerificationState.CHECKSUM_VERIFIED,
      };
      const baseBackup = {
        id: 'base-1',
        chainId: 'chain-1',
        type: BackupType.FULL,
        sequence: 1,
        sizeBytes: 1073741824, // 1 GB
        storagePath: 's3://company-backups/base1.bak',
        verificationState: BackupVerificationState.CHECKSUM_VERIFIED,
      };

      backupRepo.findOne.mockResolvedValueOnce(targetBackup);
      chainRepo.findOne.mockResolvedValueOnce({ id: 'chain-1', status: BackupChainStatus.HEALTHY });
      backupRepo.find.mockResolvedValueOnce([baseBackup, targetBackup]);

      const plan = await service.getRestorePlan('default', 'inc-2');

      expect(plan.canRestore).toBe(true);
      expect(plan.chainStatus).toBe('HEALTHY');
      expect(plan.requiredBackups.length).toBe(2);
      expect(plan.requiredBackups[0].id).toBe('base-1');
      expect(plan.requiredBackups[1].id).toBe('inc-2');
      expect(plan.totalRestoreSizeBytes).toBe(1073741824 + 104857600);
    });

    it('should detect BROKEN chain if predecessor backup is missing', async () => {
      const targetBackup = {
        id: 'inc-3',
        chainId: 'chain-1',
        type: BackupType.INCREMENTAL,
        sequence: 3,
        parentBackupId: 'inc-2',
        sizeBytes: 50000000,
        verificationState: BackupVerificationState.CHECKSUM_VERIFIED,
      };
      const baseBackup = {
        id: 'base-1',
        chainId: 'chain-1',
        type: BackupType.FULL,
        sequence: 1,
        sizeBytes: 1000000000,
        verificationState: BackupVerificationState.CHECKSUM_VERIFIED,
      };

      // Notice sequence 2 is missing from query results!
      backupRepo.findOne.mockResolvedValueOnce(targetBackup);
      chainRepo.findOne.mockResolvedValueOnce({ id: 'chain-1', status: BackupChainStatus.HEALTHY });
      backupRepo.find.mockResolvedValueOnce([baseBackup, targetBackup]);

      const plan = await service.getRestorePlan('default', 'inc-3');

      expect(plan.canRestore).toBe(false);
      expect(plan.chainStatus).toBe('BROKEN');
      expect(plan.brokenReason).toContain('Sequence gap detected');
    });
  });
});
