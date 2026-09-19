import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policy } from './entities/policy.entity';
import { PolicyService } from './policy.service';
import { PolicyController } from './policy.controller';

import { BackupModule } from '../backup/backup.module';

@Module({
  imports: [TypeOrmModule.forFeature([Policy]), BackupModule],
  controllers: [PolicyController],
  providers: [PolicyService],
  exports: [PolicyService],
})
export class PolicyModule {}
