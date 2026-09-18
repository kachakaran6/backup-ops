import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { StorageType } from '../entities/storage.entity';

export class CreateStorageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(StorageType)
  type: StorageType;

  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  bucket?: string;

  @IsString()
  @IsOptional()
  prefix?: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  accessKeyId?: string;

  @IsString()
  @IsOptional()
  secretAccessKey?: string;

  @IsString()
  @IsOptional()
  credentialId?: string;
}

export class TestStorageDto {
  @IsEnum(StorageType)
  type: StorageType;

  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  bucket?: string;

  @IsString()
  @IsOptional()
  prefix?: string;

  @IsString()
  @IsOptional()
  path?: string;
}
