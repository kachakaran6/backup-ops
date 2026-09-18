import { IsString, IsNotEmpty, IsInt, IsOptional, IsArray, Min, Max } from 'class-validator';

export class CreateDirectSshServerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  host: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  port?: number = 22;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsOptional()
  credentialId?: string;

  @IsString()
  @IsOptional()
  privateKey?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class TestSshConnectionDto {
  @IsString()
  @IsNotEmpty()
  host: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  port?: number = 22;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsOptional()
  credentialId?: string;

  @IsString()
  @IsOptional()
  privateKey?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
