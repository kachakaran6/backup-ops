import React, { useState, useMemo } from 'react';
import {
  Database as DatabaseIcon,
  Plus,
  ChevronRight,
  Shield,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowUpDown,
  Server,
  KeyRound,
} from 'lucide-react';
import { Database, DatabaseType } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { FilterBar } from '../components/common/FilterBar';
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
  const [search, setSearch] = useState('');
  const [engineFilter, setEngineFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<DatabaseType>('postgres');
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(5432);
  const [databaseName, setDatabaseName] = useState('production');
  const [username, setUsername] = useState('postgres');
  const [password, setPassword] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; version?: string } | null>(null);

  const handleTypeChange = (newType: DatabaseType) => {
    setType(newType);
    if (newType === 'postgres') setPort(5432);
    else if (newType === 'mysql' || newType === 'mariadb') setPort(3306);
    else if (newType === 'redis') setPort(6379);
    else if (newType === 'mongodb') setPort(27017);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testDatabase('probe');
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Database connection test failed' });
    } finally {
      setTesting(false);
    }
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

  const protectedCount = databases.filter((d) => d.protectionStatus === 'protected').length;
  const pitrCount = databases.filter((d) => d.walEnabled).length;
  const degradedCount = databases.filter((d) => d.status === 'unreachable' || d.recoveryReadiness === 'unhealthy').length;

  const filteredDatabases = useMemo(() => {
    return databases.filter((db) => {
      const matchesSearch =
        search === '' ||
        db.name.toLowerCase().includes(search.toLowerCase()) ||
        db.databaseName.toLowerCase().includes(search.toLowerCase()) ||
        db.host.toLowerCase().includes(search.toLowerCase());

      const matchesEngine =
        engineFilter === 'all' || db.type === engineFilter;

      const matchesStatus =
        statusFilter === 'all' || db.status === statusFilter;

      return matchesSearch && matchesEngine && matchesStatus;
    });
  }, [databases, search, engineFilter, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-end gap-2 pb-1">
        <button
          onClick={onRefresh}
          className="op-btn-secondary"
          title="Refresh Databases"
        >
          <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="op-btn-primary"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Connect Database</span>
        </button>
      </div>

      {/* Operational Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Total Databases</span>
            <div className="text-lg font-semibold font-mono text-text-primary">{databases.length}</div>
          </div>
          <DatabaseIcon className="w-4 h-4 text-text-muted" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-success uppercase tracking-wider">Protected by Policy</span>
            <div className="text-lg font-semibold font-mono text-success">{protectedCount}</div>
          </div>
          <Shield className="w-4 h-4 text-success" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-accent uppercase tracking-wider">Base + WAL (PITR)</span>
            <div className="text-lg font-semibold font-mono text-accent">{pitrCount}</div>
          </div>
          <Layers className="w-4 h-4 text-accent" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-warning uppercase tracking-wider">Attention Required</span>
            <div className="text-lg font-semibold font-mono text-warning">{degradedCount}</div>
          </div>
          <AlertTriangle className="w-4 h-4 text-warning" />
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Filter databases by name, database, host..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: 'Engine',
            options: [
              { label: 'All Engines', value: 'all' },
              { label: 'PostgreSQL', value: 'postgres' },
              { label: 'MySQL', value: 'mysql' },
              { label: 'MariaDB', value: 'mariadb' },
              { label: 'Redis', value: 'redis' },
            ],
            value: engineFilter,
            onChange: setEngineFilter,
          },
          {
            label: 'Status',
            options: [
              { label: 'All Statuses', value: 'all' },
              { label: 'Connected', value: 'connected' },
              { label: 'Disconnected', value: 'disconnected' },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
        totalCount={databases.length}
        filteredCount={filteredDatabases.length}
      />

      {/* High-Density Data Table */}
      {databases.length === 0 ? (
        <EmptyState
          icon={DatabaseIcon}
          title="No databases configured"
          description="Connect your PostgreSQL or MySQL databases, or sync your Coolify instance to automatically discover database containers."
          actionText="Connect Database"
          onAction={() => setShowAddModal(true)}
        />
      ) : filteredDatabases.length === 0 ? (
        <div className="op-card p-8 text-center">
          <p className="text-xs text-text-muted">No databases match the active filter criteria.</p>
          <button
            onClick={() => {
              setSearch('');
              setEngineFilter('all');
              setStatusFilter('all');
            }}
            className="op-btn-ghost mt-2 text-xs"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="op-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Database</th>
                  <th>Engine</th>
                  <th>Host / Endpoint</th>
                  <th>Size</th>
                  <th>Protection Strategy</th>
                  <th>WAL / PITR</th>
                  <th>Status</th>
                  <th>Recovery Readiness</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDatabases.map((db) => {
                  return (
                    <tr
                      key={db.id}
                      onClick={() => onSelectDatabase(db)}
                      className="cursor-pointer hover:bg-surface-hover transition-colors group"
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-surface-secondary border border-border flex items-center justify-center shrink-0 text-text-muted group-hover:text-brand-primary transition-colors">
                            <DatabaseIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-text-primary group-hover:text-brand-primary transition-colors truncate">
                              {db.name}
                            </div>
                            <div className="text-[10px] font-mono text-text-muted truncate">
                              Instance: {db.databaseName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-mono uppercase text-text-secondary">
                          {db.type}
                        </span>
                      </td>
                      <td>
                        <div className="font-mono text-xs text-text-secondary truncate">
                          {db.host}:{db.port}
                        </div>
                      </td>
                      <td>
                        <div className="font-mono text-xs text-text-primary font-medium">
                          {formatBytes(db.sizeBytes)}
                        </div>
                        {db.tableCount ? (
                          <div className="text-[10px] font-mono text-text-muted">
                            {db.tableCount} tables
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <span className="text-xs font-medium text-text-secondary capitalize">
                          {db.protectionStatus}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-mono text-text-muted">
                          {db.walEnabled ? 'PITR Active' : 'Logical only'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge
                          status={
                            db.status === 'connected'
                              ? 'HEALTHY'
                              : db.status === 'unreachable'
                              ? 'FAILED'
                              : db.status === 'disconnected'
                              ? 'OFFLINE'
                              : 'UNKNOWN'
                          }
                          size="sm"
                        />
                      </td>
                      <td>
                        <span className="text-xs font-mono capitalize text-text-secondary">
                          {db.recoveryReadiness}
                        </span>
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onTriggerBackup(db)}
                            className="op-btn-secondary !text-[11px] !py-1 !px-2 flex items-center gap-1"
                            title="Trigger Immediate Backup"
                          >
                            <Shield className="w-3 h-3 text-brand-primary" />
                            <span>Backup</span>
                          </button>
                          <button
                            onClick={() => onSelectDatabase(db)}
                            className="op-btn-ghost !p-1 text-text-muted hover:text-text-primary"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Connect Database Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-lg w-full p-5 space-y-4 shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-surface-secondary text-brand-primary border border-border">
                  <DatabaseIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-text-primary">Connect Database Workload</h3>
                  <p className="text-[11px] text-text-muted">Enables continuous WAL streaming, dumps, and automated verification.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Database Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Primary Production DB"
                  className="op-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Engine Type</label>
                <select
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value as DatabaseType)}
                  className="op-input"
                >
                  <option value="postgres">PostgreSQL (Base Backup + WAL Archiving)</option>
                  <option value="mysql">MySQL (mysqldump / physical snapshot)</option>
                  <option value="mariadb">MariaDB (Logical Dump)</option>
                  <option value="redis">Redis (RDB snapshot)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-secondary mb-1">Host / IP Address</label>
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="127.0.0.1 or db.internal"
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

              <div className="grid grid-cols-2 gap-2.5">
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
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">User</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="postgres"
                    className="op-input font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Database user password"
                  className="op-input font-mono"
                />
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-md text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-success/10 text-success border border-success/30'
                      : 'bg-error/10 text-error border border-error/30'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="font-mono text-[11px]">{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !host}
                  className="op-btn-secondary"
                >
                  {testing ? 'Testing Handshake...' : 'Test Connection'}
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
                    Save & Protect
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
