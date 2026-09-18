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
import { RestoreService } from './restore.service';
import { CreateRestoreJobDto } from './dto/create-restore.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('restores')
export class RestoreController {
  constructor(private readonly restoreService: RestoreService) {}

  @Get()
  async findAll(
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.restoreService.findAll(organizationId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.restoreService.findOne(organizationId, id);
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(
    @Body() dto: CreateRestoreJobDto,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.restoreService.create(organizationId, dto);
  }
}
