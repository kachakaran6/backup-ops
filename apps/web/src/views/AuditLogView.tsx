import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollText,
  Search,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Info,
  AlertCircle,
} from 'lucide-react';
import { AuditLog } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { FilterBar } from '../components/common/FilterBar';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.fetchAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
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
  }, [logs, severityFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-end gap-2 pb-1">
        <button
          onClick={loadLogs}
          disabled={loading}
          className="op-btn-secondary"
          title="Refresh Audit Log"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-primary' : 'text-text-muted'}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Search audit actions, user, parameters..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={[
          { id: 'all', label: 'All Severities', count: logs.length },
          { id: 'info', label: 'Info', count: logs.filter((l) => l.severity === 'info').length },
          { id: 'warning', label: 'Warning', count: logs.filter((l) => l.severity === 'warning').length },
          { id: 'critical', label: 'Critical', count: logs.filter((l) => l.severity === 'critical').length },
        ]}
        selectedFilter={severityFilter}
        onFilterChange={setSeverityFilter}
        totalCount={logs.length}
        filteredCount={filteredLogs.length}
      />

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit events found"
          description={
            logs.length === 0
              ? 'No audit events recorded yet. Operational activities will be logged immutably.'
              : 'No audit records match the active filter criteria.'
          }
        />
      ) : (
        <div className="op-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Severity</th>
                  <th>Event Details / Context</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-hover transition-colors font-mono">
                    <td className="text-[11px] whitespace-nowrap text-text-muted">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="font-semibold text-text-primary text-xs">
                      {log.action}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold border ${
                          log.severity === 'critical'
                            ? 'bg-error/10 text-error border-error/30'
                            : log.severity === 'warning'
                            ? 'bg-warning/10 text-warning border-warning/30'
                            : 'bg-surface-secondary text-text-muted border-border'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="text-[11px] text-text-secondary max-w-md truncate">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
