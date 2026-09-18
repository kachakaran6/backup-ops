import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BackupService } from './backup.service';
import { TriggerBackupDto } from './dto/trigger-backup.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('backups')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  async findAll(
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.backupService.findAll(organizationId);
  }

  @Get('chains')
  async findChains(
    @Query('databaseId') databaseId?: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.backupService.findChains(organizationId, databaseId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.backupService.findOne(organizationId, id);
  }

  @Post('trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerBackup(
    @Body() dto: TriggerBackupDto,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.backupService.triggerBackup(organizationId, dto);
  }

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  async verifyBackup(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.backupService.verifyBackup(organizationId, id);
  }

  @Get(':id/restore-plan')
  async getRestorePlan(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.backupService.getRestorePlan(organizationId, id);
  }
}
