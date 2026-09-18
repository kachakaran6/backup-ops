import React, { useState } from 'react';
import {
  HardDrive,
  Plus,
  Folder,
  Cloud,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { StorageDestination, StorageType } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { StatusIndicator } from '../components/common/StatusIndicator';
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
    const res = await api.testStorage({
      type,
      path: type === 'local' ? path : undefined,
      endpoint: type !== 'local' ? endpoint : undefined,
      region: type !== 'local' ? region : undefined,
      bucket: type !== 'local' ? bucket : undefined,
      prefix: type !== 'local' ? prefix : undefined,
    });
    setTestResult(res);
    setTesting(false);
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
    if (confirm('Remove this storage destination? Existing backups stored in this location will not be deleted.')) {
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

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-text-primary flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-text-muted" />
            Storage Pools & Destinations
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Local mounted filesystems, S3 buckets, and MinIO storage connected for backup storage and synchronization.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="op-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Storage Destination</span>
        </button>
      </div>

      {storageDestinations.length === 0 ? (
        <EmptyState
          icon={HardDrive}
          title="No storage destinations configured"
          description="Add a Local Filesystem directory (e.g. /var/lib/backupops/storage) or S3-compatible bucket to store your database backups."
          actionText="Add Storage Destination"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storageDestinations.map((dest) => {
            const isLocal = dest.type === 'local';
            return (
              <div
                key={dest.id}
                className="op-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-md bg-surface-secondary border border-border text-text-muted shrink-0">
                      {isLocal ? <Folder className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-text-primary truncate">{dest.name}</h4>
                      <p className="text-[11px] font-mono text-text-muted truncate">
                        {isLocal ? dest.path : `${dest.bucket} (${dest.region || 'default'})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusIndicator status={dest.status} variant="inline" />
                    <button
                      onClick={() => handleRemove(dest.id)}
                      className="op-btn-ghost !p-1 hover:text-error"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Capacity Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-border-subtle text-[11px] font-mono">
                  <div>
                    <span className="text-text-muted block text-[10px]">CAPACITY</span>
                    <span className="text-text-primary font-medium">
                      {dest.totalCapacityBytes ? formatBytes(dest.totalCapacityBytes) : 'Host disk'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">AVAILABLE</span>
                    <span className="text-text-secondary font-medium">
                      {dest.availableCapacityBytes ? formatBytes(dest.availableCapacityBytes) : 'Reported by OS'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">BACKUPS</span>
                    <span className="text-text-primary font-medium">{dest.backupCount}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">VERIFICATION</span>
                    <span className={dest.lastVerificationAt ? 'text-success font-medium' : 'text-text-muted'}>
                      {dest.lastVerificationAt ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Storage Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-text-muted" />
                <h3 className="font-semibold text-xs text-text-primary">Add Storage Destination</h3>
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
                <label className="block text-xs font-medium text-text-secondary mb-1">Storage Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Local High-Speed Storage"
                  className="op-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Destination Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as StorageType)}
                  className="op-input"
                >
                  <option value="local">Local Filesystem Mount</option>
                  <option value="s3">AWS S3 / S3-Compatible</option>
                  <option value="minio">MinIO Storage</option>
                  <option value="sftp">SFTP Server</option>
                </select>
              </div>

              {type === 'local' ? (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Mount Path</label>
                  <input
                    type="text"
                    required
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="./data/backups or /mnt/backups"
                    className="op-input font-mono"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    BackupOps will verify write/read/checksum capabilities on this path.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">S3 Endpoint URL (Optional for AWS)</label>
                    <input
                      type="text"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="minio.internal:9000 or https://s3.amazonaws.com"
                      className="op-input font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Bucket Name</label>
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
                      <label className="block text-xs font-medium text-text-secondary mb-1">Region</label>
                      <input
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="us-east-1"
                        className="op-input font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Access Key ID</label>
                      <input
                        type="text"
                        value={accessKeyId}
                        onChange={(e) => setAccessKeyId(e.target.value)}
                        placeholder="AKIA..."
                        className="op-input font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Secret Access Key</label>
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
                  disabled={testing}
                  className="op-btn-secondary"
                >
                  {testing ? 'Probing...' : 'Test Storage'}
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
                    Save Storage
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
