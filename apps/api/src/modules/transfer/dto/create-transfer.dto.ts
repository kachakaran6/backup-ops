import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateTransferDto {
  @IsOptional()
  @IsString()
  sourceServerId?: string;

  @IsNotEmpty()
  @IsString()
  sourcePath: string;

  @IsOptional()
  @IsString()
  destinationServerId?: string;

  @IsNotEmpty()
  @IsString()
  destinationPath: string;

  @IsNotEmpty()
  @IsIn(['copy', 'move'])
  mode: 'copy' | 'move';

  @IsOptional()
  @IsBoolean()
  verifyChecksum?: boolean;

  @IsOptional()
  @IsBoolean()
  confirmDestructiveMove?: boolean;

  @IsOptional()
  options?: Record<string, any>;
}
