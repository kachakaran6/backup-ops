import { z } from 'zod';
import { OperationType, OperationOptions, OperationOptionsSchema } from './operation';

export enum JobState {
  QUEUED = 'queued',
  PLANNING = 'planning',
  RUNNING = 'running',
  VERIFYING = 'verifying',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  RETRYING = 'retrying',
}

export interface JobProgress {
  percentage: number;
  bytesProcessed: number;
  totalBytes: number;
  filesProcessed: number;
  totalFiles: number;
  currentStep: string;
  transferSpeedBytesPerSec?: number;
  etaSeconds?: number;
}

export interface JobLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  step?: string;
  metadata?: Record<string, unknown>;
}

export interface JobStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

export interface Job {
  id: string;
  organizationId: string;
  policyId?: string;
  operationType: OperationType;
  sourceResourceId: string;
  destinationResourceId?: string;
  state: JobState;
  progress: JobProgress;
  options: OperationOptions;
  steps: JobStep[];
  retryCount: number;
  maxRetries: number;
  checkpointId?: string;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const JobProgressSchema = z.object({
  percentage: z.number().min(0).max(100),
  bytesProcessed: z.number().min(0),
  totalBytes: z.number().min(0),
  filesProcessed: z.number().min(0),
  totalFiles: z.number().min(0),
  currentStep: z.string(),
  transferSpeedBytesPerSec: z.number().optional(),
  etaSeconds: z.number().optional(),
});

export const JobSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  policyId: z.string().uuid().optional(),
  operationType: z.nativeEnum(OperationType),
  sourceResourceId: z.string().uuid(),
  destinationResourceId: z.string().uuid().optional(),
  state: z.nativeEnum(JobState),
  progress: JobProgressSchema,
  options: OperationOptionsSchema,
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  checkpointId: z.string().optional(),
  error: z.string().optional(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
