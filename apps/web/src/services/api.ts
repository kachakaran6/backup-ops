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
  AuthUser,
  AuthResponse,
  NotificationIntegration,
  NotificationRule,
  NotificationDelivery,
} from '../types';

const API_BASE = '/api/v1';

let authToken: string | null = localStorage.getItem('backupops_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('backupops_token', token);
  } else {
    localStorage.removeItem('backupops_token');
  }
}

export function getAuthToken(): string | null {
  return authToken || localStorage.getItem('backupops_token');
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    setAuthToken(null);
    window.dispatchEvent(new CustomEvent('backupops:unauthorized'));
  }
  return res;
}

// Authentication & API Health
export async function checkApiHealth(): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return { ok: res.ok, status: res.status };
  } catch (err: any) {
    return { ok: false, status: 0, message: err.message || 'Connection unreachable' };
  }
}

export async function loginApi(emailOrUsername: string, password: string): Promise<AuthResponse> {
  const cleanId = emailOrUsername.trim();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernameOrEmail: cleanId,
        email: cleanId,
        password,
      }),
    });
  } catch (err: any) {
    throw new Error('Network error: Unable to reach the BackupOps API server. Please check connection or reverse proxy.');
  }

  if (!res.ok) {
    if (res.status === 502) {
      throw new Error('API Gateway 502: Upstream service unavailable. The backend control plane container is currently offline or restarting.');
    }
    if (res.status === 503) {
      throw new Error('API Gateway 503: Service temporarily unavailable. The backend is completing initialization.');
    }
    if (res.status === 504) {
      throw new Error('API Gateway 504: Gateway timeout contacting the control plane.');
    }
    if (res.status === 401) {
      throw new Error('Invalid credentials. Check your email/username and password.');
    }
    const err = await res.json().catch(() => ({ message: 'Authentication request failed' }));
    throw new Error(err.message || 'Authentication request failed');
  }

  const data: AuthResponse = await res.json();
  setAuthToken(data.accessToken);
  return data;
}

