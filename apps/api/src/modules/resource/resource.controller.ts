import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ResourceService } from './resource.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resources')
export class ResourceController {
  constructor(private resourceService: ResourceService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new infrastructure resource' })
  async create(
    @Query('organizationId') organizationId: string,
    @Body() dto: CreateResourceDto,
  ) {
    return this.resourceService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all resources for an organization' })
  @ApiQuery({ name: 'organizationId', required: true })
  async findAll(@Query('organizationId') organizationId: string) {
    return this.resourceService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resource by ID' })
  @ApiQuery({ name: 'organizationId', required: true })
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.resourceService.findOne(organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update resource configuration' })
  @ApiQuery({ name: 'organizationId', required: true })
  async update(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Body() dto: Partial<CreateResourceDto>,
  ) {
    return this.resourceService.update(organizationId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete resource safely' })
  @ApiQuery({ name: 'organizationId', required: true })
  async remove(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    await this.resourceService.remove(organizationId, id);
    return { success: true };
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test connectivity and health of the resource' })
  @ApiQuery({ name: 'organizationId', required: true })
  async testConnection(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.resourceService.testConnection(organizationId, id);
  }
}
