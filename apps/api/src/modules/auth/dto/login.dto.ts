import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({ example: 'admin@gmail.com' })
  @IsString()
  @IsOptional()
  usernameOrEmail?: string;

  @ApiPropertyOptional({ example: 'admin@gmail.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'admin@123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
