import { z } from 'zod';
import { OperationType, OperationOptions, OperationOptionsSchema } from './operation';

export interface RetentionPolicy {
  keepHourly?: number;
  keepDaily?: number;
  keepWeekly?: number;
  keepMonthly?: number;
  keepYearly?: number;
  deleteOlderThanDays?: number;
}

export interface PolicySchedule {
  enabled: boolean;
  cronExpression?: string;
  intervalMinutes?: number;
  timezone: string;
}

export interface BackupPolicy {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  enabled: boolean;
  sourceResourceId: string;
  destinationResourceId: string;
  operationType: OperationType;
  schedule: PolicySchedule;
  retention: RetentionPolicy;
  options: OperationOptions;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const RetentionPolicySchema = z.object({
  keepHourly: z.number().optional(),
  keepDaily: z.number().optional(),
  keepWeekly: z.number().optional(),
  keepMonthly: z.number().optional(),
  keepYearly: z.number().optional(),
  deleteOlderThanDays: z.number().optional(),
});

export const PolicyScheduleSchema = z.object({
  enabled: z.boolean().default(true),
  cronExpression: z.string().optional(),
  intervalMinutes: z.number().optional(),
  timezone: z.string().default('UTC'),
});

export const BackupPolicySchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(true),
  sourceResourceId: z.string().uuid(),
  destinationResourceId: z.string().uuid(),
  operationType: z.nativeEnum(OperationType).default(OperationType.BACKUP),
  schedule: PolicyScheduleSchema,
  retention: RetentionPolicySchema,
  options: OperationOptionsSchema,
  lastRunAt: z.string().optional(),
  nextRunAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
