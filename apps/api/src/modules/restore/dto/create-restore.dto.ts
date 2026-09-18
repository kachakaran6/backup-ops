import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { RestoreTargetType } from '../entities/restore-job.entity';

export class CreateRestoreJobDto {
  @IsString()
  @IsNotEmpty()
  backupId: string;

  @IsEnum(RestoreTargetType)
  targetType: RestoreTargetType;

  @IsString()
  @IsOptional()
  targetServerId?: string;

  @IsString()
  @IsOptional()
  targetDatabaseId?: string;

  @IsString()
  @IsOptional()
  targetPath?: string;

  @IsString()
  @IsOptional()
  pointInTimeTarget?: string;

  /**
   * Mandatory explicit confirmation for destructive restore operations.
   */
  @IsBoolean()
  overwriteConfirmed: boolean;
}
