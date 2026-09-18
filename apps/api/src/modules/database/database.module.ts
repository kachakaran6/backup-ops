import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Database } from './entities/database.entity';
import { Backup } from '../backup/entities/backup.entity';
import { BackupChain } from '../backup/entities/backup-chain.entity';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';
import { PostgreSqlProvider } from './providers/postgresql.provider';
import { CredentialModule } from '../credential/credential.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Database, Backup, BackupChain]),
    CredentialModule,
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService, PostgreSqlProvider],
  exports: [DatabaseService, PostgreSqlProvider],
})
export class DatabaseModule {}
