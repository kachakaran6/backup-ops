import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestoreJob } from './entities/restore-job.entity';
import { Backup } from '../backup/entities/backup.entity';
import { RestoreService } from './restore.service';
import { RestoreController } from './restore.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RestoreJob, Backup])],
  controllers: [RestoreController],
  providers: [RestoreService],
  exports: [RestoreService],
})
export class RestoreModule {}
