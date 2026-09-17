import { z } from 'zod';

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AuditAction {
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  RESOURCE_CREATE = 'resource.create',
  RESOURCE_UPDATE = 'resource.update',
  RESOURCE_DELETE = 'resource.delete',
  POLICY_CREATE = 'policy.create',
  POLICY_UPDATE = 'policy.update',
  POLICY_DELETE = 'policy.delete',
  JOB_START = 'job.start',
  JOB_CANCEL = 'job.cancel',
  CREDENTIAL_UPDATE = 'credential.update',
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  action: AuditAction;
  severity: AuditSeverity;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  action: z.nativeEnum(AuditAction),
  severity: z.nativeEnum(AuditSeverity),
  resourceId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  details: z.record(z.unknown()),
  timestamp: z.string(),
});
