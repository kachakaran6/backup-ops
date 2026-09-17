import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsObject, IsOptional } from 'class-validator';
import { CredentialType } from '../entities/credential.entity';

export class CreateCredentialDto {
  @ApiProperty({ example: 'Production AWS S3 Credentials' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: CredentialType, example: CredentialType.AWS_S3 })
  @IsEnum(CredentialType)
  type: CredentialType;

  @ApiProperty({
    example: { accessKeyId: 'AKIA...', secretAccessKey: 'wJalrXUtn...' },
    description: 'Sensitive payload that will be encrypted at rest with AES-256-GCM',
  })
  @IsObject()
  @IsNotEmpty()
  secretPayload: Record<string, any>;

  @ApiProperty({ example: { username: 'ubuntu' }, required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
