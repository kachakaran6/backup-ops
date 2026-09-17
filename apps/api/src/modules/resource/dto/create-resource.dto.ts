import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';
import { ResourceType, ResourceCategory } from '../entities/resource.entity';

export class CreateResourceDto {
  @ApiProperty({ example: 'Production PostgreSQL' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Primary production database cluster', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ResourceType, example: ResourceType.DATABASE_POSTGRES })
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiProperty({ enum: ResourceCategory, example: ResourceCategory.DATABASE })
  @IsEnum(ResourceCategory)
  category: ResourceCategory;

  @ApiProperty({
    example: { host: 'db.internal.example.com', port: 5432, database: 'main_db' },
  })
  @IsObject()
  @IsNotEmpty()
  config: Record<string, any>;

  @ApiProperty({ example: 'uuid-of-credential-in-vault', required: false })
  @IsUUID()
  @IsOptional()
  credentialId?: string;
}
