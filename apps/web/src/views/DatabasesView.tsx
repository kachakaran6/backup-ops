import React, { useState } from 'react';
import {
  Database as DatabaseIcon,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  Shield,
  X,
} from 'lucide-react';
import { Database } from '../types';
import { EmptyState } from '../components/common/EmptyState';
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Protected & Discovered Databases</h3>
          <p className="text-xs text-zinc-400">
            PostgreSQL, MySQL, and MariaDB instances configured for logical dumps and physical Base + WAL recovery.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
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
            const isConnected = db.status === 'connected';
            return (
              <div
                key={db.id}
                onClick={() => onSelectDatabase(db)}
                className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer space-y-4 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg border ${
                        isConnected
                          ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                      }`}
                    >
                      <DatabaseIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">
                        {db.name}
                      </h4>
                      <p className="text-xs font-mono text-zinc-400">
                        {db.type.toUpperCase()} • {db.databaseName}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {db.status.toUpperCase()}
                  </span>
                </div>

                {/* Specs grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[11px] font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">DATABASE SIZE</span>
                    <span className="text-zinc-300 font-semibold">{formatBytes(db.sizeBytes)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">TABLES</span>
                    <span className="text-zinc-300 font-semibold">{db.tableCount ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">WAL ARCHIVING</span>
                    <span className={db.walEnabled ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                      {db.walEnabled ? 'Active (PITR)' : 'Disabled (Logical)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">RECOVERY</span>
                    <span
                      className={`font-semibold ${
                        db.recoveryReadiness === 'ready'
                          ? 'text-emerald-400'
                          : db.recoveryReadiness === 'degraded'
                          ? 'text-amber-400'
                          : 'text-zinc-500'
                      }`}
                    >
                      {db.recoveryReadiness.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                  <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
                    <span>View Recovery Chain</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerBackup(db);
                    }}
                    className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Backup Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Database Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <DatabaseIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Connect Database</h3>
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
                <label className="block text-xs font-medium text-zinc-300 mb-1">Friendly Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production PostgreSQL"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Host / IP</label>
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Database Name</label>
                <input
                  type="text"
                  required
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  placeholder="production"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Database password"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
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
