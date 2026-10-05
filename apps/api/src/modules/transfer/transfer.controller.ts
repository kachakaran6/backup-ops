import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransferService } from './transfer.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@ApiTags('transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transfers')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @ApiOperation({ summary: 'Initiate a server-to-server or data movement transfer (Move/Copy)' })
  async create(@Request() req: any, @Body() dto: CreateTransferDto, @Query('organizationId') queryOrgId?: string) {
    const orgId = queryOrgId || req.user?.organizationId || 'default';
    return this.transferService.create(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all transfer operations' })
  async findAll(@Request() req: any, @Query('status') status?: string, @Query('organizationId') queryOrgId?: string) {
    const orgId = queryOrgId || req.user?.organizationId || 'default';
    return this.transferService.findAll(orgId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details and telemetry for a specific transfer' })
  async findOne(@Request() req: any, @Param('id') id: string, @Query('organizationId') queryOrgId?: string) {
    const orgId = queryOrgId || req.user?.organizationId || 'default';
    return this.transferService.findOne(orgId, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause an active transfer with checkpointing' })
  async pause(@Request() req: any, @Param('id') id: string, @Query('organizationId') queryOrgId?: string) {
    const orgId = queryOrgId || req.user?.organizationId || 'default';
    return this.transferService.pause(orgId, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused transfer from checkpoint offset' })
  async resume(@Request() req: any, @Param('id') id: string, @Query('organizationId') queryOrgId?: string) {
    const orgId = queryOrgId || req.user?.organizationId || 'default';
    return this.transferService.resume(orgId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an in-flight transfer' })
  async cancel(@Request() req: any, @Param('id') id: string, @Query('organizationId') queryOrgId?: string) {
    const orgId = queryOrgId || req.user?.organizationId || 'default';
    return this.transferService.cancel(orgId, id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed transfer' })
  async retry(@Request() req: any, @Param('id') id: string, @Query('organizationId') queryOrgId?: string) {
    const orgId = queryOrgId || req.user?.organizationId || 'default';
    return this.transferService.retry(orgId, id);
  }
}
