import { Controller, Get, Query } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('dashboard')
  async getDashboard(
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.monitoringService.getDashboardStats(organizationId);
  }
}
