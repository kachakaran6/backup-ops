import React, { useState } from 'react';
import {
  Database as DatabaseIcon,
  Plus,
  ChevronRight,
  Shield,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Database } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { StatusIndicator } from '../components/common/StatusIndicator';
import * as api from '../services/api';

interface DatabasesViewProps {
  databases: Database[];
  onRefresh: () => void;
  onSelectDatabase: (database: Database) => void;
  onTriggerBackup: (database: Database) => void;
}

export const DatabasesView: React.FC<DatabasesViewProps> = ({
  databases,
  onRefresh,
  onSelectDatabase,
  onTriggerBackup,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(5432);
  const [databaseName, setDatabaseName] = useState('production');
  const [username, setUsername] = useState('postgres');
  const [password, setPassword] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; version?: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await api.testDatabase('probe');
    setTestResult(res);
    setTesting(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !host || !databaseName) return;
    await api.createDatabase({
      name,
      host,
      port,
      databaseName,
      username,
      password: password || undefined,
    });
    setShowAddModal(false);
    setName('');
    setPassword('');
    setTestResult(null);
    onRefresh();
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
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-text-primary flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4 text-text-muted" />
            Protected & Discovered Databases
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            PostgreSQL, MySQL, and MariaDB instances configured for logical dumps and physical Base + WAL recovery.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="op-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Connect Database</span>
        </button>
      </div>

      {databases.length === 0 ? (
        <EmptyState
          icon={DatabaseIcon}
          title="No databases discovered or connected"
          description="Connect your PostgreSQL or MySQL databases, or sync your Coolify instance to automatically discover database containers running on your servers."
          actionText="Connect Database"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {databases.map((db) => {
            return (
              <div
                key={db.id}
                onClick={() => onSelectDatabase(db)}
                className="op-card p-4 hover:border-border-strong transition-colors cursor-pointer space-y-3 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-md bg-surface-secondary border border-border text-text-muted shrink-0">
                      <DatabaseIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                        {db.name}
                      </h4>
                      <p className="text-[11px] font-mono text-text-muted truncate">
                        {db.type.toUpperCase()} • {db.databaseName}
                      </p>
                    </div>
                  </div>
                  <StatusIndicator status={db.status} variant="inline" />
                </div>

                {/* Specs grid */}
                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-border-subtle text-[11px] font-mono">
                  <div>
                    <span className="text-text-muted block text-[10px]">DATABASE SIZE</span>
                    <span className="text-text-primary font-medium">{formatBytes(db.sizeBytes)}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">TABLES</span>
                    <span className="text-text-primary font-medium">{db.tableCount ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">WAL ARCHIVING</span>
                    <span className={db.walEnabled ? 'text-success font-medium' : 'text-text-muted'}>
                      {db.walEnabled ? 'Active (PITR)' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">RECOVERY</span>
                    <span
                      className={`font-medium ${
                        db.recoveryReadiness === 'ready'
                          ? 'text-success'
                          : db.recoveryReadiness === 'degraded'
                          ? 'text-warning'
                          : 'text-text-muted'
                      }`}
                    >
                      {db.recoveryReadiness.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                  <span className="text-xs text-text-muted group-hover:text-accent font-medium flex items-center gap-1">
                    <span>View Chain</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerBackup(db);
                    }}
                    className="op-btn-secondary !text-xs !py-1 !px-2.5"
                  >
                    <span>Backup Now</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Database Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <DatabaseIcon className="w-4 h-4 text-text-muted" />
                <h3 className="font-semibold text-xs text-text-primary">Connect Database</h3>
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
                <label className="block text-xs font-medium text-text-secondary mb-1">Friendly Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production PostgreSQL"
                  className="op-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-secondary mb-1">Host / IP</label>
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="op-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="op-input font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Database Name</label>
                <input
                  type="text"
                  required
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  placeholder="production"
                  className="op-input font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="op-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Database password"
                    className="op-input font-mono"
                  />
                </div>
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
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
                  Save & Protect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
