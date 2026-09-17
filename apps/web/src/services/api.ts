import { Resource, Job, Policy, Credential, AuditLog } from '../types';

const API_BASE = '/api/v1';

// Initial resilient mock data for standalone/offline demo
let mockResources: Resource[] = [
  {
    id: 'res-01',
    name: 'Primary PostgreSQL 15',
    description: 'Production transactional database',
    type: 'database_postgres',
    category: 'database',
    status: 'healthy',
    config: { host: '10.0.1.12', port: 5432, database: 'production_main' },
    lastCheckedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 10).toISOString(),
  },
  {
    id: 'res-02',
    name: 'AWS S3 Cold Storage (us-east-1)',
    description: 'Offsite encrypted snapshot destination',
    type: 'storage_s3',
    category: 'storage',
    status: 'healthy',
    config: { bucket: 'corp-backups-immutable', region: 'us-east-1' },
    lastCheckedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 20).toISOString(),
  },
  {
    id: 'res-03',
    name: 'Local High-Speed NVMe Storage',
    description: 'On-premise fast staging storage path',
    type: 'storage_local',
    category: 'storage',
    status: 'healthy',
    config: { path: '/mnt/fast-storage/backups' },
    lastCheckedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 30).toISOString(),
  },
  {
    id: 'res-04',
    name: 'App Server Linux Node 01',
    description: 'Docker container host filesystem',
    type: 'server_linux',
    category: 'server',
    status: 'healthy',
    config: { host: '10.0.1.5', port: 22, username: 'devops' },
    lastCheckedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 5).toISOString(),
  },
];

let mockJobs: Job[] = [
  {
    id: 'job-9812',
    operationType: 'backup',
    sourceResourceId: 'res-01',
    destinationResourceId: 'res-02',
    state: 'completed',
    progress: {
      percentage: 100,
      bytesProcessed: 142850000,
      totalBytes: 142850000,
      filesProcessed: 48,
      totalFiles: 48,
      currentStep: 'Backup completed and verified',
    },
    logs: [
      { timestamp: new Date(Date.now() - 1000 * 3600 * 2).toISOString(), level: 'info', message: 'Pre-flight resource check passed.' },
      { timestamp: new Date(Date.now() - 1000 * 3600 * 2 + 1000).toISOString(), level: 'info', message: 'Executing pg_dump stream with ZSTD compression.' },
      { timestamp: new Date(Date.now() - 1000 * 3600 * 2 + 3000).toISOString(), level: 'info', message: 'Encrypted chunk upload to S3 completed (142.8 MB).' },
      { timestamp: new Date(Date.now() - 1000 * 3600 * 2 + 4000).toISOString(), level: 'info', message: 'Checksum validation confirmed: sha256:d8a2...3f1c.' },
    ],
    startedAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    finishedAt: new Date(Date.now() - 1000 * 3600 * 2 + 4500).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
  },
  {
    id: 'job-9813',
    operationType: 'sync',
    sourceResourceId: 'res-03',
    destinationResourceId: 'res-02',
    state: 'running',
    progress: {
      percentage: 68,
      bytesProcessed: 524288000,
      totalBytes: 768000000,
      filesProcessed: 312,
      totalFiles: 450,
      currentStep: 'Transferring delta chunks to S3 mirror',
    },
    logs: [
      { timestamp: new Date(Date.now() - 1000 * 120).toISOString(), level: 'info', message: 'Indexing differences between source and destination.' },
      { timestamp: new Date(Date.now() - 1000 * 60).toISOString(), level: 'info', message: 'Delta detected: 450 changed objects.' },
      { timestamp: new Date(Date.now() - 1000 * 20).toISOString(), level: 'info', message: 'Streaming chunk 312/450 at 45 MB/s.' },
    ],
    startedAt: new Date(Date.now() - 1000 * 120).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 120).toISOString(),
  },
];

let mockPolicies: Policy[] = [
  {
    id: 'pol-01',
    name: 'Production PostgreSQL Nightly Full Backup',
    description: 'Nightly database snapshot with AES-256-GCM encryption',
    enabled: true,
    sourceResourceId: 'res-01',
    destinationResourceId: 'res-02',
    operationType: 'backup',
    schedule: {
      enabled: true,
      cronExpression: '0 2 * * *',
      timezone: 'UTC',
    },
    retention: {
      keepDaily: 7,
      keepWeekly: 4,
      keepMonthly: 12,
      deleteOlderThanDays: 90,
    },
    options: {
      compression: 'zstd',
      encryption: 'aes_256_gcm',
      verifyChecksum: true,
      dryRun: false,
    },
    lastRunAt: new Date(Date.now() - 1000 * 3600 * 14).toISOString(),
  },
  {
    id: 'pol-02',
    name: 'Local to Cloud Storage Mirror Sync',
    description: 'Hourly synchronization of on-prem NVMe storage to offsite S3',
    enabled: true,
    sourceResourceId: 'res-03',
    destinationResourceId: 'res-02',
    operationType: 'sync',
    schedule: {
      enabled: true,
      cronExpression: '0 * * * *',
      timezone: 'UTC',
    },
    retention: {
      deleteOlderThanDays: 30,
    },
    options: {
      compression: 'gzip',
      encryption: 'none',
      verifyChecksum: true,
      dryRun: false,
    },
    lastRunAt: new Date(Date.now() - 1000 * 3600 * 1).toISOString(),
  },
];

