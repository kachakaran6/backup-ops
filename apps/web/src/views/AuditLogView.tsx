import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  RefreshCw,
} from 'lucide-react';
import { AuditLog } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { StatusIndicator } from '../components/common/StatusIndicator';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-sm sm:text-base font-semibold text-text-primary flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-text-muted" />
            Security & Operational Audit Log
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Immutable audit record of administrative operations, credential access, destructive restores, and synchronization events.
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="op-btn-secondary self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : 'text-text-muted'}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-border">
        <div className="relative flex-1 w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search action or parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="op-input pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['all', 'info', 'warning', 'critical'].map((sev) => {
            const isSelected = severityFilter === sev;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border cursor-pointer ${
                  isSelected
                    ? 'bg-surface-elevated text-text-primary border-border-strong'
                    : 'bg-transparent text-text-muted hover:text-text-secondary border-transparent'
                }`}
              >
                {sev === 'all' ? 'All Severities' : sev.charAt(0).toUpperCase() + sev.slice(1)}
              </button>
            );
          })}
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
        <div className="rounded-lg border border-border bg-surface overflow-x-auto">
          <table className="op-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Severity</th>
                <th>Operation Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="font-mono text-[11px] whitespace-nowrap text-text-muted">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="font-mono font-medium text-text-primary text-[11px]">
                    {log.action}
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold border ${
                        log.severity === 'critical'
                          ? 'bg-error-muted text-error border-error/30'
                          : log.severity === 'warning'
                          ? 'bg-warning-muted text-warning border-warning/30'
                          : 'bg-surface-secondary text-text-muted border-border'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="font-mono text-[11px] text-text-secondary max-w-md truncate">
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
