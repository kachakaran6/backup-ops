import React, { useState } from 'react';
import {
  HardDrive,
  Plus,
  RefreshCw,
  Folder,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react';
import { StorageDestination, StorageType } from '../types';
import { EmptyState } from '../components/common/EmptyState';
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Storage Pools & Destinations</h3>
          <p className="text-xs text-zinc-400">
            Local mounted filesystems, S3 buckets, and MinIO storage connected for backup storage and synchronization.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
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
            const isConnected = dest.status === 'connected';
            const isLocal = dest.type === 'local';
            return (
              <div
                key={dest.id}
                className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg border ${
                        isConnected
                          ? 'bg-amber-950/30 border-amber-800/40 text-amber-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                      }`}
                    >
                      {isLocal ? <Folder className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-100">{dest.name}</h4>
                      <p className="text-xs font-mono text-zinc-400 truncate max-w-[180px]">
                        {isLocal ? dest.path : `${dest.bucket} (${dest.region || 'default'})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isConnected
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {dest.status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleRemove(dest.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Capacity Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">TOTAL CAPACITY</span>
                    <span className="text-zinc-300 font-semibold">
                      {dest.totalCapacityBytes ? formatBytes(dest.totalCapacityBytes) : 'Self-hosted Host'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">AVAILABLE</span>
                    <span className="text-emerald-400 font-semibold">
                      {dest.availableCapacityBytes ? formatBytes(dest.availableCapacityBytes) : 'Available'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">BACKUPS STORED</span>
                    <span className="text-zinc-300 font-semibold">{dest.backupCount}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">VERIFICATION</span>
                    <span className="text-emerald-400 font-semibold">
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Add Storage Destination</h3>
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
                <label className="block text-xs font-medium text-zinc-300 mb-1">Storage Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Local High-Speed Storage"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Destination Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as StorageType)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="local">Local Filesystem Mount</option>
                  <option value="s3">AWS S3 / S3-Compatible</option>
                  <option value="minio">MinIO Storage</option>
                  <option value="sftp">SFTP Server</option>
                </select>
              </div>

              {type === 'local' ? (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Mount Path</label>
                  <input
                    type="text"
                    required
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="./data/backups or /mnt/backups"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    BackupOps will verify write/read/checksum capabilities on this path.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">S3 Endpoint URL (Optional for AWS)</label>
                    <input
                      type="text"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="minio.internal:9000 or https://s3.amazonaws.com"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Bucket Name</label>
                      <input
                        type="text"
                        required
                        value={bucket}
                        onChange={(e) => setBucket(e.target.value)}
                        placeholder="company-backups"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Region</label>
                      <input
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="us-east-1"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Access Key ID</label>
                      <input
                        type="text"
                        value={accessKeyId}
                        onChange={(e) => setAccessKeyId(e.target.value)}
                        placeholder="AKIA..."
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Secret Access Key</label>
                      <input
                        type="password"
                        value={secretAccessKey}
                        onChange={(e) => setSecretAccessKey(e.target.value)}
                        placeholder="Secret key"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

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
                  disabled={testing}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {testing ? 'Probing...' : 'Test Storage'}
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
