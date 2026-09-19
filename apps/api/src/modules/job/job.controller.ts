import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('jobs')
@Controller('jobs')
export class JobController {
  private readonly logger = new Logger(JobController.name);

  constructor(private jobService: JobService) {}

  @Post()
  @ApiOperation({ summary: 'Queue an on-demand operation (backup, restore, copy, sync, verify)' })
  async create(
    @Body() dto: CreateJobDto,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.jobService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all jobs for an organization' })
  @ApiQuery({ name: 'organizationId', required: false })
  async findAll(
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    try {
      return await this.jobService.findAll(organizationId);
    } catch (err: any) {
      this.logger.error(`Error fetching jobs for organization ${organizationId}: ${err.message}`);
      return [];
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get real-time job state, progress, and logs' })
  @ApiQuery({ name: 'organizationId', required: false })
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.jobService.findOne(organizationId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an active or queued job' })
  @ApiQuery({ name: 'organizationId', required: false })
  async cancel(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.jobService.cancel(organizationId, id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed or cancelled job' })
  @ApiQuery({ name: 'organizationId', required: false })
  async retry(
    @Param('id') id: string,
    @Query('organizationId') orgIdQuery?: string,
    @CurrentUser() user?: any,
  ) {
    const organizationId = user?.organizationId || orgIdQuery || 'default';
    return this.jobService.retry(organizationId, id);
  }
}
