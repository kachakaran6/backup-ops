import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  Search,
  FileText,
  X,
} from 'lucide-react';
import { Job } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { StatusIndicator } from '../components/common/StatusIndicator';

export const OperationsView: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterState, setFilterState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    const data = await api.fetchJobs();
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(async () => {
      const data = await api.fetchJobs();
      setJobs(data);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filteredJobs = jobs.filter((j) => {
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

  const activeCount = jobs.filter((j) => j.state === 'running' || j.state === 'planning' || j.state === 'verifying').length;
  const completedCount = jobs.filter((j) => j.state === 'completed').length;
  const failedCount = jobs.filter((j) => j.state === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-sm sm:text-base font-semibold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-text-muted" />
            Operations &amp; Asynchronous Jobs
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Real BullMQ worker queue orchestration tracking streaming backups, checksums, and restores.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg op-card">
          <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Total Operations</div>
          <div className="mt-1 text-xl font-semibold text-text-primary font-mono">{jobs.length}</div>
          <div className="text-[10px] text-text-muted mt-0.5">Recorded runs</div>
        </div>
        <div className="p-3.5 rounded-lg op-card">
          <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Active In-Flight</div>
          <div className="mt-1 text-xl font-semibold text-text-primary font-mono">{activeCount}</div>
          <div className="text-[10px] text-warning font-mono mt-0.5">Executing</div>
        </div>
        <div className="p-3.5 rounded-lg op-card">
          <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Completed</div>
          <div className="mt-1 text-xl font-semibold text-text-primary font-mono">{completedCount}</div>
          <div className="text-[10px] text-success font-mono mt-0.5">Succeeded</div>
        </div>
        <div className="p-3.5 rounded-lg op-card">
          <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Failed</div>
          <div className="mt-1 text-xl font-semibold text-text-primary font-mono">{failedCount}</div>
          <div className="text-[10px] text-error font-mono mt-0.5">Errors</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg op-card">
        <div className="relative flex-1 w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by job ID or step..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="op-input pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: `All (${jobs.length})` },
            { id: 'active', label: `Active (${activeCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
            { id: 'failed', label: `Failed (${failedCount})` },
          ].map((tab) => {
            const isSelected = filterState === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterState(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-surface-elevated text-text-primary border-border-strong'
                    : 'bg-transparent text-text-muted hover:text-text-secondary border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Jobs Table */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No Operations Found"
          description={
            jobs.length === 0
              ? 'No operations have been queued or executed yet. Backups or restores triggered from database views will appear here.'
              : 'No operations match the selected filter.'
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-surface overflow-x-auto">
          <table className="op-table">
            <thead>
              <tr>
                <th>Operation</th>
                <th>Job ID</th>
                <th>Status</th>
                <th>Progress / Current Step</th>
                <th>Timing</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <span className="uppercase text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border">
                      {job.operationType}
                    </span>
                  </td>
                  <td className="font-mono text-[11px] text-text-muted">{job.id.slice(0, 12)}...</td>
                  <td>
                    <StatusIndicator status={job.state} variant="inline" />
                  </td>
                  <td>
                    <div className="space-y-1 w-52">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-text-muted truncate max-w-[150px]">{job.progress?.currentStep || 'In progress...'}</span>
                        <span className="font-mono text-text-secondary">{job.progress?.percentage || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-border">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            job.state === 'completed'
                              ? 'bg-success'
                              : job.state === 'failed'
                              ? 'bg-error'
                              : 'bg-accent'
                          }`}
                          style={{ width: `${job.progress?.percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="text-text-muted text-[11px] font-mono whitespace-nowrap">
                    <div>{new Date(job.createdAt).toLocaleTimeString()}</div>
                    {job.progress?.durationSeconds !== undefined && (
                      <div className="text-[10px] text-text-muted">{job.progress.durationSeconds}s elapsed</div>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="op-btn-secondary !text-[11px] !py-1 !px-2.5"
                    >
                      Logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl op-card-elevated p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-text-muted" />
                <h3 className="font-semibold text-xs text-text-primary">
                  Operation Logs — <span className="font-mono text-[11px] text-text-muted">{selectedJob.id}</span>
                </h3>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-surface-secondary rounded-md border border-border font-mono text-[11px]">
                <div>
                  <span className="text-text-muted block text-[10px]">TYPE</span>
                  <span className="text-text-primary uppercase font-medium">{selectedJob.operationType}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">STATE</span>
                  <span className="text-text-primary uppercase font-medium">{selectedJob.state}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">STEP</span>
                  <span className="text-text-secondary truncate block">{selectedJob.progress?.currentStep || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">PROCESSED</span>
                  <span className="text-text-secondary font-mono">{selectedJob.progress?.bytesProcessed ? `${(selectedJob.progress.bytesProcessed / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}</span>
                </div>
              </div>

              <div className="p-3 bg-surface rounded-md border border-border font-mono text-[11px] max-h-60 overflow-y-auto space-y-1">
                {selectedJob.logs && selectedJob.logs.length > 0 ? (
                  selectedJob.logs.map((log: any, idx: number) => (
                    <div key={idx} className="text-text-secondary flex items-start gap-2">
                      <span className="text-text-muted shrink-0">[{new Date(log.timestamp || Date.now()).toLocaleTimeString()}]</span>
                      <span className={log.level === 'error' ? 'text-error' : 'text-text-secondary'}>
                        {typeof log === 'string' ? log : log.message}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-text-muted italic">No log stream entries recorded for this job.</div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => setSelectedJob(null)}
                className="op-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