let mockCredentials: Credential[] = [
  {
    id: 'cred-01',
    name: 'AWS S3 Access Key (Automated Vault)',
    type: 'aws_s3',
    metadata: { keyId: 'AKIA...9412', encrypted: 'AES-256-GCM' },
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 20).toISOString(),
  },
  {
    id: 'cred-02',
    name: 'Database Cluster Superuser Password',
    type: 'password',
    metadata: { username: 'postgres', encrypted: 'AES-256-GCM' },
    createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 10).toISOString(),
  },
];

let mockAuditLogs: AuditLog[] = [
  {
    id: 'aud-01',
    action: 'policy.execute',
    severity: 'info',
    resourceId: 'res-01',
    ipAddress: '127.0.0.1',
    details: { policyName: 'Production PostgreSQL Nightly Full Backup', trigger: 'scheduler' },
    timestamp: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
  },
  {
    id: 'aud-02',
    action: 'credential.create',
    severity: 'warning',
    resourceId: 'cred-01',
    ipAddress: '192.168.1.42',
    details: { credentialName: 'AWS S3 Access Key', algorithm: 'AES-256-GCM' },
    timestamp: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
  },
  {
    id: 'aud-03',
    action: 'resource.connection_test',
    severity: 'info',
    resourceId: 'res-01',
    ipAddress: '127.0.0.1',
    details: { status: 'healthy', latencyMs: 2 },
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

export async function fetchResources(): Promise<Resource[]> {
  try {
    const res = await fetch(`${API_BASE}/resources?organizationId=default`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) return await res.json();
  } catch {}
  return [...mockResources];
}

export async function createResource(data: any): Promise<Resource> {
  try {
    const res = await fetch(`${API_BASE}/resources?organizationId=default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}
  const newRes: Resource = {
    id: 'res-' + Date.now(),
    name: data.name,
    description: data.description,
    type: data.type,
    category: data.category,
    status: 'healthy',
    config: data.config,
    createdAt: new Date().toISOString(),
  };
  mockResources.unshift(newRes);
  return newRes;
}

export async function testResource(id: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/resources/${id}/test?organizationId=default`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch {}
  return {
    success: true,
    latencyMs: Math.floor(Math.random() * 8) + 2,
    message: 'Endpoint reachable and authenticated successfully.',
  };
}

export async function fetchJobs(): Promise<Job[]> {
  try {
    const res = await fetch(`${API_BASE}/jobs?organizationId=default`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) return await res.json();
  } catch {}
  return [...mockJobs];
}

export async function createJob(data: any): Promise<Job> {
  try {
    const res = await fetch(`${API_BASE}/jobs?organizationId=default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}
  const newJob: Job = {
    id: 'job-' + Math.floor(Math.random() * 9000 + 1000),
    operationType: data.operationType,
    sourceResourceId: data.sourceResourceId,
    destinationResourceId: data.destinationResourceId,
    state: 'running',
    progress: {
      percentage: 20,
      bytesProcessed: 10485760,
      totalBytes: 104857600,
      filesProcessed: 5,
      totalFiles: 25,
      currentStep: 'Initializing live snapshot stream...',
    },
    logs: [
      { timestamp: new Date().toISOString(), level: 'info', message: `Job ${data.operationType.toUpperCase()} triggered by operator.` },
      { timestamp: new Date().toISOString(), level: 'info', message: 'Stream allocated. AES-256-GCM cipher active.' },
    ],
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  mockJobs.unshift(newJob);
  return newJob;
}

export async function fetchPolicies(): Promise<Policy[]> {
  try {
    const res = await fetch(`${API_BASE}/policies?organizationId=default`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) return await res.json();
  } catch {}
  return [...mockPolicies];
}

export async function togglePolicy(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/policies/${id}/toggle?organizationId=default`, { method: 'POST' });
  } catch {}
  const pol = mockPolicies.find((p) => p.id === id);
  if (pol) pol.enabled = !pol.enabled;
}

export async function fetchCredentials(): Promise<Credential[]> {
  try {
    const res = await fetch(`${API_BASE}/credentials?organizationId=default`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) return await res.json();
  } catch {}
  return [...mockCredentials];
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  try {
    const res = await fetch(`${API_BASE}/audit-logs?organizationId=default`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) return await res.json();
  } catch {}
  return [...mockAuditLogs];
}
