import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CredentialService } from './credential.service';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('credentials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credentials')
export class CredentialController {
  constructor(private credentialService: CredentialService) {}

  @Post()
  @ApiOperation({ summary: 'Store encrypted credentials in the vault (AES-256-GCM)' })
  async create(
    @Query('organizationId') organizationId: string,
    @Body() dto: CreateCredentialDto,
  ) {
    return this.credentialService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List credentials metadata (secrets remain encrypted and omitted)' })
  @ApiQuery({ name: 'organizationId', required: true })
  async findAll(@Query('organizationId') organizationId: string) {
    return this.credentialService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single credential metadata' })
  @ApiQuery({ name: 'organizationId', required: true })
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.credentialService.findOne(organizationId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete credential from vault' })
  @ApiQuery({ name: 'organizationId', required: true })
  async remove(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    await this.credentialService.remove(organizationId, id);
    return { success: true };
  }
}
