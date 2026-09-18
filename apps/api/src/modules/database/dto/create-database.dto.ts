import { IsString, IsNotEmpty, IsInt, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { DatabaseType, DatabaseProtectionStatus } from '../entities/database.entity';

export class CreateDatabaseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(DatabaseType)
  @IsOptional()
  type?: DatabaseType = DatabaseType.POSTGRES;

  @IsString()
  @IsNotEmpty()
  host: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  port?: number = 5432;

  @IsString()
  @IsNotEmpty()
  databaseName: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  serverId?: string;

  @IsString()
  @IsOptional()
  credentialId?: string;

  @IsEnum(DatabaseProtectionStatus)
  @IsOptional()
  protectionStatus?: DatabaseProtectionStatus = DatabaseProtectionStatus.PROTECTED;
}

export class TestDatabaseDto {
  @IsEnum(DatabaseType)
  @IsOptional()
  type?: DatabaseType = DatabaseType.POSTGRES;

  @IsString()
  @IsNotEmpty()
  host: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  port?: number = 5432;

  @IsString()
  @IsNotEmpty()
  databaseName: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
