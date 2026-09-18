import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Server } from '../server/entities/server.entity';
import { Database } from '../database/entities/database.entity';
import { StorageDestination } from '../storage/entities/storage.entity';
import { Backup } from '../backup/entities/backup.entity';
import { BackupChain } from '../backup/entities/backup-chain.entity';
import { Job } from '../job/entities/job.entity';
import { CoolifyConnection } from '../coolify/entities/coolify-connection.entity';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Server,
      Database,
      StorageDestination,
      Backup,
      BackupChain,
      Job,
      CoolifyConnection,
    ]),
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
