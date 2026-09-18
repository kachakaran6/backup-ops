import React, { useState } from 'react';
import {
  ShieldCheck,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  Clock,
  HardDrive,
  Database,
  X,
  Lock,
} from 'lucide-react';
import { Backup, BackupChain, Database as DatabaseType, StorageDestination, Policy } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import * as api from '../services/api';

interface BackupsViewProps {
  backups: Backup[];
  chains: BackupChain[];
  databases: DatabaseType[];
  storageDestinations: StorageDestination[];
  policies: Policy[];
  onRefresh: () => void;
  onRestore: (backup: Backup) => void;
}

export const BackupsView: React.FC<BackupsViewProps> = ({
  backups,
  chains,
  databases,
  storageDestinations,
  policies,
  onRefresh,
  onRestore,
}) => {
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [selectedDbId, setSelectedDbId] = useState(databases[0]?.id || '');
  const [selectedStorageId, setSelectedStorageId] = useState(storageDestinations[0]?.id || '');
  const [compression, setCompression] = useState<'none' | 'gzip' | 'zstd'>('zstd');
  const [encryption, setEncryption] = useState<'none' | 'aes_256_gcm'>('aes_256_gcm');
  const [triggering, setTriggering] = useState(false);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDbId || !selectedStorageId) return;
    setTriggering(true);
    await api.triggerBackup({
      sourceDatabaseId: selectedDbId,
      destinationStorageId: selectedStorageId,
      compression,
      encryption,
    });
    setTriggering(false);
    setShowTriggerModal(false);
    onRefresh();
  };

  const handleVerify = async (id: string) => {
    await api.verifyBackup(id);
    onRefresh();
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Backup Policies & Artifacts</h3>
          <p className="text-xs text-zinc-400">
            Policy-driven database protection, verification checkpoints, and retained backup archives.
          </p>
        </div>
        <button
          onClick={() => {
            if (databases.length > 0) setSelectedDbId(databases[0].id);
            if (storageDestinations.length > 0) setSelectedStorageId(storageDestinations[0].id);
            setShowTriggerModal(true);
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Trigger Backup Job</span>
        </button>
      </div>

      {/* Backup History Table / List */}
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
            Retained Backup Archives ({backups.length})
          </h4>
          <span className="text-[11px] font-mono text-zinc-500">AES-256-GCM Encrypted</span>
        </div>

        {backups.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No backups executed yet"
            description="Trigger an immediate backup or configure a recurring backup policy to start protecting your database workloads."
            actionText="Trigger Backup Job"
            onAction={() => setShowTriggerModal(true)}
          />
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-400 text-[10px] font-bold uppercase">
                      {backup.type}
                    </span>
                    <span className="font-semibold text-zinc-200 text-xs truncate max-w-sm">
                      {backup.storagePath}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                    <span>Size: {formatBytes(backup.sizeBytes)}</span>
                    <span>•</span>
                    <span title={backup.checksumSha256}>
                      SHA-256: {backup.checksumSha256?.slice(0, 16)}...
                    </span>
                    <span>•</span>
                    <span>{new Date(backup.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border ${
                      backup.verificationState === 'checksum_verified'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{backup.verificationState}</span>
                  </span>

                  <button
                    onClick={() => handleVerify(backup.id)}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Verify
                  </button>

                  <button
                    onClick={() => onRestore(backup)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trigger Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Trigger Asynchronous Backup</h3>
              </div>
              <button
                onClick={() => setShowTriggerModal(false)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTrigger} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Source Database</label>
                <select
                  value={selectedDbId}
                  onChange={(e) => setSelectedDbId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  {databases.map((db) => (
                    <option key={db.id} value={db.id}>
                      {db.name} ({db.type} • {db.databaseName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Destination Storage</label>
                <select
                  value={selectedStorageId}
                  onChange={(e) => setSelectedStorageId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  {storageDestinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name} ({dest.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Compression</label>
                  <select
                    value={compression}
                    onChange={(e) => setCompression(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="zstd">Zstandard (ZSTD) - Fast & High Ratio</option>
                    <option value="gzip">Gzip (Standard)</option>
                    <option value="none">None (Raw stream)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Encryption</label>
                  <select
                    value={encryption}
                    onChange={(e) => setEncryption(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="aes_256_gcm">AES-256-GCM (Encrypted at rest)</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  className="px-3.5 py-1.5 bg-transparent hover:bg-zinc-800 text-zinc-400 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={triggering}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {triggering ? 'Starting BullMQ Job...' : 'Queue Backup Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
