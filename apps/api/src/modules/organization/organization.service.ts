import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { Membership, OrgRole } from './entities/membership.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(Membership)
    private membershipRepository: Repository<Membership>,
  ) {}

  async create(userId: string, dto: CreateOrganizationDto): Promise<Organization> {
    const existing = await this.orgRepository.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Organization with this slug already exists');
    }

    const org = this.orgRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
    });

    const savedOrg = await this.orgRepository.save(org);

    // Add creator as OWNER
    const membership = this.membershipRepository.create({
      organizationId: savedOrg.id,
      userId,
      role: OrgRole.OWNER,
    });
    await this.membershipRepository.save(membership);

    return savedOrg;
  }

  async findAllForUser(userId: string): Promise<Organization[]> {
    const memberships = await this.membershipRepository.find({
      where: { userId },
      relations: ['organization'],
    });
    return memberships.map((m) => m.organization);
  }

  async findOne(id: string): Promise<Organization> {
    const org = await this.orgRepository.findOne({
      where: { id },
      relations: ['memberships', 'memberships.user'],
    });
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return org;
  }

  async addMember(organizationId: string, userId: string, role: OrgRole): Promise<Membership> {
    const org = await this.orgRepository.findOne({ where: { id: organizationId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const existing = await this.membershipRepository.findOne({
      where: { organizationId, userId },
    });
    if (existing) {
      existing.role = role;
      return this.membershipRepository.save(existing);
    }

    const membership = this.membershipRepository.create({
      organizationId,
      userId,
      role,
    });
    return this.membershipRepository.save(membership);
  }
}
