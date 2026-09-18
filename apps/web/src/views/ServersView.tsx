import React, { useState } from 'react';
import {
  Server as ServerIcon,
  Plus,
  Terminal,
  Cpu,
  HardDrive,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Server } from '../types';
import { EmptyState } from '../components/common/EmptyState';
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Managed Infrastructure Servers</h3>
          <p className="text-xs text-zinc-400">
            Linux hosts connected via Direct SSH or discovered automatically from Coolify.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
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
                className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer space-y-4 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg border ${
                        isOnline
                          ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                      }`}
                    >
                      <ServerIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">
                        {server.name}
                      </h4>
                      <p className="text-xs font-mono text-zinc-400">
                        {server.username ? `${server.username}@` : ''}
                        {server.host}:{server.port}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {server.status.toUpperCase()}
                  </span>
                </div>

                {/* Specs grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono">
                  <div className="text-zinc-400">
                    <span className="text-zinc-400 block text-[10px]">OS / ARCH</span>
                    <span className="text-zinc-300 truncate block">
                      {server.os || 'Linux'} ({server.arch || 'x86_64'})
                    </span>
                  </div>
                  <div className="text-zinc-400">
                    <span className="text-zinc-400 block text-[10px]">CONNECTION</span>
                    <span className="text-zinc-300 block capitalize">
                      {server.connectionMode}
                    </span>
                  </div>
                  <div className="text-zinc-400">
                    <span className="text-zinc-400 block text-[10px]">DOCKER ENGINE</span>
                    <span className={server.dockerInstalled ? 'text-emerald-400 block' : 'text-zinc-500 block'}>
                      {server.dockerInstalled ? 'Running' : 'Not installed'}
                    </span>
                  </div>
                  <div className="text-zinc-400">
                    <span className="text-zinc-400 block text-[10px]">HEARTBEAT</span>
                    <span className="text-zinc-300 block">
                      {server.lastHeartbeatAt ? new Date(server.lastHeartbeatAt).toLocaleTimeString() : 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-blue-400 font-medium pt-1">
                  <span>Open Operational View</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Server Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ServerIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Add Server (SSH)</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Server Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production-01"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Host / IP Address</label>
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="192.168.1.100 or server.domain.com"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">SSH Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">SSH Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ubuntu / root / debian"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  SSH Private Key (Optional if using password)
                </label>
                <textarea
                  rows={3}
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  SSH Password (Optional if using key)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/40'
                      : 'bg-rose-950/30 text-rose-400 border border-rose-800/40'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !host}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-1.5 bg-transparent hover:bg-zinc-800 text-zinc-400 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
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
