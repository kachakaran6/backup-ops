import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { CreateStorageDto, TestStorageDto } from './dto/create-storage.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testStorage(@Body() dto: TestStorageDto) {
    return this.storageService.testStorage(dto);
  }

  @Post()
  async create(
    @Body() dto: CreateStorageDto,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.storageService.create(organizationId, dto);
  }

  @Get()
  async findAll(
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.storageService.findAll(organizationId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.storageService.findOne(organizationId, id);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  async testExisting(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.storageService.testExisting(organizationId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    await this.storageService.remove(organizationId, id);
  }
}
