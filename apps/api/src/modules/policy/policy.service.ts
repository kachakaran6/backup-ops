import { Injectable, NotFoundException, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from './entities/policy.entity';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { BackupService } from '../backup/backup.service';

@Injectable()
export class PolicyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PolicyService.name);
  private schedulerTimer?: NodeJS.Timeout;

  constructor(
    @InjectRepository(Policy)
    private policyRepo: Repository<Policy>,
    private backupService: BackupService,
  ) {}

  onModuleInit() {
    // Check every 60 seconds for due policies
    this.schedulerTimer = setInterval(() => this.evaluateDuePolicies(), 60000);
    this.logger.log('Policy scheduler initialized (evaluating every 60s)');
  }

  onModuleDestroy() {
    if (this.schedulerTimer) clearInterval(this.schedulerTimer);
  }

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

  async trigger(organizationId: string, id: string) {
    const policy = await this.findOne(organizationId, id);
    policy.lastRunAt = new Date();
    await this.policyRepo.save(policy);

    return this.backupService.triggerBackup(organizationId, {
      sourceDatabaseId: policy.sourceResourceId,
      destinationStorageId: policy.destinationResourceId,
      policyId: policy.id,
      compression: (policy.options?.compression as any) || 'gzip',
      encryption: (policy.options?.encryption as any) || 'aes_256_gcm',
    });
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const policy = await this.findOne(organizationId, id);
    await this.policyRepo.remove(policy);
  }

  private async evaluateDuePolicies() {
    try {
      const enabledPolicies = await this.policyRepo.find({
        where: { enabled: true },
      });

      const now = new Date();
      for (const policy of enabledPolicies) {
        if (!policy.schedule?.enabled) continue;

        let isDue = false;
        if (policy.schedule.intervalMinutes && policy.schedule.intervalMinutes > 0) {
          if (!policy.lastRunAt) {
            isDue = true;
          } else {
            const elapsedMinutes = (now.getTime() - new Date(policy.lastRunAt).getTime()) / (1000 * 60);
            if (elapsedMinutes >= policy.schedule.intervalMinutes) {
              isDue = true;
            }
          }
        } else if (policy.schedule.cronExpression) {
          isDue = this.isCronDue(policy.schedule.cronExpression, now, policy.lastRunAt);
        }

        if (isDue) {
          this.logger.log(`[PolicyScheduler] Policy "${policy.name}" (${policy.id}) is due. Triggering backup...`);
          try {
            await this.trigger(policy.organizationId, policy.id);
          } catch (err: any) {
            this.logger.error(`[PolicyScheduler] Failed to trigger policy "${policy.name}": ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`[PolicyScheduler] Error evaluating policies: ${err.message}`);
    }
  }

  private isCronDue(cron: string, now: Date, lastRunAt?: Date): boolean {
    if (lastRunAt) {
      const last = new Date(lastRunAt);
      if (
        last.getUTCFullYear() === now.getUTCFullYear() &&
        last.getUTCMonth() === now.getUTCMonth() &&
        last.getUTCDate() === now.getUTCDate() &&
        last.getUTCHours() === now.getUTCHours() &&
        last.getUTCMinutes() === now.getUTCMinutes()
      ) {
        return false;
      }
    }

    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) return false;

    const [min, hour, dom, mon, dow] = parts;
    const matchField = (field: string, val: number) => {
      if (field === '*') return true;
      if (field.startsWith('*/')) {
        const step = parseInt(field.slice(2), 10);
        return !isNaN(step) && val % step === 0;
      }
      return parseInt(field, 10) === val;
    };

    return (
      matchField(min, now.getUTCMinutes()) &&
      matchField(hour, now.getUTCHours()) &&
      matchField(dom, now.getUTCDate()) &&
      matchField(mon, now.getUTCMonth() + 1) &&
      matchField(dow, now.getUTCDay())
    );
  }
}
