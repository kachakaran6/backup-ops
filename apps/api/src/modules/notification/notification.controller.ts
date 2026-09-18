import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationProviderType } from './entities/notification-integration.entity';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('integrations')
  async listIntegrations(@Req() req: any) {
    const orgId = req.user?.organizationId || 'default';
    return this.notificationService.listIntegrations(orgId);
  }

  @Post('integrations')
  async saveIntegration(
    @Req() req: any,
    @Body()
    body: {
      id?: string;
      provider: NotificationProviderType;
      name: string;
      config: any;
      enabled?: boolean;
    },
  ) {
    const orgId = req.user?.organizationId || 'default';
    return this.notificationService.createOrUpdateIntegration(orgId, body);
  }

  @Delete('integrations/:id')
  async deleteIntegration(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user?.organizationId || 'default';
    return this.notificationService.deleteIntegration(orgId, id);
  }

  @Post('integrations/:id/test')
  @HttpCode(HttpStatus.OK)
  async testIntegration(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { configOverride?: any },
  ) {
    const orgId = req.user?.organizationId || 'default';
    return this.notificationService.testIntegration(orgId, id, body?.configOverride);
  }

  @Get('rules')
  async listRules(@Req() req: any) {
    const orgId = req.user?.organizationId || 'default';
    return this.notificationService.listRules(orgId);
  }

  @Put('rules/:event')
  async updateRule(
    @Req() req: any,
    @Param('event') event: string,
    @Body()
    body: {
      enabled?: boolean;
      integrationIds?: string[];
      cooldownMinutes?: number;
    },
  ) {
    const orgId = req.user?.organizationId || 'default';
    return this.notificationService.updateRule(orgId, event, body);
  }

  @Get('deliveries')
  async listDeliveries(@Req() req: any) {
    const orgId = req.user?.organizationId || 'default';
    return this.notificationService.listDeliveries(orgId);
  }
}
