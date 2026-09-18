import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  Search,
  FileText,
  X,
  RefreshCw,
  Play,
  Layers,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { Job } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { FilterBar } from '../components/common/FilterBar';
import { LogViewer } from '../components/common/LogViewer';

export const OperationsView: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterState, setFilterState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const loadJobs = async () => {
    try {
      const data = await api.fetchJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(async () => {
      try {
        const data = await api.fetchJobs();
        setJobs(data);
      } catch (err) {
        // silent background polling
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = jobs.filter((j) => j.state === 'running' || j.state === 'planning' || j.state === 'verifying').length;
  const completedCount = jobs.filter((j) => j.state === 'completed').length;
  const failedCount = jobs.filter((j) => j.state === 'failed').length;

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (filterState === 'active' && !(j.state === 'running' || j.state === 'planning' || j.state === 'verifying')) return false;
      if (filterState === 'completed' && j.state !== 'completed') return false;
      if (filterState === 'failed' && j.state !== 'failed') return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          j.id.toLowerCase().includes(q) ||
          j.operationType.toLowerCase().includes(q) ||
          (j.progress?.currentStep && j.progress.currentStep.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [jobs, filterState, searchQuery]);

  const mapJobStatus = (state: string): any => {
    switch (state) {
      case 'running':
      case 'planning':
      case 'verifying':
        return 'RUNNING';
      case 'completed':
        return 'HEALTHY';
      case 'failed':
        return 'FAILED';
      case 'queued':
        return 'QUEUED';
      default:
        return 'UNKNOWN';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-text-primary tracking-tight">
              Operations & Worker Queues
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-secondary border border-border text-text-muted">
              {jobs.length} tracked
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            BullMQ distributed worker queues orchestrating asynchronous database streams, hashing, and restore routines.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadJobs}
            disabled={loading}
            className="op-btn-secondary"
            title="Refresh Operations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-primary' : 'text-text-muted'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Operational Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Total Operations</span>
            <div className="text-lg font-semibold font-mono text-text-primary">{jobs.length}</div>
          </div>
          <Activity className="w-4 h-4 text-text-muted" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-brand-primary uppercase tracking-wider">In-Flight Queue</span>
            <div className="text-lg font-semibold font-mono text-brand-primary">{activeCount}</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-brand-primary ring-4 ring-brand-primary/20"></span>
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-success uppercase tracking-wider">Completed</span>
            <div className="text-lg font-semibold font-mono text-success">{completedCount}</div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-success" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-error uppercase tracking-wider">Failed</span>
            <div className="text-lg font-semibold font-mono text-error">{failedCount}</div>
          </div>
          <XCircle className="w-4 h-4 text-error" />
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Filter operations by ID, step, operation type..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={[
          { id: 'all', label: 'All Jobs', count: jobs.length },
          { id: 'active', label: 'In-Flight', count: activeCount },
          { id: 'completed', label: 'Completed', count: completedCount },
          { id: 'failed', label: 'Failed', count: failedCount },
        ]}
        selectedFilter={filterState}
        onFilterChange={setFilterState}
        totalCount={jobs.length}
        filteredCount={filteredJobs.length}
      />

      {/* Jobs Table */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No operations found"
          description={
            jobs.length === 0
              ? 'No operations have been queued yet. Backups or restores triggered from database views will appear here.'
              : 'No operations match the active filter criteria.'
          }
        />
      ) : (
        <div className="op-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Operation</th>
                  <th>Job ID</th>
                  <th>Status</th>
                  <th>Progress / Step</th>
                  <th>Processed</th>
                  <th>Duration</th>
                  <th>Timestamp</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="cursor-pointer hover:bg-surface-hover transition-colors font-mono"
                  >
                    <td>
                      <span className="uppercase text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-secondary text-text-primary border border-border">
                        {job.operationType}
                      </span>
                    </td>
                    <td className="text-[11px] text-text-muted">
                      {job.id.slice(0, 12)}...
                    </td>
                    <td>
                      <StatusBadge status={mapJobStatus(job.state)} size="sm" />
                    </td>
                    <td>
                      <div className="space-y-1 w-44">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-text-muted truncate max-w-[110px] font-sans">
                            {job.progress?.currentStep || 'Running'}
                          </span>
                          <span className="font-mono text-text-primary">
                            {job.progress?.percentage || 0}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-border">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              job.state === 'completed'
                                ? 'bg-success'
                                : job.state === 'failed'
                                ? 'bg-error'
                                : 'bg-brand-primary'
                            }`}
                            style={{ width: `${job.progress?.percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-text-secondary">
                      {job.progress?.bytesProcessed
                        ? `${(job.progress.bytesProcessed / (1024 * 1024)).toFixed(1)} MB`
                        : '-'}
                    </td>
                    <td className="text-xs text-text-muted">
                      {job.progress?.durationSeconds !== undefined
                        ? `${job.progress.durationSeconds}s`
                        : '-'}
                    </td>
                    <td className="text-xs text-text-muted whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="text-right font-sans" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="op-btn-secondary !text-[11px] !py-1 !px-2.5 flex items-center gap-1 ml-auto"
                      >
                        <FileText className="w-3 h-3 text-brand-primary" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Modal with integrated LogViewer */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl op-card-elevated p-5 shadow-2xl space-y-4 border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-primary" />
                <h3 className="font-semibold text-sm text-text-primary">
                  Operation Telemetry &amp; Logs — <span className="font-mono text-xs text-text-muted">{selectedJob.id}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-surface-secondary rounded border border-border font-mono text-xs">
              <div>
                <span className="text-text-muted block text-[10px]">OPERATION TYPE</span>
                <span className="text-text-primary uppercase font-medium">{selectedJob.operationType}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">CURRENT STATE</span>
                <span className="text-text-primary uppercase font-medium">{selectedJob.state}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">ACTIVE STEP</span>
                <span className="text-text-secondary truncate block">{selectedJob.progress?.currentStep || 'N/A'}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">BYTES PROCESSED</span>
                <span className="text-text-secondary font-mono">
                  {selectedJob.progress?.bytesProcessed ? `${(selectedJob.progress.bytesProcessed / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Terminal Log Viewer */}
            <LogViewer
              title={`Worker Logs [${selectedJob.operationType}]`}
              logs={
                selectedJob.logs && selectedJob.logs.length > 0
                  ? selectedJob.logs.map((l: any) => ({
                      timestamp: l.timestamp || new Date().toISOString(),
                      level: l.level || 'info',
                      component: 'WorkerQueue',
                      message: typeof l === 'string' ? l : l.message,
                    }))
                  : [
                      {
                        timestamp: new Date().toISOString(),
                        level: 'info' as const,
                        component: 'BullMQ',
                        message: `Job ${selectedJob.id} dispatched to worker thread. Step: ${selectedJob.progress?.currentStep || 'initialized'}.`,
                      },
                    ]
              }
            />

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => setSelectedJob(null)}
                className="op-btn-secondary"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
