import React, { useState } from 'react';
import {
  Server as ServerIcon,
  Plus,
  ChevronRight,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Server } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { StatusIndicator } from '../components/common/StatusIndicator';
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
    const res = await api.testSshServer({
      host,
      port,
      username,
      privateKey,
      password,
    });
    setTestResult(res);
    setTesting(false);
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

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-text-primary flex items-center gap-2">
            <ServerIcon className="w-4 h-4 text-text-muted" />
            Managed Infrastructure Servers
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Linux hosts connected via Direct SSH or discovered automatically from Coolify.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="op-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Server (SSH)</span>
        </button>
      </div>

      {servers.length === 0 ? (
        <EmptyState
          icon={ServerIcon}
          title="No servers connected"
          description="Add a Linux server manually using SSH credentials, or connect a Coolify instance to automatically import all managed servers."
          actionText="Add Server (SSH)"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.map((server) => {
            const isOnline = server.status === 'online';
            return (
              <div
                key={server.id}
                onClick={() => onSelectServer(server)}
                className="op-card p-4 hover:border-border-strong transition-colors cursor-pointer space-y-3 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-md bg-surface-secondary border border-border text-text-muted shrink-0">
                      <ServerIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                        {server.name}
                      </h4>
                      <p className="text-[11px] font-mono text-text-muted truncate">
                        {server.username ? `${server.username}@` : ''}
                        {server.host}:{server.port}
                      </p>
                    </div>
                  </div>
                  <StatusIndicator status={server.status} variant="inline" />
                </div>

                {/* Specs grid */}
                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-border-subtle text-[11px] font-mono">
                  <div>
                    <span className="text-text-muted block text-[10px]">OS / ARCH</span>
                    <span className="text-text-secondary truncate block">
                      {server.os || 'Linux'} ({server.arch || 'x86_64'})
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">MODE</span>
                    <span className="text-text-secondary block capitalize">
                      {server.connectionMode}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">DOCKER</span>
                    <span className={server.dockerInstalled ? 'text-success block' : 'text-text-muted block'}>
                      {server.dockerInstalled ? 'Running' : 'Not installed'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">HEARTBEAT</span>
                    <span className="text-text-secondary block truncate">
                      {server.lastHeartbeatAt ? new Date(server.lastHeartbeatAt).toLocaleTimeString() : 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted group-hover:text-accent font-medium pt-1">
                  <span>Open Operational View</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Server Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ServerIcon className="w-4 h-4 text-text-muted" />
                <h3 className="font-semibold text-xs text-text-primary">Add Server (SSH)</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Server Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production-01"
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
                    placeholder="192.168.1.100 or server.domain.com"
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
                  SSH Private Key (Optional if using password)
                </label>
                <textarea
                  rows={3}
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                  className="op-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  SSH Password (Optional if using key)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="op-input font-mono"
                />
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-md text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-success-muted text-success border border-success/30'
                      : 'bg-error-muted text-error border border-error/30'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !host}
                  className="op-btn-secondary"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
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
