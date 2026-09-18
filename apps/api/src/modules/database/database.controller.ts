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
import { DatabaseService } from './database.service';
import { CreateDatabaseDto, TestDatabaseDto } from './dto/create-database.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('databases')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Post('test-connection')
  @HttpCode(HttpStatus.OK)
  async testConnection(@Body() dto: TestDatabaseDto) {
    return this.databaseService.testConnection(dto);
  }

  @Post()
  async create(
    @Body() dto: CreateDatabaseDto,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.databaseService.create(organizationId, dto);
  }

  @Get()
  async findAll(
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.databaseService.findAll(organizationId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.databaseService.findOne(organizationId, id);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  async testExisting(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.databaseService.testExistingDatabase(organizationId, id);
  }

  @Get(':id/recovery')
  async getRecovery(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.databaseService.getRecoveryStatus(organizationId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    await this.databaseService.remove(organizationId, id);
  }
}
