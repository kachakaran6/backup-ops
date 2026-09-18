import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { BackupType } from '../entities/backup.entity';

export class TriggerBackupDto {
  @IsString()
  @IsNotEmpty()
  sourceDatabaseId: string;

  @IsString()
  @IsNotEmpty()
  destinationStorageId: string;

  @IsString()
  @IsOptional()
  policyId?: string;

  @IsEnum(BackupType)
  @IsOptional()
  type?: BackupType = BackupType.FULL;

  @IsString()
  @IsOptional()
  compression?: 'none' | 'gzip' | 'zstd' = 'zstd';

  @IsString()
  @IsOptional()
  encryption?: 'none' | 'aes_256_gcm' = 'aes_256_gcm';
}
