import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobController {
  constructor(private jobService: JobService) {}

  @Post()
  @ApiOperation({ summary: 'Queue an on-demand operation (backup, restore, copy, sync, verify)' })
  async create(
    @Query('organizationId') organizationId: string,
    @Body() dto: CreateJobDto,
  ) {
    return this.jobService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all jobs for an organization' })
  @ApiQuery({ name: 'organizationId', required: true })
  async findAll(@Query('organizationId') organizationId: string) {
    return this.jobService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get real-time job state, progress, and logs' })
  @ApiQuery({ name: 'organizationId', required: true })
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.jobService.findOne(organizationId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an active or queued job' })
  @ApiQuery({ name: 'organizationId', required: true })
  async cancel(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.jobService.cancel(organizationId, id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed or cancelled job' })
  @ApiQuery({ name: 'organizationId', required: true })
  async retry(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.jobService.retry(organizationId, id);
  }
}
