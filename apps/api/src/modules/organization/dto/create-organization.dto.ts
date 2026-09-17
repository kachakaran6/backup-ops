import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength, IsOptional } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corp Infrastructure' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'acme-corp' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase alphanumeric with hyphens' })
  slug: string;

  @ApiProperty({ example: 'Primary organization for company infrastructure backups', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
