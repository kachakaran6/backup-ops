import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    organizationId: string;
    userId?: string;
    action: string;
    severity?: 'info' | 'warning' | 'critical';
    resourceId?: string;
    ipAddress?: string;
    details?: Record<string, any>;
  }): Promise<AuditLog> {
    const entry = this.auditRepo.create({
      organizationId: params.organizationId,
      userId: params.userId,
      action: params.action,
      severity: params.severity || 'info',
      resourceId: params.resourceId,
      ipAddress: params.ipAddress,
      details: params.details || {},
    });
    return this.auditRepo.save(entry);
  }

  async findAll(organizationId: string): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { organizationId },
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }
}
