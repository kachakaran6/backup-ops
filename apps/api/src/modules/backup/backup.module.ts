import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Backup } from './entities/backup.entity';
import { BackupChain } from './entities/backup-chain.entity';
import { Database } from '../database/entities/database.entity';
import { StorageDestination } from '../storage/entities/storage.entity';
import { Job } from '../job/entities/job.entity';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Backup, BackupChain, Database, StorageDestination, Job]),
  ],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
