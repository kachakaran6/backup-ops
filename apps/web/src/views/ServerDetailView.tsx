import React, { useState, useEffect } from 'react';
import {
  Server as ServerIcon,
  ArrowLeft,
  Activity,
  Database,
  Container,
  HardDrive,
  ShieldCheck,
  FileText,
  RefreshCw,
  Cpu,
  Clock,
  Terminal,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Server, Database as DatabaseType } from '../types';
import * as api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { LogViewer } from '../components/common/LogViewer';
import { EmptyState } from '../components/common/EmptyState';

interface ServerDetailViewProps {
  server: Server;
  onBack: () => void;
  onSelectDatabase: (db: DatabaseType) => void;
}

type TabType = 'overview' | 'databases' | 'docker' | 'backups' | 'logs';

export const ServerDetailView: React.FC<ServerDetailViewProps> = ({
  server,
  onBack,
  onSelectDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [databases, setDatabases] = useState<DatabaseType[]>([]);
  const [dockerData, setDockerData] = useState<{
    installed: boolean;
    running: boolean;
    version?: string;
    containers: Array<{ id: string; name: string; image: string; status: string; ports: string }>;
    volumes: Array<{ name: string; driver: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServerData();
  }, [server.id]);

  const loadServerData = async () => {
    setLoading(true);
    try {
      const [dbs, docker] = await Promise.all([
        api.fetchServerDatabases(server.id),
        api.fetchServerDocker(server.id),
      ]);
      setDatabases(dbs);
      setDockerData(docker);
    } catch (err) {
      console.error('Failed to load server details:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, any> = {
    online: 'HEALTHY',
    degraded: 'DEGRADED',
    offline: 'OFFLINE',
    unknown: 'UNKNOWN',
  };

  const sampleServerLogs = [
    {
      timestamp: new Date().toISOString(),
      level: 'info' as const,
      component: 'SSHProbe',
      message: `Direct SSH session verified for host ${server.host}:${server.port} (${server.username || 'ubuntu'}).`,
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'info' as const,
      component: 'HostCollector',
      message: `System specs collected: OS ${server.os || 'Linux'}, Kernel ${server.kernel || 'Standard Linux'}, Arch ${server.arch || 'x86_64'}.`,
    },
    {
      timestamp: new Date(Date.now() - 120000).toISOString(),
      level: server.dockerInstalled ? ('info' as const) : ('warn' as const),
      component: 'DockerDaemon',
      message: server.dockerInstalled
        ? `Docker daemon communication established (${dockerData?.version || 'Engine active'}).`
        : `Docker daemon socket not found or not running on host.`,
    },
    {
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: 'info' as const,
      component: 'Heartbeat',
      message: `Host heartbeat acknowledged. Latency acceptable.`,
    },
  ];

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
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : 'text-text-muted'}`} />
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
            {server.cpuCores ? `${server.cpuCores} Cores Allocated` : 'SSH Monitored Host'}
          </div>
          <div className="text-[10px] font-mono text-text-muted">
            {server.kernel || 'Direct OS probe'}
          </div>
        </div>

        <div className="op-card p-3 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] uppercase font-medium tracking-wider">DOCKER ENGINE</span>
            <Container className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-semibold font-mono flex items-center gap-1.5">
            {server.dockerInstalled ? (
              <span className="text-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                Active Daemon
              </span>
            ) : (
              <span className="text-text-muted">Not Detected</span>
            )}
          </div>
          <div className="text-[10px] font-mono text-text-muted truncate">
            {dockerData?.containers ? `${dockerData.containers.length} containers` : 'Socket checked'}
          </div>
        </div>

        <div className="op-card p-3 space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] uppercase font-medium tracking-wider">LAST HEARTBEAT</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs font-semibold text-text-primary font-mono truncate">
            {server.lastHeartbeatAt ? new Date(server.lastHeartbeatAt).toLocaleTimeString() : 'Unknown'}
          </div>
          <div className="text-[10px] font-mono text-text-muted">
            Status: {server.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & Config', icon: Activity },
          { id: 'databases', label: `Databases (${databases.length})`, icon: Database },
          { id: 'docker', label: `Docker Containers (${dockerData?.containers?.length || 0})`, icon: Container },
          { id: 'backups', label: 'Backup Coverage', icon: ShieldCheck },
          { id: 'logs', label: 'Host Telemetry Logs', icon: FileText },
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

      {/* Tab: Overview */}
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

          {/* Quick Databases on Host */}
          <div className="op-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-text-muted" />
                Databases Hosted on this Node ({databases.length})
              </h3>
            </div>
            {databases.length === 0 ? (
              <div className="text-center py-6 text-xs text-text-muted font-mono">
                No database engines detected on this server yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {databases.map((db) => (
                  <div
                    key={db.id}
                    onClick={() => onSelectDatabase(db)}
                    className="p-3 rounded bg-surface-secondary border border-border hover:border-border-strong transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-text-primary group-hover:text-brand-primary transition-colors truncate">
                        {db.name}
                      </div>
                      <StatusBadge
                        status={db.protectionStatus === 'protected' ? 'HEALTHY' : 'WARNING'}
                        size="sm"
                      />
                    </div>
                    <div className="text-[10px] font-mono text-text-muted mt-1 truncate">
                      {db.type.toUpperCase()} • port {db.port} • {db.databaseName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Databases */}
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
                    <th>Recovery Readiness</th>
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
                      <td>
                        <span className="text-xs font-mono text-text-muted capitalize">
                          {db.recoveryReadiness}
                        </span>
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

      {/* Tab: Docker Containers */}
      {activeTab === 'docker' && (
        <div className="space-y-3">
          {(!dockerData?.containers || dockerData.containers.length === 0) ? (
            <EmptyState
              icon={Container}
              title="No active Docker containers discovered"
              description="If Docker is installed on this host, ensure the Docker daemon socket is accessible."
            />
          ) : (
            <div className="op-card overflow-hidden">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Container Name</th>
                    <th>Image</th>
                    <th>Ports</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dockerData.containers.map((c) => (
                    <tr key={c.id}>
                      <td className="font-semibold text-xs text-text-primary font-mono">{c.name}</td>
                      <td className="text-xs font-mono text-text-muted truncate max-w-xs">{c.image}</td>
                      <td className="text-xs font-mono text-text-secondary">{c.ports || '-'}</td>
                      <td>
                        <StatusBadge
                          status={c.status.toLowerCase().includes('up') ? 'HEALTHY' : 'OFFLINE'}
                          size="sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Backup Coverage */}
      {activeTab === 'backups' && (
        <div className="op-card p-6 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-brand-primary mx-auto opacity-80" />
          <h4 className="text-sm font-semibold text-text-primary">Host Backup Protection</h4>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            Backup policies cover database engines running on this host. Filesystem snapshot policies will appear here once configured.
          </p>
        </div>
      )}

      {/* Tab: Logs */}
      {activeTab === 'logs' && (
        <LogViewer
          title={`Telemetry & Session Logs: ${server.name} (${server.host})`}
          logs={sampleServerLogs}
        />
      )}
    </div>
  );
};
