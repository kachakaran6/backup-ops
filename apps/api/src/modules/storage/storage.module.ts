import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageDestination } from './entities/storage.entity';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { CredentialModule } from '../credential/credential.module';

@Module({
  imports: [TypeOrmModule.forFeature([StorageDestination]), CredentialModule],
  controllers: [StorageController],
  providers: [StorageService, LocalStorageProvider, S3StorageProvider],
  exports: [StorageService, LocalStorageProvider, S3StorageProvider],
})
export class StorageModule {}
