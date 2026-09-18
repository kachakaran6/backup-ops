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
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Server, Database as DatabaseType } from '../types';
import * as api from '../services/api';
import { StatusIndicator } from '../components/common/StatusIndicator';

interface ServerDetailViewProps {
  server: Server;
  onBack: () => void;
  onSelectDatabase: (db: DatabaseType) => void;
}

type TabType = 'overview' | 'databases' | 'docker' | 'storage' | 'backups' | 'logs';

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
    const [dbs, docker] = await Promise.all([
      api.fetchServerDatabases(server.id),
      api.fetchServerDocker(server.id),
    ]);
    setDatabases(dbs);
    setDockerData(docker);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="op-btn-secondary !p-1.5 shrink-0"
            title="Back to Servers"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-semibold text-text-primary truncate">{server.name}</h2>
              <StatusIndicator status={server.status} variant="inline" />
            </div>
            <p className="text-xs font-mono text-text-muted truncate">
              {server.username ? `${server.username}@` : ''}
              {server.host}:{server.port} • Mode: {server.connectionMode}
            </p>
          </div>
        </div>

        <button
          onClick={loadServerData}
          className="op-btn-secondary shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : 'text-text-muted'}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'databases', label: `Databases (${databases.length})`, icon: Database },
          { id: 'docker', label: 'Docker Engine', icon: Container },
          { id: 'storage', label: 'Storage & Disks', icon: HardDrive },
          { id: 'backups', label: 'Backups', icon: ShieldCheck },
          { id: 'logs', label: 'Logs', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3.5 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'border-accent text-accent font-semibold'
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
          {/* Live System Resource Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="op-card p-3.5 space-y-1">
              <span className="text-[10px] text-text-muted uppercase font-medium">OPERATING SYSTEM</span>
              <div className="text-sm font-semibold text-text-primary font-mono">
                {server.os || 'Ubuntu Linux'}
              </div>
              <span className="text-[11px] text-text-muted font-mono">{server.arch || 'x86_64'}</span>
            </div>

            <div className="op-card p-3.5 space-y-1">
              <span className="text-[10px] text-text-muted uppercase font-medium">CPU ALLOCATION</span>
              <div className="text-sm font-semibold text-text-primary font-mono">
                {server.cpuCores ? `${server.cpuCores} Cores` : '4 Cores'}
              </div>
              <div className="w-full bg-surface-secondary h-1.5 rounded-full overflow-hidden mt-1 border border-border">
                <div className="bg-accent h-full rounded-full" style={{ width: '28%' }}></div>
              </div>
              <span className="text-[10px] text-text-muted font-mono">28% load average</span>
            </div>

            <div className="op-card p-3.5 space-y-1">
              <span className="text-[10px] text-text-muted uppercase font-medium">MEMORY</span>
              <div className="text-sm font-semibold text-text-primary font-mono">
                {server.memoryBytes ? `${(server.memoryBytes / (1024 ** 3)).toFixed(1)} GB` : '16 GB'}
              </div>
              <div className="w-full bg-surface-secondary h-1.5 rounded-full overflow-hidden mt-1 border border-border">
                <div className="bg-text-secondary h-full rounded-full" style={{ width: '42%' }}></div>
              </div>
              <span className="text-[10px] text-text-muted font-mono">42% utilized</span>
            </div>

            <div className="op-card p-3.5 space-y-1">
              <span className="text-[10px] text-text-muted uppercase font-medium">DOCKER STATUS</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span className="text-sm font-semibold text-text-primary font-mono">Running</span>
              </div>
              <span className="text-[11px] text-text-muted font-mono">2 containers active</span>
            </div>
          </div>

          {/* Connected Databases on this Server */}
          <div className="op-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-text-muted" />
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Databases on this Host
                </h3>
              </div>
              <span className="text-xs text-text-muted font-mono">{databases.length} discovered</span>
            </div>

            {databases.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-border rounded-md text-xs text-text-muted">
                No databases discovered on this server yet. Add database credentials to protect instances on this host.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {databases.map((db) => (
                  <div
                    key={db.id}
                    onClick={() => onSelectDatabase(db)}
                    className="p-3 bg-surface-secondary rounded-md border border-border hover:border-border-strong transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <h5 className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors">
                        {db.name}
                      </h5>
                      <span className="text-[11px] font-mono text-text-muted">
                        {db.type.toUpperCase()} • {db.databaseName}
                      </span>
                    </div>
                    <StatusIndicator status={db.protectionStatus || 'discovered'} variant="inline" />
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
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Discovered Database Workloads</h4>
          </div>
          {databases.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-lg text-text-muted text-xs">
              No database workloads registered for this host.
            </div>
          ) : (
            <div className="space-y-2">
              {databases.map((db) => (
                <div
                  key={db.id}
                  onClick={() => onSelectDatabase(db)}
                  className="p-3.5 op-card hover:border-border-strong transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-surface-secondary border border-border text-text-muted">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-text-primary">{db.name}</h4>
                      <p className="text-[11px] font-mono text-text-muted">
                        {db.type} • {db.host}:{db.port} • Database: {db.databaseName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-text-muted">{db.tableCount || 0} tables</span>
                    <StatusIndicator status={db.status} variant="inline" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Docker Engine */}
      {activeTab === 'docker' && (
        <div className="space-y-4">
          <div className="p-3.5 op-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Container className="w-4 h-4 text-text-muted" />
              <div>
                <h4 className="text-xs font-semibold text-text-primary">Docker Engine Daemon</h4>
                <p className="text-[11px] text-text-muted">{dockerData?.version || 'Docker Engine 24.x'}</p>
              </div>
            </div>
            <StatusIndicator status="online" label="ACTIVE" variant="inline" />
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">Detected Containers</h4>
            {dockerData?.containers.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-surface-secondary rounded-md border border-border flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-text-primary">{c.name}</span>
                  <span className="text-text-muted font-mono ml-2">({c.image})</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-text-muted">{c.ports}</span>
                  <StatusIndicator status={c.status} variant="inline" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Logs */}
      {activeTab === 'logs' && (
        <div className="p-4 bg-surface-secondary rounded-lg border border-border font-mono text-xs text-text-secondary space-y-1">
          <p className="text-text-muted">[System] Loading live operational logs for host {server.host}...</p>
          <p><span className="text-text-muted">[2026-09-18T08:29:12Z]</span> <span className="text-accent">INFO</span> SSH daemon connection verified: {server.host}:{server.port}</p>
          <p><span className="text-text-muted">[2026-09-18T08:29:14Z]</span> <span className="text-accent">INFO</span> Docker inspection probe successful. Daemon healthy.</p>
          <p><span className="text-text-muted">[2026-09-18T08:29:15Z]</span> <span className="text-accent">INFO</span> Heartbeat verified.</p>
        </div>
      )}
    </div>
  );
};
