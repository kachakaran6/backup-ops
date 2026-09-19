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
import { ServerService } from './server.service';
import { CreateDirectSshServerDto, TestSshConnectionDto } from './dto/create-server.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('servers')
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  @Post('test-ssh')
  @HttpCode(HttpStatus.OK)
  async testSshConnection(@Body() dto: TestSshConnectionDto) {
    return this.serverService.testSshConnection(dto);
  }

  @Post()
  async createDirectSshServer(
    @Body() dto: CreateDirectSshServerDto,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.serverService.createDirectSshServer(organizationId, dto);
  }

  @Get()
  async findAll(
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.serverService.findAll(organizationId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.serverService.findOne(organizationId, id);
  }

  @Get(':id/databases')
  async getServerDatabases(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.serverService.getServerDatabases(organizationId, id);
  }

  @Get(':id/docker')
  async getServerDocker(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.serverService.getServerDocker(organizationId, id);
  }

  @Post(':id/volumes')
  async addServerVolume(
    @Param('id') id: string,
    @Body() body: { name: string; driver?: string; mountpoint?: string; project?: string },
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.serverService.addServerVolume(organizationId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    await this.serverService.remove(organizationId, id);
  }
}