export async function registerApi(data: {
  email: string;
  username: string;
  password: string;
  displayName: string;
}): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err: any) {
    throw new Error('Network error: Unable to reach the BackupOps API server.');
  }

  if (!res.ok) {
    if (res.status === 502 || res.status === 503) {
      throw new Error(`API Gateway ${res.status}: Backend service is restarting or unavailable.`);
    }
    const err = await res.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(err.message || 'Registration failed');
  }

  const result: AuthResponse = await res.json();
  setAuthToken(result.accessToken);
  return result;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await authFetch(`${API_BASE}/auth/me`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

// Dashboard Overview
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await authFetch(`${API_BASE}/monitoring/dashboard?organizationId=default`);
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
    const res = await authFetch(`${API_BASE}/coolify?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function testCoolify(data: { url: string; apiToken: string }): Promise<{ success: boolean; latencyMs: number; message: string; version?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/coolify/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({ message: 'Connection test failed' }));
    return { success: false, latencyMs: 0, message: err.message || 'Server returned error' };
  } catch (err: any) {
    return { success: false, latencyMs: 0, message: err.message || 'Connection failed' };
  }
}

export async function connectCoolify(data: { name: string; url: string; apiToken: string }): Promise<CoolifyConnection | null> {
  try {
    const res = await authFetch(`${API_BASE}/coolify/connect?organizationId=default`, {
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
    const res = await authFetch(`${API_BASE}/coolify/${id}/sync?organizationId=default`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function removeCoolify(id: string): Promise<void> {
  try {
    await authFetch(`${API_BASE}/coolify/${id}?organizationId=default`, { method: 'DELETE' });
  } catch {}
}

// Servers
export async function fetchServers(): Promise<Server[]> {
  try {
    const res = await authFetch(`${API_BASE}/servers?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function fetchServer(id: string): Promise<Server | null> {
  try {
    const res = await authFetch(`${API_BASE}/servers/${id}?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function createServer(data: any): Promise<Server | null> {
  try {
    const res = await authFetch(`${API_BASE}/servers?organizationId=default`, {
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
    const res = await authFetch(`${API_BASE}/servers/test-ssh`, {
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
    const res = await authFetch(`${API_BASE}/servers/${serverId}/databases?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function fetchServerDocker(serverId: string): Promise<any> {
  try {
    const res = await authFetch(`${API_BASE}/servers/${serverId}/docker?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return { installed: false, running: false, containers: [], volumes: [] };
}

export async function removeServer(id: string): Promise<void> {
  try {
    await authFetch(`${API_BASE}/servers/${id}?organizationId=default`, { method: 'DELETE' });
  } catch {}
}

// Databases
export async function fetchDatabases(): Promise<Database[]> {
  try {
    const res = await authFetch(`${API_BASE}/databases?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function fetchDatabase(id: string): Promise<Database | null> {
  try {
    const res = await authFetch(`${API_BASE}/databases/${id}?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function createDatabase(data: any): Promise<Database | null> {
  try {
    const res = await authFetch(`${API_BASE}/databases?organizationId=default`, {
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
    const res = await authFetch(`${API_BASE}/databases/${id}/test?organizationId=default`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
  return { success: false, message: 'Connection test failed' };
}

export async function fetchDatabaseRecovery(id: string): Promise<any> {
  try {
    const res = await authFetch(`${API_BASE}/databases/${id}/recovery?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function removeDatabase(id: string): Promise<void> {
  try {
    await authFetch(`${API_BASE}/databases/${id}?organizationId=default`, { method: 'DELETE' });
  } catch {}
}

// Storage
export async function fetchStorage(): Promise<StorageDestination[]> {
  try {
    const res = await authFetch(`${API_BASE}/storage?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function createStorage(data: any): Promise<StorageDestination | null> {
  try {
    const res = await authFetch(`${API_BASE}/storage?organizationId=default`, {
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
    const res = await authFetch(`${API_BASE}/storage/test`, {
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
    const res = await authFetch(`${API_BASE}/storage/${id}/test?organizationId=default`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
  return { success: false, message: 'Test failed' };
}

export async function removeStorage(id: string): Promise<void> {
  try {
    await authFetch(`${API_BASE}/storage/${id}?organizationId=default`, { method: 'DELETE' });
  } catch {}
}

// Backups & Chains
export async function fetchBackups(): Promise<Backup[]> {
  try {
    const res = await authFetch(`${API_BASE}/backups?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function fetchBackupChains(databaseId?: string): Promise<BackupChain[]> {
  try {
    const url = databaseId
      ? `${API_BASE}/backups/chains?databaseId=${databaseId}&organizationId=default`
      : `${API_BASE}/backups/chains?organizationId=default`;
    const res = await authFetch(url);
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
    const res = await authFetch(`${API_BASE}/backups/trigger?organizationId=default`, {
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
    const res = await authFetch(`${API_BASE}/backups/${id}/verify?organizationId=default`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function fetchBackupRestorePlan(backupId: string): Promise<any> {
  try {
    const res = await authFetch(`${API_BASE}/backups/${backupId}/restore-plan?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

// Restores
export async function fetchRestoreJobs(): Promise<RestoreJob[]> {
  try {
    const res = await authFetch(`${API_BASE}/restores?organizationId=default`);
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
    const res = await authFetch(`${API_BASE}/restores?organizationId=default`, {
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
    const res = await authFetch(`${API_BASE}/jobs?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

// Policies
export async function fetchPolicies(): Promise<Policy[]> {
  try {
    const res = await authFetch(`${API_BASE}/policies?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function togglePolicy(id: string): Promise<void> {
  try {
    await authFetch(`${API_BASE}/policies/${id}/toggle?organizationId=default`, { method: 'POST' });
  } catch {}
}

// Credentials
export async function fetchCredentials(): Promise<Credential[]> {
  try {
    const res = await authFetch(`${API_BASE}/credentials?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

// Audit Logs
export async function fetchAuditLogs(): Promise<AuditLog[]> {
  try {
    const res = await authFetch(`${API_BASE}/audit-logs?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

// Notifications
export async function fetchNotificationIntegrations(): Promise<NotificationIntegration[]> {
  try {
    const res = await authFetch(`${API_BASE}/notifications/integrations?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function createNotificationIntegration(data: any): Promise<NotificationIntegration | null> {
  try {
    const res = await authFetch(`${API_BASE}/notifications/integrations?organizationId=default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function updateNotificationIntegration(id: string, data: any): Promise<NotificationIntegration | null> {
  try {
    const res = await authFetch(`${API_BASE}/notifications/integrations/${id}?organizationId=default`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function testNotificationIntegration(id: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  try {
    const res = await authFetch(`${API_BASE}/notifications/integrations/${id}/test?organizationId=default`, {
      method: 'POST',
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({ message: 'Test failed' }));
    return { success: false, message: err.message || 'Test failed' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection error' };
  }
}

export async function testNotificationConfig(data: any): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  try {
    const res = await authFetch(`${API_BASE}/notifications/test-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({ message: 'Test failed' }));
    return { success: false, message: err.message || 'Test failed' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection error' };
  }
}

export async function deleteNotificationIntegration(id: string): Promise<void> {
  try {
    await authFetch(`${API_BASE}/notifications/integrations/${id}?organizationId=default`, {
      method: 'DELETE',
    });
  } catch {}
}

export async function fetchNotificationRules(): Promise<NotificationRule[]> {
  try {
    const res = await authFetch(`${API_BASE}/notifications/rules?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function createCredential(data: any): Promise<Credential | null> {
  try {
    const res = await authFetch(`${API_BASE}/credentials?organizationId=default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function removeCredential(id: string): Promise<void> {
  try {
    await authFetch(`${API_BASE}/credentials/${id}?organizationId=default`, { method: 'DELETE' });
  } catch {}
}

export async function retryJob(id: string): Promise<void> {
  try {
    await authFetch(`${API_BASE}/jobs/${id}/retry?organizationId=default`, { method: 'POST' });
  } catch {}
}

export async function cancelJob(id: string): Promise<void> {
  try {
    await authFetch(`${API_BASE}/jobs/${id}/cancel?organizationId=default`, { method: 'POST' });
  } catch {}
}

export async function saveNotificationRule(eventOrData: any, data?: any): Promise<NotificationRule | null> {
  try {
    const event = typeof eventOrData === 'string' ? eventOrData : eventOrData?.event;
    const body = typeof eventOrData === 'string' ? { ...data, event } : eventOrData;
    const res = await authFetch(`${API_BASE}/notifications/rules/${event}?organizationId=default`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function fetchNotificationDeliveries(): Promise<NotificationDelivery[]> {
  try {
    const res = await authFetch(`${API_BASE}/notifications/deliveries?organizationId=default`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export const api = {
  auth: {
    login: loginApi,
    me: fetchCurrentUser,
    setToken: setAuthToken,
    getToken: getAuthToken,
  },
  servers: {
    list: fetchServers,
    get: fetchServer,
    create: createServer,
    delete: removeServer,
    test: testSshServer,
  },
  databases: {
    list: fetchDatabases,
    get: fetchDatabase,
    create: createDatabase,
    delete: removeDatabase,
    test: testDatabase,
  },
  storage: {
    list: fetchStorage,
    create: createStorage,
    delete: removeStorage,
    test: testExistingStorage,
  },
  coolify: {
    list: fetchCoolifyConnections,
    create: connectCoolify,
    delete: removeCoolify,
    test: testCoolify,
    sync: syncCoolify,
  },
  backups: {
    list: fetchBackups,
    chains: fetchBackupChains,
    trigger: triggerBackup,
    verify: verifyBackup,
    getRestorePlan: fetchBackupRestorePlan,
  },
  restore: {
    list: fetchRestoreJobs,
    create: createRestoreJob,
  },
  jobs: {
    list: fetchJobs,
    retry: retryJob,
    cancel: cancelJob,
  },
  notifications: {
    listIntegrations: fetchNotificationIntegrations,
    saveIntegration: createNotificationIntegration,
    deleteIntegration: deleteNotificationIntegration,
    testIntegration: testNotificationIntegration,
    listRules: fetchNotificationRules,
    updateRule: saveNotificationRule,
    listDeliveries: fetchNotificationDeliveries,
  },
  stats: {
    get: fetchDashboardStats,
  },
  audit: {
    list: fetchAuditLogs,
  },
  vault: {
    list: fetchCredentials,
    create: createCredential,
    delete: removeCredential,
  },
};

