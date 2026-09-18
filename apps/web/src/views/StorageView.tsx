import React, { useState, useMemo } from 'react';
import {
  HardDrive,
  Plus,
  Folder,
  Cloud,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  ShieldCheck,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { StorageDestination, StorageType } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { FilterBar } from '../components/common/FilterBar';
import * as api from '../services/api';

interface StorageViewProps {
  storageDestinations: StorageDestination[];
  onRefresh: () => void;
}

export const StorageView: React.FC<StorageViewProps> = ({
  storageDestinations,
  onRefresh,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [name, setName] = useState('Local Fast NVMe Backup');
  const [type, setType] = useState<StorageType>('local');
  const [path, setPath] = useState('./data/backups');
  const [endpoint, setEndpoint] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [bucket, setBucket] = useState('');
  const [prefix, setPrefix] = useState('backups/');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testStorage({
        type,
        path: type === 'local' ? path : undefined,
        endpoint: type !== 'local' ? endpoint : undefined,
        region: type !== 'local' ? region : undefined,
        bucket: type !== 'local' ? bucket : undefined,
        prefix: type !== 'local' ? prefix : undefined,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Storage connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await api.createStorage({
      name,
      type,
      path: type === 'local' ? path : undefined,
      endpoint: type !== 'local' ? endpoint : undefined,
      region: type !== 'local' ? region : undefined,
      bucket: type !== 'local' ? bucket : undefined,
      prefix: type !== 'local' ? prefix : undefined,
      accessKeyId: accessKeyId || undefined,
      secretAccessKey: secretAccessKey || undefined,
    });
    setShowAddModal(false);
    setName('');
    setTestResult(null);
    onRefresh();
  };

  const handleRemove = async (id: string) => {
    if (confirm('Remove this storage destination? Existing backups stored in this location will remain untouched.')) {
      await api.removeStorage(id);
      onRefresh();
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalDestinations = storageDestinations.length;
  const localDestinations = storageDestinations.filter((d) => d.type === 'local').length;
  const cloudDestinations = storageDestinations.filter((d) => d.type !== 'local').length;
  const totalBackups = storageDestinations.reduce((acc, d) => acc + (d.backupCount || 0), 0);

  const filteredDestinations = useMemo(() => {
    return storageDestinations.filter((d) => {
      const matchesSearch =
        search === '' ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.path && d.path.toLowerCase().includes(search.toLowerCase())) ||
        (d.bucket && d.bucket.toLowerCase().includes(search.toLowerCase()));

      const matchesType =
        typeFilter === 'all' || d.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [storageDestinations, search, typeFilter]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-base font-semibold text-text-primary tracking-tight">
            Storage Pools &amp; Targets
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Encrypted target endpoints for logical database dumps, physical Base snapshots, and continuous WAL segments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onRefresh}
            className="op-btn-secondary"
            title="Refresh Storage"
          >
            <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="op-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Storage Target</span>
          </button>
        </div>
      </div>

      {/* Operational Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Total Pools</span>
            <div className="text-lg font-semibold font-mono text-text-primary">{totalDestinations}</div>
          </div>
          <HardDrive className="w-4 h-4 text-text-muted" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-brand-primary uppercase tracking-wider">Local Mounted</span>
            <div className="text-lg font-semibold font-mono text-brand-primary">{localDestinations}</div>
          </div>
          <Folder className="w-4 h-4 text-brand-primary" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-info uppercase tracking-wider">S3 / MinIO</span>
            <div className="text-lg font-semibold font-mono text-info">{cloudDestinations}</div>
          </div>
          <Cloud className="w-4 h-4 text-info" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-success uppercase tracking-wider">Stored Backups</span>
            <div className="text-lg font-semibold font-mono text-success">{totalBackups}</div>
          </div>
          <ShieldCheck className="w-4 h-4 text-success" />
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Filter storage by name, path, bucket..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: 'Type',
            options: [
              { label: 'All Types', value: 'all' },
              { label: 'Local Filesystem', value: 'local' },
              { label: 'AWS S3', value: 's3' },
              { label: 'MinIO', value: 'minio' },
              { label: 'SFTP', value: 'sftp' },
            ],
            value: typeFilter,
            onChange: setTypeFilter,
          },
        ]}
        totalCount={totalDestinations}
        filteredCount={filteredDestinations.length}
      />

      {/* Storage Cards Matrix */}
      {storageDestinations.length === 0 ? (
        <EmptyState
          icon={HardDrive}
          title="No storage destinations configured"
          description="Add a Local Filesystem directory or S3-compatible bucket to securely store your database recovery chains."
          actionText="Add Storage Target"
          onAction={() => setShowAddModal(true)}
        />
      ) : filteredDestinations.length === 0 ? (
        <div className="op-card p-8 text-center text-xs text-text-muted">
          No storage pools match the active filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDestinations.map((dest) => {
            const isLocal = dest.type === 'local';
            const usedBytes = dest.usedCapacityBytes || 0;
            const totalBytes = dest.totalCapacityBytes || 0;
            const percent = totalBytes > 0 ? Math.min(100, Math.round((usedBytes / totalBytes) * 100)) : 0;

            return (
              <div
                key={dest.id}
                className="op-card p-4 space-y-3 flex flex-col justify-between hover:border-border-strong transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded bg-surface-secondary border border-border flex items-center justify-center shrink-0 text-text-muted">
                        {isLocal ? <Folder className="w-4 h-4 text-brand-primary" /> : <Cloud className="w-4 h-4 text-info" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-text-primary truncate">{dest.name}</h4>
                        <p className="text-[10px] font-mono text-text-muted truncate">
                          {isLocal ? dest.path : `${dest.bucket} (${dest.region || 'default'})`}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={dest.status === 'connected' ? 'HEALTHY' : 'FAILED'}
                      size="sm"
                    />
                  </div>

                  {/* Capacity & Usage Bar */}
                  <div className="space-y-1 pt-2 border-t border-border-subtle text-[11px] font-mono">
                    <div className="flex justify-between text-text-muted text-[10px]">
                      <span>CAPACITY UTILIZATION</span>
                      <span className="text-text-primary font-semibold">{percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-border">
                      <div
                        className="bg-brand-primary h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-text-muted pt-0.5">
                      <span>Used: {formatBytes(usedBytes)}</span>
                      <span>Total: {totalBytes > 0 ? formatBytes(totalBytes) : 'Dynamic'}</span>
                    </div>
                  </div>

                  {/* Specs & Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-text-muted">
                    <div>
                      <span className="block text-text-muted">PROTOCOL</span>
                      <span className="text-text-primary uppercase font-medium">{dest.type}</span>
                    </div>
                    <div>
                      <span className="block text-text-muted">STORED ARTIFACTS</span>
                      <span className="text-text-primary font-medium">{dest.backupCount || 0} backups</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-text-muted">LAST VERIFICATION</span>
                      <span className="text-text-secondary truncate block">
                        {dest.lastVerificationAt ? new Date(dest.lastVerificationAt).toLocaleString() : 'Pending verification probe'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                  <span className="text-[10px] text-success flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" />
                    Storage Ready
                  </span>
                  <button
                    onClick={() => handleRemove(dest.id)}
                    className="op-btn-ghost !p-1 text-text-muted hover:text-error"
                    title="Remove Storage Target"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Storage Target Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-lg w-full p-5 space-y-4 shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-brand-primary" />
                <h3 className="font-semibold text-sm text-text-primary">Configure Storage Target</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-secondary mb-1 font-medium">Destination Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Fast NVMe Backup Pool"
                  className="op-input"
                />
              </div>

              <div>
                <label className="block text-text-secondary mb-1 font-medium">Storage Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as StorageType)}
                  className="op-input font-sans"
                >
                  <option value="local">Local Filesystem Mount</option>
                  <option value="s3">Amazon S3</option>
                  <option value="minio">MinIO Object Storage</option>
                  <option value="sftp">SFTP Remote Host</option>
                </select>
              </div>

              {type === 'local' ? (
                <div>
                  <label className="block text-text-secondary mb-1 font-medium">Mount / Directory Path</label>
                  <input
                    type="text"
                    required
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="./data/backups or /mnt/backups"
                    className="op-input font-mono"
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-text-secondary mb-1 font-medium">Bucket Name</label>
                      <input
                        type="text"
                        required
                        value={bucket}
                        onChange={(e) => setBucket(e.target.value)}
                        placeholder="company-backups"
                        className="op-input font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-1 font-medium">Region</label>
                      <input
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="us-east-1"
                        className="op-input font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-text-secondary mb-1 font-medium">Custom S3 / MinIO Endpoint (Optional)</label>
                    <input
                      type="text"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="https://s3.us-east-1.amazonaws.com or https://minio.company.com"
                      className="op-input font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-text-secondary mb-1 font-medium">Access Key ID</label>
                      <input
                        type="text"
                        value={accessKeyId}
                        onChange={(e) => setAccessKeyId(e.target.value)}
                        placeholder="AKIAIOSFODNN7EXAMPLE"
                        className="op-input font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-1 font-medium">Secret Access Key</label>
                      <input
                        type="password"
                        value={secretAccessKey}
                        onChange={(e) => setSecretAccessKey(e.target.value)}
                        placeholder="Secret key"
                        className="op-input font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

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
                  disabled={testing}
                  className="op-btn-secondary"
                >
                  {testing ? 'Testing Target...' : 'Test Storage Target'}
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
                    Save Target
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
