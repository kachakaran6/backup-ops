import React, { useState } from 'react';
import {
  Cloud,
  Plus,
  RefreshCw,
  Server,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { CoolifyConnection } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import * as api from '../services/api';

interface CoolifyViewProps {
  connections: CoolifyConnection[];
  onRefresh: () => void;
  onNavigateToServer: (serverId: string) => void;
}

export const CoolifyView: React.FC<CoolifyViewProps> = ({
  connections,
  onRefresh,
}) => {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [name, setName] = useState('Coolify Production');
  const [url, setUrl] = useState('https://coolify.example.com');
  const [apiToken, setApiToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; version?: string } | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await api.testCoolify({ url, apiToken });
    setTestResult(res);
    setTesting(false);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !apiToken) return;
    await api.connectCoolify({ name, url, apiToken });
    setShowConnectModal(false);
    setName('');
    setUrl('');
    setApiToken('');
    setTestResult(null);
    onRefresh();
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    await api.syncCoolify(id);
    setSyncingId(null);
    onRefresh();
  };

  const handleRemove = async (id: string) => {
    if (confirm('Disconnect this Coolify instance? Discovered servers will remain preserved in BackupOps.')) {
      await api.removeCoolify(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Coolify Infrastructure Sources</h3>
          <p className="text-xs text-zinc-400">
            Read-only discovery of servers, databases, and Docker workloads from your Coolify instances.
          </p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Connect Coolify Instance</span>
        </button>
      </div>

      {connections.length === 0 ? (
        <EmptyState
          icon={Cloud}
          title="No Coolify instances connected"
          description="Connect your self-hosted Coolify instance to automatically discover your servers, PostgreSQL databases, and applications without manual entry."
          actionText="Connect Coolify Instance"
          onAction={() => setShowConnectModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-400">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-zinc-100">{conn.name}</h4>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          conn.connectionStatus === 'connected'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {conn.connectionStatus.toUpperCase()}
                      </span>
                    </div>
                    <a
                      href={conn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-blue-400 flex items-center gap-1 mt-0.5"
                    >
                      <span>{conn.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSync(conn.id)}
                    disabled={syncingId === conn.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === conn.id ? 'animate-spin text-blue-400' : ''}`} />
                    <span>Sync Now</span>
                  </button>
                  <button
                    onClick={() => handleRemove(conn.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    title="Disconnect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Discovery Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/80">
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-400 uppercase font-medium">Servers</span>
                  <div className="text-lg font-bold text-zinc-100 font-mono mt-0.5">
                    {conn.serversDiscovered}
                  </div>
                </div>
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-400 uppercase font-medium">Databases</span>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                    {conn.databasesDiscovered}
                  </div>
                </div>
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-400 uppercase font-medium">Applications</span>
                  <div className="text-lg font-bold text-blue-400 font-mono mt-0.5">
                    {conn.applicationsDiscovered}
                  </div>
                </div>
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-400 uppercase font-medium">Last Sync</span>
                  <div className="text-xs font-mono text-zinc-300 mt-1 truncate">
                    {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleTimeString() : 'Never'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Connect Coolify Instance</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Instance Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production Coolify"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Coolify URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://coolify.mycompany.com"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">API Bearer Token</label>
                <input
                  type="password"
                  required
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Enter Coolify API token"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Stored encrypted with AES-256-GCM. Read-only inventory discovery only.
                </p>
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
                  disabled={testing || !url || !apiToken}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(false)}
                    className="px-3.5 py-1.5 bg-transparent hover:bg-zinc-800 text-zinc-400 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Save & Discover
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
