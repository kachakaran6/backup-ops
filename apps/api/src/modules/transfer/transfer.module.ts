import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../job/entities/job.entity';
import { Server } from '../server/entities/server.entity';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { ServerModule } from '../server/server.module';
import { CredentialModule } from '../credential/credential.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, Server]),
    ServerModule,
    CredentialModule,
  ],
  controllers: [TransferController],
  providers: [TransferService],
  exports: [TransferService],
})
export class TransferModule {}

