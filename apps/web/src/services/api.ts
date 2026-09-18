import {
  Server,
  Database,
  StorageDestination,
  CoolifyConnection,
  Backup,
  BackupChain,
  RestoreJob,
  Job,
  Policy,
  Credential,
  AuditLog,
  DashboardStats,
} from '../types';

const API_BASE = '/api/v1';

// Dashboard Overview
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_BASE}/monitoring/dashboard?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return {
    infrastructure: { totalServers: 0, onlineServers: 0, offlineServers: 0, coolifyInstances: 0 },
    databases: { totalDatabases: 0, healthyDatabases: 0, backupOverdueDatabases: 0, unprotectedDatabases: 0 },
    backups: { last24hSuccessful: 0, last24hFailed: 0, activeOperations: 0, totalArtifacts: 0 },
    storage: { totalDestinations: 0, usedCapacityBytes: 0, availableCapacityBytes: 0 },
    recovery: { validChains: 0, brokenChains: 0 },
  };
}

// Coolify Integration
export async function fetchCoolifyConnections(): Promise<CoolifyConnection[]> {
  try {
    const res = await fetch(`${API_BASE}/coolify?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function testCoolify(data: { url: string; apiToken: string }): Promise<{ success: boolean; latencyMs: number; message: string; version?: string }> {
  try {
    const res = await fetch(`${API_BASE}/coolify/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch (err: any) {
    return { success: false, latencyMs: 0, message: err.message || 'Connection failed' };
  }
  return { success: false, latencyMs: 0, message: 'Server returned error' };
}

export async function connectCoolify(data: { name: string; url: string; apiToken: string }): Promise<CoolifyConnection | null> {
  try {
    const res = await fetch(`${API_BASE}/coolify/connect?organizationId=default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function syncCoolify(id: string): Promise<CoolifyConnection | null> {
  try {
    const res = await fetch(`${API_BASE}/coolify/${id}/sync?organizationId=default`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function removeCoolify(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/coolify/${id}?organizationId=default`, { method: 'DELETE' });
  } catch {}
}

// Servers
export async function fetchServers(): Promise<Server[]> {
  try {
    const res = await fetch(`${API_BASE}/servers?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function fetchServer(id: string): Promise<Server | null> {
  try {
    const res = await fetch(`${API_BASE}/servers/${id}?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function createServer(data: any): Promise<Server | null> {
  try {
    const res = await fetch(`${API_BASE}/servers?organizationId=default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function testSshServer(data: any): Promise<{ success: boolean; latencyMs: number; message: string; os?: string; arch?: string }> {
  try {
    const res = await fetch(`${API_BASE}/servers/test-ssh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch (err: any) {
    return { success: false, latencyMs: 0, message: err.message };
  }
  return { success: false, latencyMs: 0, message: 'Server returned error' };
}

export async function fetchServerDatabases(serverId: string): Promise<Database[]> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/databases?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function fetchServerDocker(serverId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/docker?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return { installed: false, running: false, containers: [], volumes: [] };
}

export async function removeServer(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/servers/${id}?organizationId=default`, { method: 'DELETE' });
  } catch {}
}

// Databases
export async function fetchDatabases(): Promise<Database[]> {
  try {
    const res = await fetch(`${API_BASE}/databases?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function fetchDatabase(id: string): Promise<Database | null> {
  try {
    const res = await fetch(`${API_BASE}/databases/${id}?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function createDatabase(data: any): Promise<Database | null> {
  try {
    const res = await fetch(`${API_BASE}/databases?organizationId=default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function testDatabase(id: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/databases/${id}/test?organizationId=default`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
  return { success: false, message: 'Connection test failed' };
}

export async function fetchDatabaseRecovery(id: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/databases/${id}/recovery?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function removeDatabase(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/databases/${id}?organizationId=default`, { method: 'DELETE' });
  } catch {}
}

// Storage
export async function fetchStorage(): Promise<StorageDestination[]> {
  try {
    const res = await fetch(`${API_BASE}/storage?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function createStorage(data: any): Promise<StorageDestination | null> {
  try {
    const res = await fetch(`${API_BASE}/storage?organizationId=default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function testStorage(data: any): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/storage/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
  return { success: false, message: 'Test failed' };
}

export async function testExistingStorage(id: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/storage/${id}/test?organizationId=default`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
  return { success: false, message: 'Test failed' };
}

export async function removeStorage(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/storage/${id}?organizationId=default`, { method: 'DELETE' });
  } catch {}
}

// Backups & Chains
export async function fetchBackups(): Promise<Backup[]> {
  try {
    const res = await fetch(`${API_BASE}/backups?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function fetchBackupChains(databaseId?: string): Promise<BackupChain[]> {
  try {
    const url = databaseId
      ? `${API_BASE}/backups/chains?databaseId=${databaseId}&organizationId=default`
      : `${API_BASE}/backups/chains?organizationId=default`;
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function triggerBackup(data: {
  sourceDatabaseId: string;
  destinationStorageId: string;
  policyId?: string;
  type?: string;
  compression?: string;
  encryption?: string;
}): Promise<{ job: Job; backup: Backup } | null> {
  try {
    const res = await fetch(`${API_BASE}/backups/trigger?organizationId=default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function verifyBackup(id: string): Promise<Backup | null> {
  try {
    const res = await fetch(`${API_BASE}/backups/${id}/verify?organizationId=default`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

// Restores
export async function fetchRestoreJobs(): Promise<RestoreJob[]> {
  try {
    const res = await fetch(`${API_BASE}/restores?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function createRestoreJob(data: {
  backupId: string;
  targetType: string;
  targetServerId?: string;
  targetDatabaseId?: string;
  targetPath?: string;
  pointInTimeTarget?: string;
  overwriteConfirmed: boolean;
}): Promise<RestoreJob | null> {
  try {
    const res = await fetch(`${API_BASE}/restores?organizationId=default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

// Jobs & Operations
export async function fetchJobs(): Promise<Job[]> {
  try {
    const res = await fetch(`${API_BASE}/jobs?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

// Policies
export async function fetchPolicies(): Promise<Policy[]> {
  try {
    const res = await fetch(`${API_BASE}/policies?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function togglePolicy(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/policies/${id}/toggle?organizationId=default`, { method: 'POST' });
  } catch {}
}

// Credentials
export async function fetchCredentials(): Promise<Credential[]> {
  try {
    const res = await fetch(`${API_BASE}/credentials?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

// Audit Logs
export async function fetchAuditLogs(): Promise<AuditLog[]> {
  try {
    const res = await fetch(`${API_BASE}/audit-logs?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}
