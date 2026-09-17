import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class CreatePolicyDto {
  @ApiProperty({ example: 'Daily PostgreSQL Backup' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Automated daily snapshots with 30-day retention', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ example: 'uuid-of-source-resource' })
  @IsUUID()
  @IsNotEmpty()
  sourceResourceId: string;

  @ApiProperty({ example: 'uuid-of-destination-resource' })
  @IsUUID()
  @IsNotEmpty()
  destinationResourceId: string;

  @ApiProperty({ example: 'backup', required: false })
  @IsString()
  @IsOptional()
  operationType?: string;

  @ApiProperty({
    example: { enabled: true, cronExpression: '0 2 * * *', timezone: 'UTC' },
  })
  @IsObject()
  schedule: Record<string, any>;

  @ApiProperty({
    example: { keepDaily: 7, keepWeekly: 4, keepMonthly: 12 },
  })
  @IsObject()
  retention: Record<string, any>;

  @ApiProperty({
    example: { compression: 'gzip', encryption: 'aes_256_gcm', verifyChecksum: true, dryRun: false },
  })
  @IsObject()
  options: Record<string, any>;
}
