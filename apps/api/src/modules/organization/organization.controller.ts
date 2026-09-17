import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { Organization } from './entities/organization.entity';
import { OrgRole } from './entities/membership.entity';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(private orgService: OrganizationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace / organization' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrganizationDto,
  ): Promise<Organization> {
    return this.orgService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List organizations where the user is a member' })
  async findAll(@CurrentUser('id') userId: string): Promise<Organization[]> {
    return this.orgService.findAllForUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details and members' })
  async findOne(@Param('id') id: string): Promise<Organization> {
    return this.orgService.findOne(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add or update an organization member' })
  async addMember(
    @Param('id') organizationId: string,
    @Body() body: { userId: string; role: OrgRole },
  ) {
    return this.orgService.addMember(organizationId, body.userId, body.role);
  }
}
