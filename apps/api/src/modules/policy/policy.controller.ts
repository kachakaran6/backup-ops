import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PolicyService } from './policy.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('policies')
@Controller('policies')
export class PolicyController {
  constructor(private policyService: PolicyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new backup or synchronization policy' })
  async create(
    @Query('organizationId') organizationId: string,
    @Body() dto: CreatePolicyDto,
  ) {
    return this.policyService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all backup policies' })
  @ApiQuery({ name: 'organizationId', required: true })
  async findAll(@Query('organizationId') organizationId: string) {
    return this.policyService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get policy details' })
  @ApiQuery({ name: 'organizationId', required: true })
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.policyService.findOne(organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update policy parameters' })
  @ApiQuery({ name: 'organizationId', required: true })
  async update(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Body() dto: Partial<CreatePolicyDto>,
  ) {
    return this.policyService.update(organizationId, id, dto);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Enable or disable a policy' })
  @ApiQuery({ name: 'organizationId', required: true })
  async toggle(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.policyService.toggle(organizationId, id);
  }

  @Post(':id/trigger')
  @ApiOperation({ summary: 'Trigger immediate execution of a policy' })
  @ApiQuery({ name: 'organizationId', required: true })
  async trigger(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.policyService.trigger(organizationId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a policy' })
  @ApiQuery({ name: 'organizationId', required: true })
  async remove(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    await this.policyService.remove(organizationId, id);
    return { success: true };
  }
}
