import React, { useState } from 'react';
import {
  Cloud,
  Plus,
  RefreshCw,
  ExternalLink,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { CoolifyConnection } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { StatusIndicator } from '../components/common/StatusIndicator';
import * as api from '../services/api';

interface CoolifyViewProps {
  connections: CoolifyConnection[];
  onRefresh: () => void;
  onNavigateToServer?: (serverId: string) => void;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-text-primary flex items-center gap-2">
            <Cloud className="w-4 h-4 text-text-muted" />
            Coolify Infrastructure Sources
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Read-only discovery of servers, databases, and Docker workloads from your Coolify instances.
          </p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="op-btn-primary self-start sm:self-auto"
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
              className="op-card p-4 sm:p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-md bg-surface-secondary border border-border text-text-muted shrink-0">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs text-text-primary truncate">{conn.name}</h4>
                      <StatusIndicator status={conn.connectionStatus} variant="inline" />
                    </div>
                    <a
                      href={conn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-text-muted hover:text-accent flex items-center gap-1 mt-0.5 truncate"
                    >
                      <span className="truncate">{conn.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleSync(conn.id)}
                    disabled={syncingId === conn.id}
                    className="op-btn-secondary"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === conn.id ? 'animate-spin text-accent' : 'text-text-muted'}`} />
                    <span>Sync Now</span>
                  </button>
                  <button
                    onClick={() => handleRemove(conn.id)}
                    className="op-btn-ghost !p-1.5 hover:text-error"
                    title="Disconnect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Discovery Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border-subtle">
                <div className="p-2.5 bg-surface-secondary rounded-md border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-medium">Servers</span>
                  <div className="text-base font-semibold text-text-primary font-mono mt-0.5">
                    {conn.serversDiscovered}
                  </div>
                </div>
                <div className="p-2.5 bg-surface-secondary rounded-md border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-medium">Databases</span>
                  <div className="text-base font-semibold text-text-primary font-mono mt-0.5">
                    {conn.databasesDiscovered}
                  </div>
                </div>
                <div className="p-2.5 bg-surface-secondary rounded-md border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-medium">Applications</span>
                  <div className="text-base font-semibold text-text-primary font-mono mt-0.5">
                    {conn.applicationsDiscovered}
                  </div>
                </div>
                <div className="p-2.5 bg-surface-secondary rounded-md border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-medium">Last Synchronized</span>
                  <div className="text-xs font-mono text-text-secondary mt-1 truncate">
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-text-muted" />
                <h3 className="font-semibold text-xs text-text-primary">Connect Coolify Instance</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnect} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Instance Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production Coolify"
                  className="op-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Coolify URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://coolify.mycompany.com"
                  className="op-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">API Bearer Token</label>
                <input
                  type="password"
                  required
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Enter Coolify API token"
                  className="op-input font-mono"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  Stored encrypted with AES-256-GCM. Read-only inventory discovery only.
                </p>
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
                  disabled={testing || !url || !apiToken}
                  className="op-btn-secondary"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(false)}
                    className="op-btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="op-btn-primary"
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
