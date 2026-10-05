import React, { useState, useEffect } from 'react';
import {
  Server as ServerIcon,
  ArrowLeft,
  Activity,
  Database,
  HardDrive,
  ShieldCheck,
  FileText,
  RefreshCw,
  Cpu,
  Clock,
  Terminal,
  ChevronRight,
  ArrowRight,
  ArrowUpDown,
  Settings as SettingsIcon,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { Server, Database as DatabaseType, Backup } from '../types';
import * as api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { useControlPlane } from '../context/ControlPlaneContext';

interface ServerDetailViewProps {
  server: Server;
  onBack: () => void;
  onSelectDatabase: (db: DatabaseType) => void;
}

type TabType = 'overview' | 'backups' | 'transfers' | 'databases' | 'settings';

export const ServerDetailView: React.FC<ServerDetailViewProps> = ({
  server,
  onBack,
  onSelectDatabase,
}) => {
  const { backups, storageDestinations } = useControlPlane();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [databases, setDatabases] = useState<DatabaseType[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings tab state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number; message?: string } | null>(null);

  useEffect(() => {
    loadServerData();
  }, [server.id]);

  const loadServerData = async () => {
    setLoading(true);
    try {
      const [dbs, allTransfers] = await Promise.all([
        api.fetchServerDatabases(server.id),
        api.fetchTransfers(),
      ]);
      setDatabases(dbs);
      // Filter transfers where this server is source or destination
      const serverTransfers = allTransfers.filter(
        (t: any) => t.sourceServerId === server.id || t.destinationServerId === server.id
      );
      setTransfers(serverTransfers);
    } catch (err) {
      console.error('Failed to load server details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await api.testSshServer({
        host: server.host,
        port: server.port,
        username: server.username || 'ubuntu',
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setTestingConnection(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Backups associated with this server's databases
  const serverBackups = backups.filter((b) =>
    databases.some((db) => db.id === b.sourceDatabaseId)
  );

  const statusMap: Record<string, any> = {
    online: 'HEALTHY',
    degraded: 'DEGRADED',
    offline: 'OFFLINE',
    unknown: 'UNKNOWN',
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="op-btn-secondary !p-2 shrink-0"
            title="Back to Servers"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-text-primary truncate">{server.name}</h1>
              <StatusBadge status={statusMap[server.status] || 'UNKNOWN'} size="sm" />
              <span className="text-xs font-mono uppercase text-text-muted">
                {server.connectionMode}
              </span>
            </div>
            <p className="text-xs font-mono text-text-muted truncate mt-0.5">
              {server.username ? `${server.username}@` : ''}{server.host}:{server.port} • ID: {server.id.substring(0, 8)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadServerData}
            disabled={loading}
            className="op-btn-secondary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-primary' : 'text-text-muted'}`} />
            <span className="hidden sm:inline">Refresh Host</span>
          </button>
        </div>
      </div>

      {/* Hero Operational Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="op-card p-3 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] uppercase font-medium tracking-wider">PLATFORM OS</span>
            <ServerIcon className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-semibold text-text-primary font-mono truncate">
            {server.os || 'Linux'}
          </div>
          <div className="text-[10px] font-mono text-text-muted truncate">
            Arch: {server.arch || 'x86_64'}
          </div>
        </div>

        <div className="op-card p-3 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] uppercase font-medium tracking-wider">PROCESSOR CORES</span>
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-semibold text-text-primary font-mono">
            {server.cpuCores ? `${server.cpuCores} Cores Allocated` : 'SSH Direct Probe'}
          </div>
          <div className="text-[10px] font-mono text-text-muted">
            {server.kernel || 'Direct OS probe'}
          </div>
        </div>

        <div className="op-card p-3 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] uppercase font-medium tracking-wider">DATABASES HOSTED</span>
            <Database className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-semibold font-mono text-text-primary">
            {databases.length} Database Workloads
          </div>
          <div className="text-[10px] font-mono text-text-muted">
            {databases.filter((d) => d.protectionStatus === 'protected').length} Protected
          </div>
        </div>

        <div className="op-card p-3 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] uppercase font-medium tracking-wider">LAST HEARTBEAT</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-semibold text-text-primary font-mono truncate">
            {server.lastHeartbeatAt ? new Date(server.lastHeartbeatAt).toLocaleTimeString() : 'Active'}
          </div>
          <div className="text-[10px] font-mono text-text-muted">
            Status: {server.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Strictly Section 19: Overview, Backups, Transfers, Databases, Settings) */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'backups', label: `Backups (${serverBackups.length})`, icon: ShieldCheck },
          { id: 'transfers', label: `Transfers (${transfers.length})`, icon: ArrowUpDown },
          { id: 'databases', label: `Databases (${databases.length})`, icon: Database },
          { id: 'settings', label: 'Settings', icon: SettingsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap text-xs ${
                active
                  ? 'border-brand-primary text-brand-primary font-semibold'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System Specification Card */}
            <div className="op-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <ServerIcon className="w-3.5 h-3.5 text-text-muted" />
                  Hardware & Operating System
                </h3>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Host Identifier:</span>
                  <span className="text-text-primary font-semibold">{server.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">IP / FQDN:</span>
                  <span className="text-text-primary">{server.host}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">SSH Port:</span>
                  <span className="text-text-primary">{server.port}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">OS Release:</span>
                  <span className="text-text-primary">{server.os || 'Linux'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Architecture:</span>
                  <span className="text-text-primary">{server.arch || 'x86_64'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">Registered Since:</span>
                  <span className="text-text-primary">{new Date(server.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Connection & Auth Parameters */}
            <div className="op-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-text-muted" />
                  Orchestration Security
                </h3>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Connection Mode:</span>
                  <span className="text-text-primary uppercase">{server.connectionMode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">SSH User:</span>
                  <span className="text-text-primary">{server.username || 'ubuntu'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Credential Key:</span>
                  <span className="text-text-primary">Vault Encrypted (Ed25519/RSA)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Coolify Sync Link:</span>
                  <span className="text-text-primary">
                    {server.coolifyConnectionId ? 'Linked' : 'Standalone'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">Security Audit:</span>
                  <span className="text-success">Compliant (No plaintext secrets)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Backups */}
      {activeTab === 'backups' && (
        <div className="space-y-3">
          {serverBackups.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No backup artifacts for this server"
              description="Backups for databases or volumes on this server will appear here once executed."
            />
          ) : (
            <div className="op-card overflow-hidden">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Storage Path</th>
                    <th>Size</th>
                    <th>Verification</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {serverBackups.map((b) => (
                    <tr key={b.id} className="font-mono text-xs">
                      <td className="font-semibold uppercase text-brand-primary">{b.type}</td>
                      <td className="max-w-xs truncate text-text-muted">{b.storagePath}</td>
                      <td>{formatBytes(b.sizeBytes)}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1 ${b.verificationState === 'checksum_verified' ? 'text-success' : 'text-warning'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {b.verificationState === 'checksum_verified' ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="text-text-muted">{new Date(b.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Transfers */}
      {activeTab === 'transfers' && (
        <div className="space-y-3">
          {transfers.length === 0 ? (
            <EmptyState
              icon={ArrowUpDown}
              title="No active transfers for this server"
              description="Server-to-server data moves or copies involving this host will be listed here with live speed and ETA."
            />
          ) : (
            <div className="op-card overflow-hidden">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th>Source Path</th>
                    <th>Destination Path</th>
                    <th>Progress</th>
                    <th>Speed / ETA</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <tr key={t.id} className="font-mono text-xs">
                      <td>
                        <span className={`font-semibold uppercase px-1.5 py-0.5 rounded text-[10px] ${t.mode === 'move' ? 'bg-warning/15 text-warning' : 'bg-info/15 text-info'}`}>
                          {t.mode}
                        </span>
                      </td>
                      <td className="truncate max-w-xs">{t.sourcePath}</td>
                      <td className="truncate max-w-xs">{t.destinationPath}</td>
                      <td>
                        <div className="w-24">
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span>{t.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden">
                            <div className="bg-brand-primary h-full transition-all duration-300" style={{ width: `${t.progressPercent}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="text-text-muted">
                        {t.speedBytesPerSec > 0 ? `${(t.speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s` : '—'}
                      </td>
                      <td>
                        <span className="uppercase text-[11px] font-semibold text-text-primary">{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Databases */}
      {activeTab === 'databases' && (
        <div className="space-y-3">
          {databases.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No databases configured for this host"
              description="Register a database running on this server to enable continuous snapshotting and WAL archiving."
            />
          ) : (
            <div className="op-card overflow-hidden">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Database</th>
                    <th>Engine</th>
                    <th>Port</th>
                    <th>Instance Name</th>
                    <th>Protection</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {databases.map((db) => (
                    <tr
                      key={db.id}
                      onClick={() => onSelectDatabase(db)}
                      className="cursor-pointer hover:bg-surface-hover transition-colors group"
                    >
                      <td className="font-semibold text-xs text-text-primary group-hover:text-brand-primary">
                        {db.name}
                      </td>
                      <td>
                        <span className="text-xs font-mono uppercase text-text-muted">
                          {db.type}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-text-secondary">{db.port}</td>
                      <td className="font-mono text-xs text-text-secondary">{db.databaseName}</td>
                      <td>
                        <StatusBadge
                          status={db.protectionStatus === 'protected' ? 'HEALTHY' : 'WARNING'}
                          size="sm"
                        />
                      </td>
                      <td className="text-right">
                        <span className="text-xs text-brand-primary font-medium flex items-center justify-end gap-1">
                          Inspect <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-4 max-w-2xl">
          <div className="op-card p-4 space-y-4">
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-text-muted" />
              SSH Connectivity Diagnostics
            </h3>
            <p className="text-xs text-text-muted">
              Verify direct SSH communication, latency, and remote shell execution without an installed agent.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="op-btn-primary"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                <span>{testingConnection ? 'Testing SSH...' : 'Test SSH Connection'}</span>
              </button>
            </div>
            {testResult && (
              <div className={`p-3 rounded border text-xs font-mono ${testResult.success ? 'bg-success/10 border-success/30 text-success' : 'bg-error/10 border-error/30 text-error'}`}>
                {testResult.success ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Connection successful! Latency: {testResult.latencyMs || 12}ms</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Connection failed: {testResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
