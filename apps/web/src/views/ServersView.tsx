import React, { useState, useMemo } from 'react';
import {
  Server as ServerIcon,
  Plus,
  ChevronRight,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Cpu,
  HardDrive,
  Box,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { Server, ServerStatus } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { FilterBar } from '../components/common/FilterBar';
import * as api from '../services/api';

interface ServersViewProps {
  servers: Server[];
  onRefresh: () => void;
  onSelectServer: (server: Server) => void;
}

export const ServersView: React.FC<ServersViewProps> = ({
  servers,
  onRefresh,
  onSelectServer,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState('ubuntu');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; os?: string; arch?: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testSshServer({
        host,
        port,
        username,
        privateKey,
        password,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host || !name) return;
    await api.createServer({
      name,
      host,
      port,
      username,
      privateKey: privateKey || undefined,
      password: password || undefined,
    });
    setShowAddModal(false);
    setName('');
    setHost('');
    setPrivateKey('');
    setPassword('');
    setTestResult(null);
    onRefresh();
  };

  // Metrics summary
  const onlineCount = servers.filter((s) => s.status === 'online').length;
  const degradedCount = servers.filter((s) => s.status === 'degraded').length;
  const offlineCount = servers.filter((s) => s.status === 'offline').length;

  const filteredServers = useMemo(() => {
    return servers.filter((s) => {
      const matchesSearch =
        search === '' ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.host.toLowerCase().includes(search.toLowerCase()) ||
        (s.os && s.os.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' || s.status === statusFilter;

      const matchesMode =
        modeFilter === 'all' || s.connectionMode === modeFilter;

      return matchesSearch && matchesStatus && matchesMode;
    });
  }, [servers, search, statusFilter, modeFilter]);

  return (
    <div className="space-y-4">
      {/* Top Operational Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-base font-semibold text-text-primary tracking-tight">
            Infrastructure Servers
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Physical, virtual, and cloud nodes connected via Direct SSH or imported from Coolify.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onRefresh}
            className="op-btn-secondary"
            title="Refresh Server Fleet"
          >
            <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="op-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Server (SSH)</span>
          </button>
        </div>
      </div>

      {/* Health Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Total Fleet</span>
            <div className="text-lg font-semibold font-mono text-text-primary">{servers.length}</div>
          </div>
          <ServerIcon className="w-4 h-4 text-text-muted" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-success uppercase tracking-wider">Online & Healthy</span>
            <div className="text-lg font-semibold font-mono text-success">{onlineCount}</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-success ring-4 ring-success/20"></span>
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-warning uppercase tracking-wider">Degraded</span>
            <div className="text-lg font-semibold font-mono text-warning">{degradedCount}</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-warning ring-4 ring-warning/20"></span>
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-error uppercase tracking-wider">Offline / Unreachable</span>
            <div className="text-lg font-semibold font-mono text-error">{offlineCount}</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-error ring-4 ring-error/20"></span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <FilterBar
        searchPlaceholder="Filter servers by name, IP, OS..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: 'Status',
            options: [
              { label: 'All Statuses', value: 'all' },
              { label: 'Online', value: 'online' },
              { label: 'Degraded', value: 'degraded' },
              { label: 'Offline', value: 'offline' },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            label: 'Connection',
            options: [
              { label: 'All Modes', value: 'all' },
              { label: 'Direct SSH', value: 'ssh' },
              { label: 'Coolify Sync', value: 'coolify' },
              { label: 'Agent', value: 'agent' },
            ],
            value: modeFilter,
            onChange: setModeFilter,
          },
        ]}
        totalCount={servers.length}
        filteredCount={filteredServers.length}
      />

      {/* Server Table */}
      {servers.length === 0 ? (
        <EmptyState
          icon={ServerIcon}
          title="No infrastructure servers registered"
          description="Connect your first Linux host via SSH credentials or link a Coolify instance to automatically sync all managed hosts."
          actionText="Add Server (SSH)"
          onAction={() => setShowAddModal(true)}
        />
      ) : filteredServers.length === 0 ? (
        <div className="op-card p-8 text-center">
          <p className="text-xs text-text-muted">No servers match the active filters.</p>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setModeFilter('all');
            }}
            className="op-btn-ghost mt-2 text-xs"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="op-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Server</th>
                  <th>Mode</th>
                  <th>Host / Endpoint</th>
                  <th>OS & Arch</th>
                  <th>Specs</th>
                  <th>Docker</th>
                  <th>Status</th>
                  <th>Last Seen</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredServers.map((server) => {
                  const statusMap: Record<ServerStatus, any> = {
                    online: 'HEALTHY',
                    degraded: 'DEGRADED',
                    offline: 'OFFLINE',
                    unknown: 'UNKNOWN',
                  };

                  return (
                    <tr
                      key={server.id}
                      onClick={() => onSelectServer(server)}
                      className="cursor-pointer hover:bg-surface-hover transition-colors group"
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-surface-secondary border border-border flex items-center justify-center shrink-0 text-text-muted group-hover:text-accent transition-colors">
                            <ServerIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-text-primary group-hover:text-accent transition-colors truncate">
                              {server.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-mono uppercase text-text-secondary">
                          {server.connectionMode}
                        </span>
                      </td>
                      <td>
                        <div className="font-mono text-[11px] text-text-secondary">
                          {server.username ? `${server.username}@` : ''}{server.host}:{server.port}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs text-text-primary truncate max-w-[140px]">
                          {server.os || 'Linux'}
                        </div>
                        <div className="text-[10px] font-mono text-text-muted">
                          {server.arch || 'x86_64'}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs font-mono text-text-secondary">
                          {server.cpuCores ? `${server.cpuCores} Cores` : 'SSH Monitored'}
                        </div>
                        {server.memoryBytes ? (
                          <div className="text-[10px] font-mono text-text-muted">
                            {(server.memoryBytes / (1024 * 1024 * 1024)).toFixed(1)} GB RAM
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <span className="font-mono text-xs text-text-secondary">
                          {server.dockerInstalled
                            ? (server.dockerVersion ? `v${server.dockerVersion.split('.')[0]}` : 'Ready')
                            : 'None'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge
                          status={statusMap[server.status] || 'UNKNOWN'}
                          size="sm"
                        />
                      </td>
                      <td>
                        <span className="text-xs font-mono text-text-muted">
                          {server.lastHeartbeatAt
                            ? new Date(server.lastHeartbeatAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Unknown'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1 text-text-muted group-hover:text-accent font-medium text-xs">
                          <span className="hidden sm:inline">Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Server (SSH) Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-lg w-full p-5 space-y-4 shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-surface-secondary text-accent border border-border">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-text-primary">Connect Host via SSH</h3>
                  <p className="text-[11px] text-text-muted">Enables control plane discovery, disk metrics, and backup orchestration.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Server Name / Identifier</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. prod-db-node-01"
                  className="op-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-secondary mb-1">Host / IP Address</label>
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="192.168.1.100 or node.domain.com"
                    className="op-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">SSH Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="op-input font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">SSH Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ubuntu / root / debian"
                  className="op-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  SSH Private Key (Recommended)
                </label>
                <textarea
                  rows={3}
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                  className="op-input font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  SSH Password (Fallback)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password if not using SSH key"
                  className="op-input font-mono"
                />
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-md text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-success/10 text-success border border-success/30'
                      : 'bg-error/10 text-error border border-error/30'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="font-mono text-[11px]">{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !host}
                  className="op-btn-secondary"
                >
                  {testing ? 'Testing Handshake...' : 'Test Connection'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="op-btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="op-btn-primary"
                  >
                    Save Server
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
