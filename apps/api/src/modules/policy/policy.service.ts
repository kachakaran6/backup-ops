import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from './entities/policy.entity';
import { CreatePolicyDto } from './dto/create-policy.dto';

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(Policy)
    private policyRepo: Repository<Policy>,
  ) {}

  async create(organizationId: string, dto: CreatePolicyDto): Promise<Policy> {
    const policy = this.policyRepo.create({
      organizationId,
      name: dto.name,
      description: dto.description,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
      sourceResourceId: dto.sourceResourceId,
      destinationResourceId: dto.destinationResourceId,
      operationType: dto.operationType || 'backup',
      schedule: dto.schedule as any,
      retention: dto.retention as any,
      options: dto.options as any,
    });

    return this.policyRepo.save(policy);
  }

  async findAll(organizationId: string): Promise<Policy[]> {
    return this.policyRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(organizationId: string, id: string): Promise<Policy> {
    const policy = await this.policyRepo.findOne({ where: { id, organizationId } });
    if (!policy) {
      throw new NotFoundException(`Policy ${id} not found`);
    }
    return policy;
  }

  async update(organizationId: string, id: string, dto: Partial<CreatePolicyDto>): Promise<Policy> {
    const policy = await this.findOne(organizationId, id);
    Object.assign(policy, dto);
    return this.policyRepo.save(policy);
  }

  async toggle(organizationId: string, id: string): Promise<Policy> {
    const policy = await this.findOne(organizationId, id);
    policy.enabled = !policy.enabled;
    return this.policyRepo.save(policy);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const policy = await this.findOne(organizationId, id);
    await this.policyRepo.remove(policy);
  }
}
