import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsObject } from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ example: 'backup', description: 'copy | move | backup | restore | sync | verify | prune' })
  @IsString()
  @IsNotEmpty()
  operationType: string;

  @ApiProperty({ example: 'uuid-of-source-resource' })
  @IsUUID()
  @IsNotEmpty()
  sourceResourceId: string;

  @ApiProperty({ example: 'uuid-of-destination-resource', required: false })
  @IsUUID()
  @IsOptional()
  destinationResourceId?: string;

  @ApiProperty({ example: 'uuid-of-policy', required: false })
  @IsUUID()
  @IsOptional()
  policyId?: string;

  @ApiProperty({
    example: { compression: 'gzip', encryption: 'aes_256_gcm', verifyChecksum: true, dryRun: false },
    required: false,
  })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
}
