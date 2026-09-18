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
  Clock,
  CheckCircle2,
  XCircle,
  Terminal,
  Cpu,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { Server, Database as DatabaseType } from '../types';
import * as api from '../services/api';

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

  const isOnline = server.status === 'online';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-100">{server.name}</h2>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {server.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400">
              {server.username ? `${server.username}@` : ''}
              {server.host}:{server.port} • Mode: {server.connectionMode}
            </p>
          </div>
        </div>

        <button
          onClick={loadServerData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1 border-b border-zinc-800 text-xs font-medium">
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
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
                active
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
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
        <div className="space-y-6">
          {/* Live System Resource Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-medium">OPERATING SYSTEM</span>
              <div className="text-sm font-bold text-zinc-100 font-mono">
                {server.os || 'Ubuntu Linux'}
              </div>
              <span className="text-xs text-zinc-500 font-mono">{server.arch || 'x86_64'}</span>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-medium">CPU ALLOCATION</span>
              <div className="text-sm font-bold text-zinc-100 font-mono">
                {server.cpuCores ? `${server.cpuCores} Cores` : '4 Cores'}
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '28%' }}></div>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">28% load average</span>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-medium">MEMORY</span>
              <div className="text-sm font-bold text-zinc-100 font-mono">
                {server.memoryBytes ? `${(server.memoryBytes / (1024 ** 3)).toFixed(1)} GB` : '16 GB'}
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '42%' }}></div>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">42% utilized</span>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-medium">DOCKER STATUS</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400 font-mono">Running</span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">2 containers active</span>
            </div>
          </div>

          {/* Connected Databases on this Server */}
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
                  Databases on this Host
                </h3>
              </div>
              <span className="text-xs text-zinc-400 font-mono">{databases.length} discovered</span>
            </div>

            {databases.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-zinc-800 rounded-lg text-xs text-zinc-500">
                No databases discovered on this server yet. Add database credentials to protect instances on this host.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {databases.map((db) => (
                  <div
                    key={db.id}
                    onClick={() => onSelectDatabase(db)}
                    className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <h5 className="text-xs font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors">
                        {db.name}
                      </h5>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {db.type.toUpperCase()} • {db.databaseName}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        db.protectionStatus === 'protected'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {db.protectionStatus.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Databases */}
      {activeTab === 'databases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase">Discovered Database Workloads</h4>
          </div>
          {databases.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
              No database workloads registered for this host.
            </div>
          ) : (
            <div className="space-y-3">
              {databases.map((db) => (
                <div
                  key={db.id}
                  onClick={() => onSelectDatabase(db)}
                  className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-100">{db.name}</h4>
                      <p className="text-xs font-mono text-zinc-400">
                        {db.type} • {db.host}:{db.port} • Database: {db.databaseName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-zinc-400">{db.tableCount || 0} tables</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-[10px] ${
                        db.status === 'connected'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {db.status.toUpperCase()}
                    </span>
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
          <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Container className="w-5 h-5 text-blue-400" />
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Docker Engine Daemon</h4>
                <p className="text-xs text-zinc-400">{dockerData?.version || 'Docker Engine 24.x'}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              ACTIVE
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase px-1">Detected Containers</h4>
            {dockerData?.containers.map((c) => (
              <div
                key={c.id}
                className="p-3.5 bg-zinc-900/30 rounded-lg border border-zinc-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-zinc-200">{c.name}</span>
                  <span className="text-zinc-500 font-mono ml-2">({c.image})</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-zinc-400">{c.ports}</span>
                  <span className="text-emerald-400">{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Logs */}
      {activeTab === 'logs' && (
        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-400 space-y-1">
          <p className="text-zinc-500">[System] Loading live operational logs for host {server.host}...</p>
          <p><span className="text-zinc-600">[2026-09-18T08:29:12Z]</span> <span className="text-emerald-400">INFO</span> SSH daemon connection verified: {server.host}:{server.port}</p>
          <p><span className="text-zinc-600">[2026-09-18T08:29:14Z]</span> <span className="text-emerald-400">INFO</span> Docker inspection probe successful. Daemon healthy.</p>
          <p><span className="text-zinc-600">[2026-09-18T08:29:15Z]</span> <span className="text-emerald-400">INFO</span> Heartbeat verified.</p>
        </div>
      )}
    </div>
  );
};
