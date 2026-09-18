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
  Server,
  Database,
  Layers,
  ChevronRight,
  Shield,
  Radio,
} from 'lucide-react';
import { CoolifyConnection } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import * as api from '../services/api';

interface CoolifyViewProps {
  connections: CoolifyConnection[];
  onRefresh: () => void;
  onNavigateToServer?: (serverId: string) => void;
}

export const CoolifyView: React.FC<CoolifyViewProps> = ({
  connections,
  onRefresh,
  onNavigateToServer,
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
    try {
      const res = await api.testCoolify({ url, apiToken });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Coolify API test failed' });
    } finally {
      setTesting(false);
    }
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
    try {
      await api.syncCoolify(id);
    } catch (err: any) {
      console.error('Failed to sync Coolify:', err);
    } finally {
      setSyncingId(null);
      onRefresh();
    }
  };

  const handleRemove = async (id: string) => {
    if (confirm('Disconnect this Coolify instance? Discovered servers and database configurations will remain preserved in BackupOps.')) {
      await api.removeCoolify(id);
      onRefresh();
    }
  };

  const totalServersDiscovered = connections.reduce((acc, c) => acc + (c.serversDiscovered || 0), 0);
  const totalDatabasesDiscovered = connections.reduce((acc, c) => acc + (c.databasesDiscovered || 0), 0);
  const totalAppsDiscovered = connections.reduce((acc, c) => acc + (c.applicationsDiscovered || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-text-primary tracking-tight">
              Coolify Infrastructure Sources
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-secondary border border-border text-text-muted">
              {connections.length} instances
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            First-class inventory discovery linking projects, environments, server hosts, and containerized database workloads.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onRefresh}
            className="op-btn-secondary"
            title="Refresh Connections"
          >
            <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowConnectModal(true)}
            className="op-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Coolify Instance</span>
          </button>
        </div>
      </div>

      {/* Discovery Totals Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Connected Instances</span>
            <div className="text-lg font-semibold font-mono text-text-primary">{connections.length}</div>
          </div>
          <Cloud className="w-4 h-4 text-brand-primary" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Discovered Servers</span>
            <div className="text-lg font-semibold font-mono text-text-primary">{totalServersDiscovered}</div>
          </div>
          <Server className="w-4 h-4 text-text-muted" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-success uppercase tracking-wider">Discovered Databases</span>
            <div className="text-lg font-semibold font-mono text-success">{totalDatabasesDiscovered}</div>
          </div>
          <Database className="w-4 h-4 text-success" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-info uppercase tracking-wider">Discovered Apps</span>
            <div className="text-lg font-semibold font-mono text-info">{totalAppsDiscovered}</div>
          </div>
          <Layers className="w-4 h-4 text-info" />
        </div>
      </div>

      {/* Instance Cards Matrix */}
      {connections.length === 0 ? (
        <EmptyState
          icon={Cloud}
          title="No Coolify instances connected"
          description="Connect your self-hosted Coolify instance to automatically discover servers, databases, and Docker workloads without manual entry."
          actionText="Connect Coolify Instance"
          onAction={() => setShowConnectModal(true)}
        />
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="op-card p-4 sm:p-5 space-y-4 hover:border-border-strong transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded bg-surface-secondary border border-border text-brand-primary shrink-0">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-xs text-text-primary truncate">{conn.name}</h3>
                      <StatusBadge
                        status={conn.connectionStatus === 'connected' ? 'HEALTHY' : 'FAILED'}
                        size="sm"
                      />
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-secondary text-text-muted border border-border">
                        {conn.coolifyVersion || 'v4.x'}
                      </span>
                    </div>
                    <a
                      href={conn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-text-muted hover:text-brand-primary flex items-center gap-1 mt-0.5 truncate"
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
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === conn.id ? 'animate-spin text-brand-primary' : 'text-text-muted'}`} />
                    <span>{syncingId === conn.id ? 'Syncing...' : 'Sync Inventory'}</span>
                  </button>
                  <button
                    onClick={() => handleRemove(conn.id)}
                    className="op-btn-ghost !p-1.5 hover:text-error"
                    title="Disconnect Instance"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Discovery Matrix Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-border-subtle font-mono text-xs">
                <div className="p-2.5 bg-surface-secondary rounded border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-medium block">SERVERS IMPORTED</span>
                  <div className="text-base font-semibold text-text-primary mt-0.5">
                    {conn.serversDiscovered}
                  </div>
                </div>
                <div className="p-2.5 bg-surface-secondary rounded border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-medium block">DATABASES CATALOGED</span>
                  <div className="text-base font-semibold text-text-primary mt-0.5">
                    {conn.databasesDiscovered}
                  </div>
                </div>
                <div className="p-2.5 bg-surface-secondary rounded border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-medium block">APPLICATIONS</span>
                  <div className="text-base font-semibold text-text-primary mt-0.5">
                    {conn.applicationsDiscovered}
                  </div>
                </div>
                <div className="p-2.5 bg-surface-secondary rounded border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-medium block">LAST SYNCHRONIZED</span>
                  <div className="text-xs text-text-secondary mt-1 truncate">
                    {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleTimeString() : 'Pending sync'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-lg w-full p-5 space-y-4 shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-brand-primary" />
                <h3 className="font-semibold text-sm text-text-primary">Connect Coolify Instance</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnect} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-secondary mb-1 font-medium">Instance Name</label>
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
                <label className="block text-text-secondary mb-1 font-medium">Coolify URL</label>
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
                <label className="block text-text-secondary mb-1 font-medium">API Bearer Token</label>
                <input
                  type="password"
                  required
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Enter Coolify API token"
                  className="op-input font-mono"
                />
                <p className="text-[10px] text-text-muted mt-1 font-mono">
                  Stored encrypted with AES-256-GCM. Read-only inventory discovery only.
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-success/10 text-success border border-success/30'
                      : 'bg-error/10 text-error border border-error/30'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  <span className="font-mono text-[11px]">{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !url || !apiToken}
                  className="op-btn-secondary"
                >
                  {testing ? 'Testing API...' : 'Test Connection'}
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
                    Save &amp; Discover
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
