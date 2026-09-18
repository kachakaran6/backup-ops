import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Shield,
  Search,
  Filter,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { AuditLog } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const loadLogs = async () => {
    setLoading(true);
    const data = await api.fetchAuditLogs();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        JSON.stringify(log.details).toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-blue-400" />
            Security & Operational Audit Log
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Immutable audit record of all administrative operations, credential access, destructive restores, and synchronization events.
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
        <div className="relative flex-1 sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search action or parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              severityFilter === 'all'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Severities
          </button>
          <button
            onClick={() => setSeverityFilter('info')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              severityFilter === 'info'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setSeverityFilter('warning')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              severityFilter === 'warning'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Warning
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              severityFilter === 'critical'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Critical
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No Audit Entries Found"
          description={
            logs.length === 0
              ? 'No audit events recorded yet. Operational activities will be logged immutably.'
              : 'No audit records match your search criteria.'
          }
        />
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Operation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-900/40 transition">
                  <td className="px-5 py-3.5 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-zinc-100 font-mono text-[11px]">
                    {log.action}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                        log.severity === 'critical'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : log.severity === 'warning'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400 max-w-md truncate">
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
