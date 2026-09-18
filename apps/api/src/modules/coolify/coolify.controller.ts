import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CoolifyService } from './coolify.service';
import { ConnectCoolifyDto } from './dto/connect-coolify.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('coolify')
export class CoolifyController {
  constructor(private readonly coolifyService: CoolifyService) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testConnection(@Body() body: { url: string; apiToken: string }) {
    return this.coolifyService.testConnection(body.url, body.apiToken);
  }

  @Post('connect')
  async connect(
    @Body() dto: ConnectCoolifyDto,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.coolifyService.connect(organizationId, dto);
  }

  @Get()
  async findAll(
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.coolifyService.findAll(organizationId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.coolifyService.findOne(organizationId, id);
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  async sync(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.coolifyService.sync(organizationId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    await this.coolifyService.remove(organizationId, id);
  }
}
